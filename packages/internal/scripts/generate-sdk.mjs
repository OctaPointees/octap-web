#!/usr/bin/env node
/**
 * Generates the endpoint classes and DTO types in `src/generated` from `docs/openapi.json`.
 *
 * Usage (from packages/internal):
 *   node scripts/generate-sdk.mjs                      regenerate from the committed spec
 *   node scripts/generate-sdk.mjs --spec <path>        copy a newer spec into docs/ first, then regenerate
 *
 * `npm run generate` also runs Prettier on the output so it matches the repo's formatting.
 */
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const committedSpec = join(packageRoot, 'docs', 'openapi.json');

const { values: args } = parseArgs({
  options: {
    spec: { type: 'string' },
    out: { type: 'string', default: join(packageRoot, 'src', 'generated') },
  },
});

if (args.spec !== undefined && resolve(args.spec) !== committedSpec) {
  copyFileSync(resolve(args.spec), committedSpec);
  console.log(`Copied ${args.spec} to docs/openapi.json`);
}

const spec = JSON.parse(readFileSync(committedSpec, 'utf8'));
const outputDirectory = resolve(args.out);
mkdirSync(outputDirectory, { recursive: true });
for (const file of readdirSync(outputDirectory)) {
  if (file.endsWith('.ts')) rmSync(join(outputDirectory, file));
}

const upperFirst = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const lowerFirst = (value) => value.charAt(0).toLowerCase() + value.slice(1);

function getRefName(schema) {
  const ref = schema?.$ref;
  return typeof ref === 'string' ? ref.split('/').at(-1) : null;
}

function getTypeName(name) {
  const match = /^(?<controller>.+)Controller_(?<action>[^_]+)_(?<kind>Body|Response|Query)$/.exec(
    name,
  );
  if (match === null) return name;
  const { controller, action, kind } = match.groups;
  const kindName = kind === 'Body' ? 'Input' : kind === 'Query' ? 'Params' : 'Response';
  return `${controller}${upperFirst(action)}${kindName}`;
}

function toTsLiteral(value) {
  if (typeof value === 'string') return `'${value.replaceAll("'", "\\'")}'`;
  if (value === null) return 'null';
  return String(value);
}

function convertSchemaType(schema) {
  if (schema === undefined || schema === null) return 'unknown';
  const refName = getRefName(schema);
  if (refName !== null) return getTypeName(refName);
  for (const unionKey of ['oneOf', 'anyOf']) {
    if (Array.isArray(schema[unionKey])) {
      return [...new Set(schema[unionKey].map(convertSchemaType))].join(' | ');
    }
  }
  if (Array.isArray(schema.allOf)) return schema.allOf.map(convertSchemaType).join(' & ');
  if (Array.isArray(schema.enum)) return schema.enum.map(toTsLiteral).join(' | ');
  if (Array.isArray(schema.type)) {
    return [...new Set(schema.type.map((type) => convertSchemaType({ type })))].join(' | ');
  }
  switch (schema.type) {
    case 'string':
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'null':
      return 'null';
    case 'array':
      return `Array<${convertSchemaType(schema.items)}>`;
    case 'object': {
      if (schema.properties === undefined || schema.properties === null) {
        const extra = schema.additionalProperties;
        if (extra !== undefined && extra !== null && typeof extra !== 'boolean') {
          return `Record<string, ${convertSchemaType(extra)}>`;
        }
        return 'Record<string, unknown>';
      }
      const required = new Set(schema.required ?? []);
      const members = Object.entries(schema.properties).map(
        ([name, property]) =>
          `  ${name}${required.has(name) ? '' : '?'}: ${convertSchemaType(property)};`,
      );
      return `{\n${members.join('\n')}\n}`;
    }
    default:
      return 'unknown';
  }
}

function getSuccessSchema(operation) {
  for (const [status, response] of Object.entries(operation.responses ?? {})) {
    const schema = response?.content?.['application/json']?.schema;
    if (status.startsWith('2') && schema !== undefined) return schema;
  }
  return null;
}

/** Endpoint group (and so the generated file and `client.<group>`) for an operation. */
const groupRules = [
  [/^Console/, 'console'],
  [/^Platform/, 'platform'],
  [/^MembersController/, 'console'],
  // Merchant routes, server-side with an API key: they belong to `@octap/sdk`, not this browser
  // client. This also skips their two public POS finalize routes, which are part of the same flow.
  [/^(Credits|Rewards|Webhooks)/, null],
  // MCP OAuth (`/oauth/*`, `/.well-known/*`): an MCP host signs in through these, not the portals.
  [/^McpOAuth/, null],
  [/^Health/, 'health'],
  [/^OrganizationResolution/, 'organizations'],
  [/^(IdentityController|CustomerVerificationController)/, 'identity'],
];

/** The operation's group, or `null` when this client doesn't cover it. */
function getOperationGroup(operationId) {
  const rule = groupRules.find(([pattern]) => pattern.test(operationId));
  return rule === undefined ? 'auth' : rule[1];
}

/**
 * Whether every way to call the operation needs a merchant API key. This client only sends the
 * console user's Google ID token, so from a browser such a call is always a 401.
 */
function requiresApiKey(operation) {
  const requirements = operation.security ?? spec.security ?? [];
  return (
    requirements.length > 0 &&
    requirements.every((requirement) => Object.keys(requirement).includes('apiKey'))
  );
}

const resourceActions = new Set(['list', 'detail', 'create', 'read', 'update', 'provision']);

function getMethodName(operationId, forceResource = false) {
  const parts = operationId.split('_');
  const action = parts.at(-1);
  const controller = parts[0].replace(/^(Platform|Console)/, '').replace(/Controller$/, '');
  const [first, ...rest] = controller
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .split('-');
  const resource = first + rest.map(upperFirst).join('');
  if (forceResource || resourceActions.has(action)) return action + upperFirst(resource);
  return lowerFirst(action);
}

function headerPropertyName(headerName) {
  const [first, ...rest] = headerName.replace(/^x-/i, '').split('-');
  return first.toLowerCase() + rest.map(upperFirst).join('');
}

// DTO types.
const schemaLines = ['/** Types generated from the OctaP OpenAPI document. */'];
for (const [name, schema] of Object.entries(spec.components?.schemas ?? {})) {
  const typeName = getTypeName(name);
  const type = convertSchemaType(schema);
  // An object with no properties is an empty body (`Record<string, never>`): `{}` would allow any value.
  if (
    schema.type === 'object' &&
    schema.properties !== null &&
    typeof schema.properties === 'object' &&
    Object.keys(schema.properties).length === 0 &&
    schema.additionalProperties === undefined
  ) {
    schemaLines.push(`export type ${typeName} = Record<string, never>;`);
  } else if (
    schema.type === 'object' &&
    schema.properties !== undefined &&
    schema.properties !== null &&
    Object.keys(schema.properties).length > 0
  ) {
    schemaLines.push(`export interface ${typeName} ${type}`);
  } else {
    schemaLines.push(`export type ${typeName} = ${type};`);
  }
  schemaLines.push('');
}
writeFileSync(join(outputDirectory, 'openapi.ts'), schemaLines.join('\n'));

// Endpoint classes, one per group.
const httpMethods = new Set(['get', 'post', 'put', 'patch', 'delete']);
/** @type {Map<string, Array<{ name: string; source: string }>>} */
const groups = new Map();

for (const [rawPath, pathItem] of Object.entries(spec.paths ?? {})) {
  for (const [httpMethod, operation] of Object.entries(pathItem)) {
    if (!httpMethods.has(httpMethod) || requiresApiKey(operation)) continue;
    const group = getOperationGroup(operation.operationId);
    if (group === null) continue;
    if (!groups.has(group)) groups.set(group, []);
    const methods = groups.get(group);

    const parameters = (operation.parameters ?? []).map((parameter) => {
      const ref = getRefName(parameter);
      return ref === null ? parameter : spec.components.parameters[ref];
    });

    const properties = [];
    const queryLines = [];
    const headerLines = [];
    let path = rawPath;
    for (const parameter of parameters) {
      const propertyType = convertSchemaType(parameter.schema);
      const tsName =
        parameter.in === 'header' ? headerPropertyName(parameter.name) : parameter.name;
      properties.push(`  ${tsName}${parameter.required ? '' : '?'}: ${propertyType};`);
      if (parameter.in === 'query') {
        queryLines.push(`          ${parameter.name}: input.${tsName},`);
      } else if (parameter.in === 'header') {
        headerLines.push(
          `          ...(input.${tsName} !== undefined ? { '${parameter.name}': input.${tsName} } : {}),`,
        );
      } else if (parameter.in === 'path') {
        path = path.replace(
          `{${parameter.name}}`,
          () => `\${encodeURIComponent(input.${parameter.name})}`,
        );
      }
    }

    let bodyType = null;
    const bodySchema = operation.requestBody?.content?.['application/json']?.schema;
    if (bodySchema !== undefined) {
      const bodyRef = getRefName(bodySchema);
      bodyType =
        bodyRef === null ? convertSchemaType(bodySchema) : `OpenApi.${getTypeName(bodyRef)}`;
    }

    const hasParameters = properties.length > 0;
    let inputType = null;
    if (bodyType !== null && !hasParameters) {
      inputType = bodyType;
    } else {
      if (bodyType !== null) {
        properties.push(`  body${operation.requestBody.required ? '' : '?'}: ${bodyType};`);
      }
      if (properties.length > 0) inputType = `{\n${properties.join('\n')}\n}`;
    }

    const responseSchema = getSuccessSchema(operation);
    const responseRef = getRefName(responseSchema);
    const resultType =
      responseRef === null
        ? convertSchemaType(responseSchema)
        : `OpenApi.${getTypeName(responseRef)}`;

    let methodName = getMethodName(operation.operationId);
    if (methods.some((method) => method.name === methodName)) {
      methodName = getMethodName(operation.operationId, true);
    }

    const summary = operation.summary?.trim()
      ? operation.summary
      : `Sends a ${httpMethod.toUpperCase()} request to ${rawPath}.`;
    const inputDeclaration = inputType === null ? '' : `input: ${inputType}`;
    const bodyArgument = hasParameters ? 'input.body' : 'input';
    const lines = [
      `  /** ${summary.replace(/[\r\n]+/g, ' ')} */`,
      `  ${methodName}(${inputDeclaration}): Promise<OctapResponse<${resultType}>> {`,
      `    return this.request<${resultType}>({`,
      `      method: '${httpMethod}',`,
      `      url: \`${path}\`,`,
    ];
    if (queryLines.length > 0) lines.push('        params: {', ...queryLines, '        },');
    if (headerLines.length > 0) lines.push('        headers: {', ...headerLines, '        },');
    if (bodyType !== null) lines.push(`      data: ${bodyArgument},`);
    lines.push('    });', '  }');
    methods.push({ name: methodName, source: lines.join('\n') });
  }
}

for (const [group, methods] of groups) {
  const file = [
    "import type { OctapResponse } from '../types.js';",
    "import { ApiGroup } from '../lib/api-group.js';",
    "import type { HttpClient } from '../lib/http.js';",
    "import type * as OpenApi from './openapi.js';",
    '',
    `/** OpenAPI endpoint methods for the ${group} API group. */`,
    `export class ${upperFirst(group)}Api extends ApiGroup {`,
    '  constructor(http: HttpClient) { super(http); }',
    ...methods.map((method) => method.source),
    '}',
  ];
  writeFileSync(join(outputDirectory, `${group}.ts`), file.join('\n'));
}

console.log(`Generated ${groups.size} endpoint groups in ${outputDirectory}`);

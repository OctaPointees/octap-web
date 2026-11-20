param(
  [string]$SpecPath = "docs/openapi.json",
  [string]$OutputDirectory = "src/generated"
)

$ErrorActionPreference = 'Stop'
$spec = Get-Content -LiteralPath $SpecPath -Raw | ConvertFrom-Json
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
Get-ChildItem -LiteralPath $OutputDirectory -Filter '*.ts' -File -ErrorAction SilentlyContinue | Remove-Item -Force

function Get-RefName($schema) {
  if ($null -ne $schema.'$ref') { return ($schema.'$ref' -split '/')[-1] }
  return $null
}

function Get-TypeName([string]$name) {
  if ($name -match '^(?<controller>.+)Controller_(?<action>[^_]+)_(?<kind>Body|Response|Query)$') {
    $kindName = switch ($Matches.kind) {
      'Body' { 'Input' }
      'Query' { 'Params' }
      default { 'Response' }
    }
    $action = $Matches.action
    $action = $action.Substring(0, 1).ToUpperInvariant() + $action.Substring(1)
    return "$($Matches.controller)$action$kindName"
  }
  return $name
}

function Convert-SchemaType($schema) {
  if ($null -eq $schema) { return 'unknown' }
  $refName = Get-RefName $schema
  if ($null -ne $refName) { return (Get-TypeName $refName) }
  foreach ($unionKey in @('oneOf', 'anyOf')) {
    if ($null -ne $schema.$unionKey) {
      $unionTypes = @($schema.$unionKey | ForEach-Object { Convert-SchemaType $_ } | Select-Object -Unique)
      return ($unionTypes -join ' | ')
    }
  }
  if ($null -ne $schema.allOf) {
    return (($schema.allOf | ForEach-Object { Convert-SchemaType $_ }) -join ' & ')
  }
  if ($null -ne $schema.enum) {
    return (($schema.enum | ForEach-Object { ConvertTo-TsLiteral $_ }) -join ' | ')
  }
  if ($schema.type -is [array]) {
    return (($schema.type | ForEach-Object { Convert-SchemaType ([PSCustomObject]@{type=$_}) } | Select-Object -Unique) -join ' | ')
  }
  switch ($schema.type) {
    'string' { return 'string' }
    'number' { return 'number' }
    'integer' { return 'number' }
    'boolean' { return 'boolean' }
    'null' { return 'null' }
    'array' { return "Array<$(Convert-SchemaType $schema.items)>" }
    'object' {
      if ($null -eq $schema.properties) {
        if ($null -ne $schema.additionalProperties -and $schema.additionalProperties -isnot [bool]) {
          return "Record<string, $(Convert-SchemaType $schema.additionalProperties)>"
        }
        return 'Record<string, unknown>'
      }
      $required = @($schema.required)
      $members = foreach ($property in $schema.properties.PSObject.Properties) {
        $optional = if ($required -contains $property.Name) { '' } else { '?' }
        "  $($property.Name)$optional`: $(Convert-SchemaType $property.Value);"
      }
      return "{`n$($members -join "`n")`n}"
    }
    default { return 'unknown' }
  }
}

function ConvertTo-TsLiteral($value) {
  if ($value -is [string]) { return "'$(($value -replace "'", "\'"))'" }
  if ($value -is [bool]) { return ([string]$value).ToLowerInvariant() }
  if ($null -eq $value) { return 'null' }
  return [string]$value
}

function Get-SuccessSchema($operation) {
  foreach ($response in $operation.responses.PSObject.Properties) {
    if ($response.Name -match '^2') {
      $json = $response.Value.content.'application/json'.schema
      if ($null -ne $json) { return $json }
    }
  }
  return $null
}

function Get-OperationGroup($operationId) {
  if ($operationId -like 'Console*') { return 'console' }
  if ($operationId -like 'Platform*') { return 'platform' }
  if ($operationId -like 'MembersController*') { return 'console' }
  if ($operationId -like 'Credits*') { return 'credits' }
  if ($operationId -like 'Rewards*') { return 'rewards' }
  if ($operationId -like 'Webhooks*') { return 'webhooks' }
  if ($operationId -like 'Health*') { return 'health' }
  if ($operationId -like 'OrganizationResolution*') { return 'organizations' }
  if ($operationId -like 'IdentityController*' -or $operationId -like 'CustomerVerificationController*') { return 'identity' }
  return 'auth'
}

function Get-MethodName($operationId, [bool]$forceResource = $false) {
  $parts = $operationId -split '_'
  $action = $parts[-1]
  $controller = $parts[0] -replace '^(Platform|Console)', '' -replace 'Controller$', ''
  $resourceParts = ($controller -creplace '([a-z0-9])([A-Z])', '$1-$2').ToLowerInvariant() -split '-'
  $resource = $resourceParts[0]
  for ($resourceIndex = 1; $resourceIndex -lt $resourceParts.Count; $resourceIndex++) {
    $resource += $resourceParts[$resourceIndex].Substring(0, 1).ToUpperInvariant() + $resourceParts[$resourceIndex].Substring(1)
  }
  if ($forceResource -or $action -in @('list', 'detail', 'create', 'read', 'update', 'provision')) {
    return $action + $resource.Substring(0, 1).ToUpperInvariant() + $resource.Substring(1)
  }
  return $action.Substring(0, 1).ToLowerInvariant() + $action.Substring(1)
}

$schemaLines = [System.Collections.Generic.List[string]]::new()
$schemaLines.Add('/** Types generated from the OctaP OpenAPI document. */')
foreach ($schemaEntry in $spec.components.schemas.PSObject.Properties) {
  $schema = $schemaEntry.Value
  $typeName = Get-TypeName $schemaEntry.Name
  $type = Convert-SchemaType $schema
  if ($schema.type -eq 'object' -and $null -ne $schema.properties) {
    $schemaLines.Add("export interface $typeName $type")
  } else {
    $schemaLines.Add("export type $typeName = $type;")
  }
  $schemaLines.Add('')
}
[System.IO.File]::WriteAllText((Join-Path $OutputDirectory 'openapi.ts'), ($schemaLines -join "`n"), [System.Text.UTF8Encoding]::new($false))

$groups = @{}
foreach ($pathEntry in $spec.paths.PSObject.Properties) {
  foreach ($methodEntry in $pathEntry.Value.PSObject.Properties) {
    if ($methodEntry.Name -notin @('get', 'post', 'put', 'patch', 'delete')) { continue }
    $operation = $methodEntry.Value
    $group = Get-OperationGroup $operation.operationId
    if (-not $groups.ContainsKey($group)) { $groups[$group] = [System.Collections.Generic.List[string]]::new() }

    $parameters = [System.Collections.Generic.List[object]]::new()
    foreach ($parameter in $operation.parameters) {
      $parameterRef = Get-RefName $parameter
      if ($null -ne $parameterRef) { $parameter = $spec.components.parameters.$parameterRef }
      $parameters.Add($parameter)
    }

    $properties = [System.Collections.Generic.List[string]]::new()
    $queryLines = [System.Collections.Generic.List[string]]::new()
    $headerLines = [System.Collections.Generic.List[string]]::new()
    $path = $pathEntry.Name
    foreach ($parameter in $parameters) {
      $propertyType = Convert-SchemaType $parameter.schema
      $optional = if ($parameter.required) { '' } else { '?' }
      $typescriptName = $parameter.name
      if ($parameter.in -eq 'header') {
        $parts = ($parameter.name -replace '^[Xx]-', '') -split '-'
        $typescriptName = $parts[0].ToLowerInvariant()
        for ($partIndex = 1; $partIndex -lt $parts.Count; $partIndex++) {
          $typescriptName += $parts[$partIndex].Substring(0, 1).ToUpperInvariant() + $parts[$partIndex].Substring(1)
        }
      }
      $properties.Add("  $typescriptName$optional`: $propertyType;")
      if ($parameter.in -eq 'query') { $queryLines.Add("          $($parameter.name): input.$typescriptName,") }
      if ($parameter.in -eq 'header') { $headerLines.Add("          ...(input.$typescriptName !== undefined ? { '$($parameter.name)': input.$typescriptName } : {}),") }
      if ($parameter.in -eq 'path') {
        $replacement = '${encodeURIComponent(input.' + $parameter.name + ')}'
        $path = $path.Replace("{$($parameter.name)}", $replacement)
      }
    }

    $bodyType = $null
    $bodySchema = $operation.requestBody.content.'application/json'.schema
    if ($null -ne $bodySchema) {
      $bodyType = Convert-SchemaType $bodySchema
      $bodyRef = Get-RefName $bodySchema
      if ($null -ne $bodyRef) { $bodyType = "OpenApi.$(Get-TypeName $bodyRef)" }
    }
    $bodyRequired = $operation.requestBody.required
    if ($null -ne $bodyType) {
      if ($properties.Count -eq 0) {
        $inputType = $bodyType
      } else {
        $optional = if ($bodyRequired) { '' } else { '?' }
        $properties.Add("  body$optional`: $bodyType;")
        $inputType = "{`n$($properties -join "`n")`n}"
      }
    } elseif ($properties.Count -gt 0) {
      $inputType = "{`n$($properties -join "`n")`n}"
    } else { $inputType = $null }

    $responseSchema = Get-SuccessSchema $operation
    $responseType = Convert-SchemaType $responseSchema
    $responseName = "$(($operation.operationId -replace '[^A-Za-z0-9_]', '_'))Result"
    $schemaRef = Get-RefName $responseSchema
    if ($null -ne $schemaRef) { $responseType = "OpenApi.$(Get-TypeName $schemaRef)" }
    $resultType = if ($responseType -eq 'unknown') { 'unknown' } else { $responseType }
    $methodName = Get-MethodName $operation.operationId
    $existingMethods = @($groups[$group] | ForEach-Object { if ($_ -match '(?m)^  ([A-Za-z][A-Za-z0-9]*)\(') { $Matches[1] } })
    if ($existingMethods -contains $methodName) {
      $methodName = Get-MethodName $operation.operationId $true
    }
    $urlLine = '      url: `' + $path + '`,'
    $docText = $operation.summary
    if ([string]::IsNullOrWhiteSpace($docText)) {
      $docText = "Sends a $($methodEntry.Name.ToUpperInvariant()) request to $($pathEntry.Name)."
    }
    $inputDeclaration = if ($null -eq $inputType) { '' } else { "input: $inputType" }
    $bodyArgument = if ($null -ne $bodyType) {
      if ($properties.Count -eq 0) { 'input' } else { 'input.body' }
    } else { 'undefined' }
    $queryObject = if ($queryLines.Count -gt 0) { "        params: {`n$($queryLines -join "`n")`n        },`n" } else { '' }
    $headersObject = if ($headerLines.Count -gt 0) { "        headers: {`n$($headerLines -join "`n")`n        },`n" } else { '' }
    $tsMethod = @"
  /** $($docText -replace '[\r\n]+', ' ') */
  $methodName($inputDeclaration): Promise<OctapResponse<$resultType>> {
    return this.request<$resultType>({
      method: '$($methodEntry.Name)',
$urlLine
$queryObject$headersObject$(if ($null -ne $bodyType) { "      data: $bodyArgument,`n" } else { '' })    });
  }
"@
    $groups[$group].Add($tsMethod)
  }
}

foreach ($group in $groups.Keys) {
  $className = (Get-Culture).TextInfo.ToTitleCase($group) + 'Api'
  $fileLines = @(
    "import type { OctapResponse } from '../types.js';",
    "import { ApiGroup } from '../lib/api-group.js';",
    "import type { HttpClient } from '../lib/http.js';",
    "import type * as OpenApi from './openapi.js';",
    '',
    "/** OpenAPI endpoint methods for the $group API group. */",
    "export class $className extends ApiGroup {",
    '  constructor(http: HttpClient) { super(http); }',
    ($groups[$group] -join "`n"),
    '}'
  )
  [System.IO.File]::WriteAllText((Join-Path $OutputDirectory "$group.ts"), ($fileLines -join "`n"), [System.Text.UTF8Encoding]::new($false))
}

# Format the generated files so they match the repo's Prettier config.
npx --no-install prettier --write $OutputDirectory
if ($LASTEXITCODE -ne 0) { throw "Prettier failed to format $OutputDirectory" }

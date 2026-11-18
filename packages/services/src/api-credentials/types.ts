/** An organization's API credential. The raw key is only returned when it is issued. */
export interface ConsoleCredential {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  status: string;
  createdAt: string | null;
  lastUsedAt: string | null;
}

export interface IssuedConsoleCredential extends ConsoleCredential {
  rawKey: string;
}

/** The credential as Core may send it: only identity fields are guaranteed. */
export type RawConsoleCredential = Pick<
  ConsoleCredential,
  'id' | 'name' | 'keyPrefix' | 'status'
> & {
  scopes?: unknown;
  createdAt?: string | null;
  lastUsedAt?: string | null;
};

const toScopes = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value === 'string') return value.split(/[\s,]+/).filter(Boolean);
  return [];
};

/** Accepts scopes as an array or a delimited string, and missing dates as `null`. */
export function normalizeCredential(raw: RawConsoleCredential): ConsoleCredential {
  return {
    id: raw.id,
    name: raw.name,
    keyPrefix: raw.keyPrefix,
    status: raw.status,
    scopes: toScopes(raw.scopes),
    createdAt: raw.createdAt ?? null,
    lastUsedAt: raw.lastUsedAt ?? null,
  };
}

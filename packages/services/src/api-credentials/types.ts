/** An organization's API credential. The raw key is only returned when it is issued. */
export interface ConsoleCredential {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  status: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface IssuedConsoleCredential extends ConsoleCredential {
  rawKey: string;
}

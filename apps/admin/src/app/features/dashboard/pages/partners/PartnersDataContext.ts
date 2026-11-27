import { createContext, createElement, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

import type { OctapClient } from '@octap/internal-sdk';
import { useAuth } from '@octap/shared/authentication';

import type { OrganizationList } from './types';

type OrganizationListSuccess = Extract<OrganizationList, { error: null }>;
export type OrganizationStatusFilter = 'ACTIVE' | 'PENDING_APPROVAL';

interface PartnersData {
  orgs: OrganizationList | 0;
  timestamp: string;
  reload: () => void;
  /** True while the list is loading again. */
  reloading: boolean;
  /** When the list last loaded, in milliseconds. */
  updatedAt: number;
  isCompact: boolean;
  setIsCompact: (compact: boolean) => void;
  hiddenColumns: ReadonlySet<string>;
  toggleColumn: (column: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: OrganizationStatusFilter | null;
  setStatusFilter: (status: OrganizationStatusFilter | null) => void;
}

export const PartnersDataContext = createContext<PartnersData | null>(null);

export function PartnersDataProvider({ children }: { children: ReactNode }) {
  const { api: client } = useAuth();
  const [timestamp, setTimestamp] = useState(() => new Date().toISOString());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrganizationStatusFilter | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<ReadonlySet<string>>(new Set());

  const organizationsQuery = useQuery({
    queryKey: ['partners', 'organizations'],
    queryFn: () => listAllOrganizations(client),
    staleTime: 5 * 60 * 1000,
  });
  const reloadOrganizations = organizationsQuery.refetch;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const orgs: OrganizationList | 0 = organizationsQuery.isPending
    ? 0
    : organizationsQuery.isError
      ? ({ data: null, error: organizationsQuery.error } as OrganizationList)
      : (organizationsQuery.data ?? 0);

  const value = useMemo<PartnersData>(
    () => ({
      orgs,
      timestamp,
      searchQuery,
      setSearchQuery,
      statusFilter,
      setStatusFilter,
      reloading: organizationsQuery.isFetching,
      updatedAt: organizationsQuery.dataUpdatedAt,
      isCompact,
      setIsCompact,
      hiddenColumns,
      toggleColumn: (column) =>
        setHiddenColumns((current) => {
          const next = new Set(current);
          if (!next.delete(column)) next.add(column);
          return next;
        }),
      reload: () => {
        setTimestamp(new Date().toISOString());
        void reloadOrganizations();
      },
    }),
    [
      orgs,
      timestamp,
      searchQuery,
      statusFilter,
      reloadOrganizations,
      organizationsQuery.isFetching,
      organizationsQuery.dataUpdatedAt,
      isCompact,
      hiddenColumns,
    ],
  );

  return createElement(PartnersDataContext.Provider, { value }, children);
}

export function usePartnersData() {
  const context = useContext(PartnersDataContext);
  if (!context) throw new Error('usePartnersData must be used within PartnersDataProvider');
  return context;
}

async function listAllOrganizations(client: OctapClient): Promise<OrganizationListSuccess> {
  const items: NonNullable<NonNullable<OrganizationList['data']>['items']> = [];
  let cursor: string | undefined;

  do {
    const response = await client.platform.listOrganizations({ limit: 100, cursor });
    if (response.error) throw response.error;

    const page = response.data;
    items.push(...(page.items ?? []));
    cursor = page.nextCursor ?? undefined;
  } while (cursor);

  return {
    data: { items, nextCursor: null },
    error: null,
  } as OrganizationListSuccess;
}

import { MutationCache, QueryClient, type QueryKey } from '@tanstack/react-query';

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /**
       * The queries this mutation makes stale. Leave it out to refresh everything visible; pass
       * `[]` when the mutation already updates the cache from Core's answer.
       */
      invalidates?: readonly QueryKey[];
    };
  }
}

/** HTTP status of a failed request, when the error carries one (the SDK's `OctapError`). */
const statusOf = (error: unknown) =>
  typeof error === 'object' && error && 'status' in error && typeof error.status === 'number'
    ? error.status
    : undefined;

export const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Coming back to the tab reloads what is on screen, so changes made elsewhere (another
      // tab, a teammate, an API key) show up. Only data older than `staleTime` is fetched again,
      // so switching tabs back and forth quickly costs nothing.
      refetchOnWindowFocus: true,
      // Client errors will not change on a retry.
      retry: (count, error) => (statusOf(error) ?? 500) >= 500 && count < 2,
    },
  },
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      const keys = mutation.meta?.invalidates;
      // By default a write may affect anything on screen, so refresh it all.
      if (!keys) void queryClient.invalidateQueries();
      else for (const queryKey of keys) void queryClient.invalidateQueries({ queryKey });
    },
  }),
});

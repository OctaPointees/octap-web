import { MutationCache, QueryClient } from '@tanstack/react-query';

/** HTTP status of a failed request, when the error carries one (the SDK's `OctapError`). */
const statusOf = (error: unknown) =>
  typeof error === 'object' && error && 'status' in error && typeof error.status === 'number'
    ? error.status
    : undefined;

export const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Client errors will not change on a retry.
      retry: (count, error) => (statusOf(error) ?? 500) >= 500 && count < 2,
    },
  },
  mutationCache: new MutationCache({
    // Every write may affect what is on screen, so refresh anything visible.
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  }),
});

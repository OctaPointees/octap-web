import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiCredentialsApi, type ConsoleCredential } from '@octap/services';
import { useAuth } from '@octap/shared/authentication';
import { notify } from '@octap/shared/components';
import { useOrganization } from '@/app/organization/hooks/useOrganization';

export const apiKeyKeys = {
  list: (organizationId: string) => ['console-api-credentials', organizationId] as const,
};

/** The organization's API keys: safe metadata only, never the secret. */
export function useApiKeys() {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: apiKeyKeys.list(organizationId),
    queryFn: () => createApiCredentialsApi(api).list(organizationId),
  });
}

/**
 * Creates a key. The answer holds the raw secret, so it never goes in the query cache: the list is
 * fetched again instead. With no cache time, `reset()` drops the secret from memory right away.
 */
export function useCreateApiKey() {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  return useMutation({
    meta: { invalidates: [apiKeyKeys.list(organizationId)] },
    gcTime: 0,
    mutationFn: (input: { name: string; scope: 'read' | 'write' }) =>
      createApiCredentialsApi(api).issue(organizationId, input),
    onError: (cause) => notify.error(cause, 'Could not create the key'),
  });
}

export function useRenameApiKey() {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  const cache = useQueryClient();
  return useMutation({
    meta: { invalidates: [] },
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      createApiCredentialsApi(api).rename(organizationId, id, name),
    onSuccess: (renamed) => {
      cache.setQueryData<ConsoleCredential[]>(apiKeyKeys.list(organizationId), (keys) =>
        keys?.map((key) => (key.id === renamed.id ? { ...key, name: renamed.name } : key)),
      );
      notify.success('API key renamed');
    },
    onError: (cause) => notify.error(cause, 'Could not rename the key'),
  });
}

export function useRevokeApiKey() {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  const cache = useQueryClient();
  return useMutation({
    meta: { invalidates: [] },
    mutationFn: (id: string) => createApiCredentialsApi(api).revoke(organizationId, id),
    onSuccess: (_result, id) => {
      cache.setQueryData<ConsoleCredential[]>(apiKeyKeys.list(organizationId), (keys) =>
        keys?.map((key) => (key.id === id ? { ...key, status: 'REVOKED' } : key)),
      );
      notify.success('API key revoked');
    },
    onError: (cause) => notify.error(cause, 'Could not revoke the key'),
  });
}

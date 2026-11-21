import {
  CheckCircle,
  Circle,
  Clock,
  Key,
  LockSimple,
  PencilSimpleLine,
  ShareNetwork,
} from 'phosphor-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import {
  Card,
  ErrorState,
  PageHeader,
  Skeleton,
  StatCard,
  StatusBadge,
} from '@/components/shared/Display';
import { isStaleKey, STALE_KEY_DAYS } from '@/app/api-keys/domain/keys';
import { useApiKeys } from '@/app/api-keys/hooks/useApiKeys';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { organizationPath } from '@/app/organization/utils';
import { cn } from '@/utils/cn';
import { fmtNumber, fmtRelative } from '@/utils/format';
import { summarizeDeliveries, summarizeKeys } from '../domain/insights';
import { isNoProgram, useIssuanceBudget, useWebhookHealth } from '../hooks/useDashboardData';

type StepState = 'done' | 'todo' | 'unknown';

/** One step of the integration checklist. */
function Step({
  state,
  title,
  detail,
  action,
}: {
  state: StepState;
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  const StepIcon = state === 'done' ? CheckCircle : state === 'unknown' ? LockSimple : Circle;
  return (
    <li className="flex items-start gap-3">
      <StepIcon
        size={20}
        weight={state === 'done' ? 'fill' : 'regular'}
        className={cn('mt-0.5 shrink-0', state === 'done' ? 'text-success' : 'opacity-40')}
        aria-label={state === 'done' ? 'Done' : state === 'unknown' ? 'Not available' : 'To do'}
      />
      <div className="min-w-0 flex-1">
        <p className={cn('font-medium', state === 'done' && 'opacity-60')}>{title}</p>
        <p className="text-sm opacity-60">{detail}</p>
      </div>
      {state === 'todo' && action}
    </li>
  );
}

/** Whether the integration is set up, how keys are used, and how webhooks are delivering. */
export function DeveloperDashboard() {
  const { owner, slug } = useOrganization();
  const keys = useApiKeys();
  const budget = useIssuanceBudget();
  const { endpoints, deliveries } = useWebhookHealth();
  const apiKeysPath = organizationPath(slug, 'api-keys');
  const keySummary = keys.data ? summarizeKeys(keys.data) : undefined;
  const delivery = deliveries.data ? summarizeDeliveries(deliveries.data) : undefined;
  const activeEndpoints = endpoints.data?.filter((endpoint) => endpoint.status === 'ACTIVE').length;
  const loadingValue = <Skeleton className="h-8 w-16" />;
  // Hold the checklist until its answers are in, so no step briefly reads as not done.
  const checking = keys.isPending || budget.isPending || (owner && endpoints.isPending);

  const budgetState: StepState = budget.data
    ? budget.data.remaining > 0
      ? 'done'
      : 'todo'
    : isNoProgram(budget.error)
      ? 'todo'
      : 'unknown';
  const steps: { state: StepState; title: string; detail: string; action?: ReactNode }[] = [
    {
      state: !keySummary ? 'unknown' : keySummary.active.length ? 'done' : 'todo',
      title: 'Create an API key',
      detail: 'Your server uses it to call OctaP. Never put it in a browser or mobile app.',
      action: (
        <Link className="btn btn-primary btn-sm" to={apiKeysPath}>
          Create key
        </Link>
      ),
    },
    {
      state: !keySummary ? 'unknown' : keySummary.latest ? 'done' : 'todo',
      title: 'Make your first API call',
      detail: 'This completes as soon as OctaP sees a key being used.',
    },
    {
      state: budgetState,
      title: 'Points budget funded',
      detail: isNoProgram(budget.error)
        ? 'OctaP sets this up when your program is provisioned.'
        : budgetState === 'unknown'
          ? 'The budget could not be read right now.'
          : 'Earning points draws from this budget.',
    },
    {
      state: !owner ? 'unknown' : activeEndpoints ? 'done' : endpoints.data ? 'todo' : 'unknown',
      title: 'Add a webhook endpoint',
      detail: owner
        ? 'Get notified on your server when points and vouchers change.'
        : 'Only the organization’s Owner can see webhooks.',
    },
  ];
  const checkable = steps.filter((step) => step.state !== 'unknown');
  const done = checkable.filter((step) => step.state === 'done').length;

  return (
    <>
      <PageHeader
        title="Developer dashboard"
        description="Your integration setup, how API keys are being used, and webhook delivery."
      />

      <div className="flex flex-col gap-4">
        {keys.error && <ErrorState error={keys.error} onRetry={() => void keys.refetch()} />}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active API keys"
            icon={Key}
            value={keySummary ? fmtNumber(keySummary.active.length) : loadingValue}
            hint={keys.data && `${fmtNumber(keys.data.length)} in total`}
          />
          <StatCard
            label="Last API activity"
            icon={Clock}
            value={
              keySummary
                ? keySummary.latest
                  ? fmtRelative(keySummary.latest.lastUsedAt!)
                  : 'Never'
                : loadingValue
            }
            hint={keySummary?.latest?.name ?? (keySummary && 'No key has been used yet')}
          />
          <StatCard
            label="Write-access keys"
            icon={PencilSimpleLine}
            value={keySummary ? fmtNumber(keySummary.write) : loadingValue}
            hint="Keep these on your server"
          />
          <StatCard
            label="Webhook delivery"
            icon={ShareNetwork}
            value={
              !owner
                ? 'Owner only'
                : deliveries.isPending
                  ? loadingValue
                  : delivery?.rate != null
                    ? `${delivery.rate}%`
                    : 'No data'
            }
            hint={
              owner && delivery?.settled
                ? `${fmtNumber(delivery.delivered)} of ${fmtNumber(delivery.settled)} recent`
                : undefined
            }
          />
        </div>

        <div className="grid items-start gap-4 xl:grid-cols-2">
          <Card
            title="Integration setup"
            actions={
              !checking && (
                <span className="text-sm opacity-60">
                  {done} of {checkable.length}
                </span>
              )
            }
          >
            {checking ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <>
                <progress
                  aria-label="Setup progress"
                  className={cn(
                    'progress h-1.5 w-full',
                    done === checkable.length ? 'progress-success' : 'progress-primary',
                  )}
                  value={done}
                  max={checkable.length || 1}
                />
                <ol className="animate-reveal mt-4 flex flex-col gap-4">
                  {steps.map((step) => (
                    <Step key={step.title} {...step} />
                  ))}
                </ol>
              </>
            )}
          </Card>

          <div className="flex flex-col gap-4">
            <Card
              title="API keys"
              actions={
                <Link className="link text-sm font-normal" to={apiKeysPath}>
                  Manage keys
                </Link>
              }
            >
              {keys.isPending ? (
                <Skeleton className="h-24 w-full" />
              ) : keySummary?.active.length ? (
                <ul className="flex flex-col gap-3">
                  {keySummary.active.slice(0, 5).map((key) => (
                    <li key={key.id} className="flex items-center gap-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{key.name}</p>
                        <p className="truncate font-mono text-xs opacity-55">{key.keyPrefix}••••</p>
                      </div>
                      {isStaleKey(key) && (
                        <span
                          className="badge badge-soft badge-warning badge-sm"
                          title={`Not used in the last ${STALE_KEY_DAYS} days. Revoke it if nothing needs it.`}
                        >
                          {key.lastUsedAt ? 'Idle' : 'Never used'}
                        </span>
                      )}
                      <span className="w-24 shrink-0 text-right text-xs opacity-60">
                        {key.lastUsedAt ? fmtRelative(key.lastUsedAt) : 'Not used'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm opacity-60">No active API keys yet.</p>
              )}
            </Card>

            <Card title="Webhook health">
              {!owner ? (
                <p className="flex items-center gap-2 text-sm opacity-65">
                  <LockSimple size={16} className="shrink-0" aria-hidden />
                  You can’t view this section. Only the organization’s Owner can see webhooks.
                </p>
              ) : endpoints.error || deliveries.error ? (
                <ErrorState
                  error={endpoints.error ?? deliveries.error}
                  onRetry={() => {
                    void endpoints.refetch();
                    void deliveries.refetch();
                  }}
                />
              ) : endpoints.isPending || deliveries.isPending ? (
                <Skeleton className="h-24 w-full" />
              ) : !endpoints.data?.length ? (
                <p className="text-sm opacity-60">No webhook endpoints have been added yet.</p>
              ) : (
                <div className="flex flex-col gap-3 text-sm">
                  <p className="opacity-70">
                    {fmtNumber(activeEndpoints ?? 0)} of {fmtNumber(endpoints.data.length)}{' '}
                    endpoints active
                    {delivery?.retrying
                      ? `, ${fmtNumber(delivery.retrying)} ${delivery.retrying === 1 ? 'delivery' : 'deliveries'} retrying`
                      : ''}
                  </p>
                  {delivery?.failed.length ? (
                    <ul className="divide-y divide-base-300 rounded-box border border-base-300">
                      {delivery.failed.slice(0, 4).map((failure) => (
                        <li key={failure.id} className="flex items-center gap-3 px-3 py-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-mono text-xs font-medium">
                              {failure.eventType}
                            </p>
                            <p
                              className="truncate text-xs opacity-60"
                              title={failure.lastError ?? undefined}
                            >
                              {failure.lastResponseStatus
                                ? `HTTP ${failure.lastResponseStatus}`
                                : (failure.lastError ?? 'No response')}
                              , {fmtNumber(failure.attemptCount)} attempts
                            </p>
                          </div>
                          <StatusBadge status="failed" />
                          <span className="shrink-0 text-xs opacity-60">
                            {fmtRelative(failure.updatedAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="flex items-center gap-2 text-success">
                      <CheckCircle size={16} weight="fill" aria-hidden />
                      No failed deliveries recently.
                    </p>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

import { useState } from 'react';
import { useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArchiveBox, PauseCircle, PencilSimple, RocketLaunch } from 'phosphor-react';

import { Field } from '@/components/shared/Field';
import { useAuth } from '@octap/shared/authentication';
import { Button, Modal, useExitValue } from '@octap/shared/components';

type PartnerAction = 'EDIT' | 'PROVISION' | 'SUSPEND' | 'ARCHIVE';

interface ActionForm {
  action: PartnerAction;
  reason: string;
  name: string;
  earnBps: string;
  expiryDays: string;
  totalBudget: string;
  shardCount: string;
}

const ACTION_LABELS: Record<PartnerAction, string> = {
  EDIT: 'Edit Organization',
  PROVISION: 'Provision Organization',
  SUSPEND: 'Suspend Organization',
  ARCHIVE: 'Archive Organization',
};

export function PartnerActionsPanel() {
  const { id } = useParams<{ id: string }>();
  const { api: client } = useAuth();
  const queryClient = useQueryClient();
  const [activeAction, setActiveAction] = useState<PartnerAction | null>(null);
  const action = useExitValue(activeAction);
  const [reason, setReason] = useState('');
  const [name, setName] = useState('');
  const [earnBps, setEarnBps] = useState('');
  const [expiryDays, setExpiryDays] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [shardCount, setShardCount] = useState('');

  const organizationQuery = useQuery({
    queryKey: ['partners', 'organization', id],
    queryFn: async () => {
      if (!id) throw new Error('Organization ID is missing');
      const response = await client.platform.detailOrganizations({ id });
      if (response.error) throw response.error;
      return response.data;
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });

  const actionMutation = useMutation({
    mutationFn: async (form: ActionForm) => {
      if (!id) throw new Error('Organization ID is missing');

      if (form.action === 'PROVISION') {
        const response = await client.platform.provisionOrganizations({
          id,
          body: {
            earnBps: Number(form.earnBps),
            expiryDays: Number(form.expiryDays),
            totalBudget: Number(form.totalBudget),
            shardCount: Number(form.shardCount),
            idempotencyKey: crypto.randomUUID(),
          },
        });
        if (response.error) throw response.error;
        return response.data;
      }

      const requestType =
        form.action === 'EDIT'
          ? 'UPDATE_PROFILE'
          : form.action === 'SUSPEND'
            ? 'SUSPEND'
            : 'DEACTIVATE';
      const response = await client.platform.propose({
        organizationId: id,
        body: {
          requestType,
          reason: form.reason.trim(),
          payload: form.action === 'EDIT' ? { name: form.name.trim() } : {},
        },
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: async () => {
      setActiveAction(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['partners', 'organization', id] }),
        queryClient.invalidateQueries({ queryKey: ['partners', 'organizations'] }),
        queryClient.invalidateQueries({ queryKey: ['partners', 'organization-requests', id] }),
        queryClient.invalidateQueries({ queryKey: ['requests', 'change-requests'] }),
      ]);
    },
  });

  const resetForm = () => {
    setActiveAction(null);
    setReason('');
    setName('');
    setEarnBps('');
    setExpiryDays('');
    setTotalBudget('');
    setShardCount('');
    actionMutation.reset();
  };

  const openAction = (action: PartnerAction) => {
    actionMutation.reset();
    setReason('');
    setName(organizationQuery.data?.name ?? '');
    setEarnBps('');
    setExpiryDays('');
    setTotalBudget('');
    setShardCount('');
    setActiveAction(action);
  };

  const provisionInputsValid =
    earnBps !== '' &&
    Number.isInteger(Number(earnBps)) &&
    Number(earnBps) >= 0 &&
    Number(earnBps) <= 10_000 &&
    expiryDays !== '' &&
    Number.isInteger(Number(expiryDays)) &&
    Number(expiryDays) > 0 &&
    totalBudget !== '' &&
    Number.isFinite(Number(totalBudget)) &&
    Number(totalBudget) > 0 &&
    shardCount !== '' &&
    Number.isInteger(Number(shardCount)) &&
    Number(shardCount) > 0;
  const canSubmit =
    activeAction === 'PROVISION'
      ? provisionInputsValid
      : activeAction === 'EDIT'
        ? Boolean(name.trim() && reason.trim())
        : Boolean(reason.trim());
  const isPending = actionMutation.isPending;

  if (!organizationQuery.data) {
    return <></>;
  }

  return (
    <>
      <section className="w-96 pr-4">
        <div className="h-6" />

        {organizationQuery.data?.status === 'ARCHIVED' || (
          <div className="flex flex-wrap gap-2 *:btn-block">
            <h3 className="p-2 text-sm font-bold uppercase">Partner Actions</h3>

            <Button type="button" icon={PencilSimple} onClick={() => openAction('EDIT')}>
              Edit Organization
            </Button>
            <Button
              type="button"
              icon={RocketLaunch}
              className="text-primary"
              onClick={() => openAction('PROVISION')}
            >
              Provision Organization
            </Button>
            <Button
              type="button"
              icon={PauseCircle}
              className="text-warning disabled:hidden"
              disabled={organizationQuery.data?.status !== 'ACTIVE'}
              onClick={() => openAction('SUSPEND')}
            >
              Suspend Organization
            </Button>
            <Button
              type="button"
              icon={ArchiveBox}
              className="text-error disabled:hidden"
              onClick={() => openAction('ARCHIVE')}
            >
              Archive Organization
            </Button>
          </div>
        )}
      </section>

      <Modal
        open={!!activeAction}
        onOpenChange={(open) => !open && !isPending && resetForm()}
        size="xl"
        title={action && `${ACTION_LABELS[action]}?`}
        description={
          action && (
            <>
              {'Confirm this action for '}
              <strong>{organizationQuery.data?.name ?? 'this organization'}</strong>.
              {action !== 'PROVISION' && ' A reason is required for the governance request.'}
            </>
          )
        }
        footer={
          action && (
            <>
              <Button type="button" className="btn-ghost" disabled={isPending} onClick={resetForm}>
                Cancel
              </Button>
              <Button
                type="button"
                className={
                  action === 'ARCHIVE'
                    ? 'btn-error'
                    : action === 'SUSPEND'
                      ? 'btn-warning'
                      : 'btn-primary'
                }
                disabled={!canSubmit || isPending}
                onClick={() =>
                  actionMutation.mutate({
                    action: action,
                    reason,
                    name,
                    earnBps,
                    expiryDays,
                    totalBudget,
                    shardCount,
                  })
                }
                loading={isPending}
              >
                Confirm {ACTION_LABELS[action].replace(' Organization', '').toLowerCase()}
              </Button>
            </>
          )
        }
      >
        {action && (
          <div aria-busy={isPending}>
            {action === 'EDIT' && (
              <div className="mt-4 w-full">
                <Field
                  label="Organization name"
                  control={[name, setName]}
                  disabled={isPending}
                  maxLength={200}
                  placeholder="Enter the organization name"
                />
              </div>
            )}

            {action === 'PROVISION' ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field
                  label="Earn rate (basis points)"
                  control={[earnBps, setEarnBps]}
                  type="number"
                  min={0}
                  max={10_000}
                  step={1}
                  disabled={isPending}
                  placeholder="0–10,000 bps"
                />
                <Field
                  label="Expiry (days)"
                  control={[expiryDays, setExpiryDays]}
                  type="number"
                  min={1}
                  step={1}
                  disabled={isPending}
                  placeholder="1 or more days"
                />
                <Field
                  label="Total budget"
                  control={[totalBudget, setTotalBudget]}
                  type="number"
                  min="0.01"
                  step="any"
                  disabled={isPending}
                  placeholder="Greater than 0"
                />
                <Field
                  label="Shard count"
                  control={[shardCount, setShardCount]}
                  type="number"
                  min={1}
                  step={1}
                  disabled={isPending}
                  placeholder="1 or more"
                />
              </div>
            ) : null}

            {action !== 'PROVISION' && (
              <label className="form-control mt-4 w-full">
                <span className="label-text mb-2 font-medium">Reason</span>
                <textarea
                  className="textarea textarea-bordered min-h-24 w-full"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  disabled={isPending}
                  maxLength={1000}
                  placeholder="Enter the reason for this request"
                />
              </label>
            )}

            {actionMutation.isError && (
              <div className="alert alert-error mt-4" role="alert">
                {actionMutation.error instanceof Error
                  ? actionMutation.error.message
                  : 'The organization action failed. Please try again.'}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, FileArrowUp, Gift, PencilSimple, Plus, Ticket } from 'phosphor-react';
import { useState } from 'react';
import { useConsoleAuth, type ConsoleVoucher } from '@octap/shared/google-auth';
import { Button } from '@/components/shared/Button';
import { FormField, Segmented, TextInput } from '@/components/shared/Controls';
import { EmptyState, ErrorState, LoadingBlock, PageHeader } from '@/components/shared/Display';
import { ConfirmDialog, Modal } from '@/components/shared/Modal';
import { cn } from '@/utils/cn';
import { fmtDate, fmtNumber } from '@/utils/format';
import { notify } from '@/utils/toast';
import {
  describeBenefit,
  fromVoucher,
  remainingLabel,
  stageOf,
  type Stage,
} from './rewards/benefit';
import ImportRewards from './rewards/ImportRewards';
import { coreErrors } from './rewards/errors';
import RewardForm, { type RewardFormMode } from './rewards/RewardForm';

const STAGES: Record<Stage, { label: string; tone: string }> = {
  draft: { label: 'Draft', tone: 'badge-ghost' },
  publishing: { label: 'Publishing…', tone: 'badge-info' },
  failed: { label: 'Publish failed', tone: 'badge-error' },
  live: { label: 'Live', tone: 'badge-success' },
  paused: { label: 'Paused', tone: 'badge-warning' },
  sold_out: { label: 'Sold out', tone: 'badge-neutral' },
};

type Filter = 'all' | 'draft' | 'live' | 'paused' | 'sold_out';
const FILTERS: { label: string; value: Filter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Drafts', value: 'draft' },
  { label: 'Live', value: 'live' },
  { label: 'Paused', value: 'paused' },
  { label: 'Sold out', value: 'sold_out' },
];
const inFilter = (filter: Filter, stage: Stage) =>
  filter === 'all' ||
  stage === filter ||
  (filter === 'draft' && (stage === 'publishing' || stage === 'failed'));

/** While a reward is publishing, the worker is writing its terms on-chain: check back every 3 s. */
const PUBLISH_POLL_MS = 3000;

export default function ConnectedRewards() {
  const auth = useConsoleAuth()!;
  const orgId = auth.organizationId;
  const owner = auth.owner;
  const cache = useQueryClient();
  const key = ['console-rewards', orgId];
  const [filter, setFilter] = useState<Filter>('all');
  const [form, setForm] = useState<RewardFormMode | null>(null);
  const [activating, setActivating] = useState<ConsoleVoucher | null>(null);
  const [restocking, setRestocking] = useState<ConsoleVoucher | null>(null);
  const [importing, setImporting] = useState(false);

  const list = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => auth.client().listConsoleVouchers(orgId, signal),
    refetchInterval: (query) =>
      query.state.data?.some((v) => v.publishStatus === 'PUBLISHING') ? PUBLISH_POLL_MS : false,
  });
  const setStatus = useMutation({
    mutationFn: ({ voucher, status }: { voucher: ConsoleVoucher; status: 'ACTIVE' | 'PAUSED' }) =>
      auth.client().updateConsoleVoucher(orgId, voucher.id, { status }),
    onSuccess: (voucher) => {
      void cache.invalidateQueries({ queryKey: key });
      const stage = stageOf(voucher);
      notify.success(
        stage === 'publishing'
          ? 'Publishing on-chain'
          : stage === 'paused'
            ? 'Reward paused'
            : 'Reward is live',
        voucher.title,
      );
      setActivating(null);
    },
    onError: (error) =>
      notify.error(
        new Error(Object.values(coreErrors(error))[0] ?? String(error)),
        'Could not update the reward',
      ),
  });

  const rows = list.data?.filter((voucher) => inFilter(filter, stageOf(voucher)));
  const close = () => {
    setForm(null);
    void cache.invalidateQueries({ queryKey: key });
  };

  return (
    <>
      <PageHeader
        title="Rewards"
        description="Vouchers your members claim with points. Drafts stay private until you activate them."
        actions={
          owner && (
            <div className="flex gap-2">
              <Button className="btn-outline" onClick={() => setImporting(true)}>
                <FileArrowUp /> Import CSV
              </Button>
              <Button className="btn-primary" onClick={() => setForm({ kind: 'create' })}>
                <Plus /> New reward
              </Button>
            </div>
          )
        }
      />
      <Segmented value={filter} onValueChange={setFilter} options={FILTERS} />
      {list.error && <ErrorState error={list.error} onRetry={() => void list.refetch()} />}
      {list.isPending && <LoadingBlock rows={2} />}
      {rows && rows.length === 0 && (
        <EmptyState
          icon={Ticket}
          title={list.data?.length ? 'No rewards in this view' : 'No rewards yet'}
          description={
            owner
              ? 'Create a reward, start from a template, or import a CSV.'
              : 'The Owner of this organization creates rewards.'
          }
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows?.map((voucher) => {
          const stage = stageOf(voucher);
          const busy = setStatus.isPending && setStatus.variables?.voucher.id === voucher.id;
          return (
            <article
              key={voucher.id}
              aria-label={voucher.title}
              className="flex flex-col gap-3 rounded-box border border-base-300 bg-base-100 p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="rounded-box bg-primary/10 p-2.5 text-primary">
                  <Gift size={22} />
                </div>
                <span className={cn('badge badge-soft badge-sm', STAGES[stage].tone)}>
                  {stage === 'publishing' && (
                    <span className="loading loading-spinner loading-xs" />
                  )}
                  {STAGES[stage].label}
                </span>
              </div>
              <div>
                <h3 className="font-semibold">{voucher.title}</h3>
                <p className="text-xs opacity-70">{describeBenefit(fromVoucher(voucher))}</p>
                <p className="text-xs opacity-50">{voucher.code}</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{fmtNumber(voucher.pointsCost)}</span>
                <span className="text-sm opacity-60">points</span>
              </div>
              <p className="text-xs opacity-60">{remainingLabel(voucher)}</p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-base-300 pt-3 text-xs">
                <span className="opacity-60">
                  {voucher.expiresAt ? `Expires ${fmtDate(voucher.expiresAt)}` : 'No expiry'}
                </span>
                <div className="flex flex-wrap gap-1">
                  {!owner || stage === 'publishing' ? (
                    <Button
                      className="btn-ghost btn-xs"
                      onClick={() => setForm({ kind: 'edit', voucher, readOnly: true })}
                    >
                      View
                    </Button>
                  ) : (
                    <>
                      {(stage === 'draft' || stage === 'failed') && (
                        <>
                          <Button
                            className="btn-ghost btn-xs"
                            onClick={() => setForm({ kind: 'edit', voucher, readOnly: false })}
                          >
                            <PencilSimple /> Edit
                          </Button>
                          <Button
                            className="btn-primary btn-xs"
                            disabled={busy}
                            onClick={() => setActivating(voucher)}
                          >
                            {stage === 'failed' ? 'Retry publish' : 'Activate'}
                          </Button>
                        </>
                      )}
                      {(stage === 'live' || stage === 'paused') && (
                        <Button
                          className="btn-ghost btn-xs"
                          disabled={busy}
                          onClick={() =>
                            setStatus.mutate({
                              voucher,
                              status: stage === 'live' ? 'PAUSED' : 'ACTIVE',
                            })
                          }
                        >
                          {stage === 'live' ? 'Pause' : 'Resume'}
                        </Button>
                      )}
                      {stage !== 'draft' && stage !== 'failed' && voucher.totalSupply !== null && (
                        <Button className="btn-ghost btn-xs" onClick={() => setRestocking(voucher)}>
                          Restock
                        </Button>
                      )}
                      {stage !== 'draft' && stage !== 'failed' && (
                        <Button
                          className="btn-ghost btn-xs"
                          onClick={() => setForm({ kind: 'edit', voucher, readOnly: false })}
                        >
                          Details
                        </Button>
                      )}
                      <Button
                        className="btn-ghost btn-xs"
                        aria-label={`Duplicate ${voucher.title}`}
                        onClick={() => setForm({ kind: 'create', from: voucher })}
                      >
                        <Copy />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {form && (
        <RewardForm
          key={
            form.kind === 'edit' ? `edit-${form.voucher.id}` : `create-${form.from?.id ?? 'new'}`
          }
          mode={form}
          onClose={close}
        />
      )}
      {importing && (
        <ImportRewards
          onClose={() => {
            setImporting(false);
            void cache.invalidateQueries({ queryKey: key });
          }}
        />
      )}
      {restocking && (
        <RestockModal
          voucher={restocking}
          onClose={() => {
            setRestocking(null);
            void cache.invalidateQueries({ queryKey: key });
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(activating)}
        onOpenChange={(open) => !open && setActivating(null)}
        title={
          activating?.publishStatus === 'FAILED' ? 'Retry publishing?' : 'Activate this reward?'
        }
        description="Its title, description, type, points, conditions and dates are published on-chain and can never change. To change them later, create a new reward. Members can claim it once publishing finishes."
        confirmLabel={activating?.publishStatus === 'FAILED' ? 'Retry' : 'Activate'}
        loading={setStatus.isPending}
        onConfirm={() => activating && setStatus.mutate({ voucher: activating, status: 'ACTIVE' })}
      >
        {activating && <p className="text-sm font-medium">{activating.title}</p>}
      </ConfirmDialog>
    </>
  );
}

/** Core has no restock: it sets the new total, which may not drop below what was claimed. */
function RestockModal({ voucher, onClose }: { voucher: ConsoleVoucher; onClose: () => void }) {
  const auth = useConsoleAuth()!;
  const [add, setAdd] = useState('50');
  const restock = useMutation({
    mutationFn: (total: number) =>
      auth.client().updateConsoleVoucher(auth.organizationId, voucher.id, { totalSupply: total }),
    onSuccess: (saved) => {
      notify.success('Stock updated', `${fmtNumber(saved.totalSupply ?? 0)} in total`);
      onClose();
    },
  });
  const valid = /^\d+$/.test(add.trim()) && Number(add) > 0;
  const error = !valid
    ? 'Enter a positive whole number'
    : Object.values(coreErrors(restock.error))[0];
  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title="Restock reward"
      description={voucher.title}
      size="sm"
      footer={
        <Button
          className="btn-primary"
          disabled={!valid || restock.isPending}
          onClick={() => restock.mutate((voucher.totalSupply ?? 0) + Number(add))}
        >
          Add stock
        </Button>
      }
    >
      <FormField label="Units to add" error={error} hint={remainingLabel(voucher)}>
        <TextInput
          value={add}
          inputMode="numeric"
          onChange={(event) => {
            setAdd(event.target.value);
            restock.reset();
          }}
          invalid={Boolean(error)}
        />
      </FormField>
    </Modal>
  );
}

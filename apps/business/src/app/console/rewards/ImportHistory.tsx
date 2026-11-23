import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileArrowUp, Stack } from 'phosphor-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@octap/shared/authentication';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { Button } from '@/components/shared/Button';
import { EmptyState, ErrorState, LoadingBlock, PageHeader } from '@/components/shared/Display';
import { cn } from '@/utils/cn';
import { fmtNumber } from '@/utils/format';
import { batchesApi } from './api';
import { batchProgress, batchTitle, describeProgress, formatWhen } from './batches';
import ImportRewards from './ImportRewards';
import { useCreatorName } from './useCreatorName';

/** Every import batch of the organization (OCT-304), newest first, with how far each one is live. */
export default function ImportHistory() {
  const auth = useAuth();
  const { organizationId } = useOrganization();
  const navigate = useNavigate();
  const creator = useCreatorName();
  const [showArchived, setShowArchived] = useState(false);
  const [importing, setImporting] = useState(false);
  const list = useQuery({
    queryKey: ['console-voucher-batches', organizationId, showArchived],
    queryFn: ({ signal }) => batchesApi(auth).list(organizationId, showArchived, signal),
  });

  return (
    <>
      <Link to=".." relative="path" className="link mt-6 inline-flex items-center gap-1 text-sm">
        <ArrowLeft /> Rewards
      </Link>
      <PageHeader
        title="Import history"
        description="Each CSV import is one batch of drafts. Open one to check it, then activate it at once."
        actions={
          <Button className="btn-outline" onClick={() => setImporting(true)}>
            <FileArrowUp /> Import CSV
          </Button>
        }
      />
      <label className="mb-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={showArchived}
          onChange={(event) => setShowArchived(event.target.checked)}
        />
        Show archived
      </label>
      {list.error && <ErrorState error={list.error} onRetry={() => void list.refetch()} />}
      {list.isPending && <LoadingBlock rows={2} />}
      {list.data?.length === 0 && (
        <EmptyState
          icon={Stack}
          title={showArchived ? 'No imports yet' : 'No open imports'}
          description="Import a CSV to create many rewards at once."
        />
      )}
      <ul className="flex flex-col gap-3">
        {list.data?.map((batch) => {
          const progress = batchProgress(batch);
          const active = progress.total - progress.archived;
          return (
            <li key={batch.id}>
              <Link
                to={batch.id}
                className="flex flex-col gap-2 rounded-box border border-base-300 bg-base-100 p-4 hover:border-primary"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold">{batchTitle(batch)}</span>
                  {batch.archivedAt && <span className="badge badge-soft badge-sm">Archived</span>}
                </div>
                <span className="text-xs opacity-70">
                  {formatWhen(batch.createdAt)} · {batch.source === 'API' ? 'API' : 'Console'} ·{' '}
                  {creator(batch)}
                </span>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span>
                    {fmtNumber(progress.total)} reward{progress.total === 1 ? '' : 's'}
                  </span>
                  <progress
                    className={cn('progress progress-success h-1.5 w-40 max-w-full')}
                    value={progress.live}
                    max={active || 1}
                    aria-label={`${progress.live} of ${active} live`}
                  />
                  <span className="text-xs opacity-75">{describeProgress(progress)}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {importing && (
        <ImportRewards
          onClose={() => {
            setImporting(false);
            void list.refetch();
          }}
          onOpenBatch={(id) => navigate(id)}
        />
      )}
    </>
  );
}

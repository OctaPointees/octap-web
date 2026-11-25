import { useState } from 'react';
import { ArrowLeft, FileArrowUp, Stack } from 'phosphor-react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@octap/shared/components';
import { EmptyState, ErrorState, LoadingBlock, PageHeader } from '@/components/shared/Display';
import { fmtDateTime, fmtNumber } from '@/utils/format';
import { batchProgress, batchTitle, describeProgress } from '../domain/batches';
import { ImportDialog } from '../components/ImportDialog';
import { useBatches } from '../hooks/useBatches';
import { usePeople } from '../hooks/usePeople';

/** Every import batch of the organization (OCT-304), newest first, with how far each one is live. */
export default function ImportHistoryPage() {
  const navigate = useNavigate();
  const people = usePeople();
  const [showArchived, setShowArchived] = useState(false);
  const [importing, setImporting] = useState(false);
  const list = useBatches(showArchived);

  return (
    <>
      <Link to=".." relative="path" className="link mt-6 inline-flex items-center gap-1 text-sm">
        <ArrowLeft /> Vouchers
      </Link>
      <PageHeader
        title="Import history"
        description="Each CSV import is one batch of drafts. Open one to check it, then activate it at once."
        actions={
          <Button className="btn-primary btn-sm" onClick={() => setImporting(true)}>
            <FileArrowUp size={16} className="mr-1.5" /> Import CSV
          </Button>
        }
      />
      <label className="mb-3 flex w-fit items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={showArchived}
          onChange={(event) => setShowArchived(event.target.checked)}
        />
        Show archived
      </label>
      {list.error ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} />
      ) : !list.data ? (
        <LoadingBlock rows={2} />
      ) : list.data.length === 0 ? (
        <EmptyState
          icon={Stack}
          title={showArchived ? 'No imports yet' : 'No open imports'}
          description="Import a CSV to create many vouchers at once."
        />
      ) : (
        <ul className="animate-reveal flex flex-col gap-3">
          {list.data.map((batch) => {
            const progress = batchProgress(batch);
            const active = progress.total - progress.archived;
            const creator = people.actor(batch.createdBy)?.name ?? 'Someone no longer in the team';
            return (
              <li key={batch.id}>
                <Link
                  to={batch.id}
                  className="flex flex-col gap-2 rounded-box border border-base-300 bg-base-100 p-4 transition-colors hover:border-primary"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold">{batchTitle(batch)}</span>
                    {batch.archivedAt && (
                      <span className="badge badge-soft badge-sm">Archived</span>
                    )}
                  </div>
                  <span className="text-xs opacity-70">
                    {fmtDateTime(batch.createdAt)} · {batch.source === 'API' ? 'API' : 'Console'} ·{' '}
                    {creator}
                  </span>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span>
                      {fmtNumber(progress.total)} voucher{progress.total === 1 ? '' : 's'}
                    </span>
                    <progress
                      className="progress progress-success h-1.5 w-40 max-w-full"
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
      )}
      <ImportDialog
        open={importing}
        onClose={() => setImporting(false)}
        onOpenBatch={(id) => navigate(id)}
      />
    </>
  );
}

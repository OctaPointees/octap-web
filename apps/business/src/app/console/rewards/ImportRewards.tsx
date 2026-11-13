import { useState } from 'react';
import { useConsoleAuth } from '@octap/shared/google-auth';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { cn } from '@/utils/cn';
import { notify } from '@/utils/toast';
import { describeBenefit, toVoucherInput } from './benefit';
import { CSV_TEMPLATE, MAX_IMPORT_ROWS, draftsFromCsv, type ImportRow } from './csv';
import { coreErrors } from './errors';

type Outcome = { state: 'created' } | { state: 'failed'; message: string };

/** Reads a CSV of rewards, checks every row, then creates each valid row as a draft. */
export default function ImportRewards({ onClose }: { onClose: () => void }) {
  const auth = useConsoleAuth()!;
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileError, setFileError] = useState('');
  const [outcomes, setOutcomes] = useState<Record<number, Outcome>>({});
  const [running, setRunning] = useState(false);

  const checked = rows.map((row) => {
    const { input, errors } = toVoucherInput(row.draft);
    const problem =
      row.problem ??
      Object.entries(errors)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');
    return { ...row, input, problem: problem || undefined };
  });
  const ready = checked.filter((row) => row.input && !outcomes[row.line]);

  async function createAll() {
    setRunning(true);
    let created = 0;
    // One at a time: rows share an organization, and Core reports each code conflict on its own row.
    for (const row of ready) {
      try {
        await auth.client().createConsoleVoucher(auth.organizationId, row.input!);
        created += 1;
        setOutcomes((current) => ({ ...current, [row.line]: { state: 'created' } }));
      } catch (error) {
        const message = Object.values(coreErrors(error))[0] ?? 'Could not create this reward.';
        setOutcomes((current) => ({ ...current, [row.line]: { state: 'failed', message } }));
      }
    }
    setRunning(false);
    if (created) notify.success(`${created} draft${created === 1 ? '' : 's'} created`);
  }

  return (
    <Modal
      open
      onOpenChange={(open) => !open && !running && onClose()}
      title="Import rewards from CSV"
      description={`Each row becomes a draft (at most ${MAX_IMPORT_ROWS}). From Excel, use File › Save as › CSV UTF-8.`}
      size="xl"
      footer={
        <>
          <Button className="btn-ghost" disabled={running} onClick={onClose}>
            Close
          </Button>
          <Button
            className="btn-primary"
            disabled={running || !ready.length}
            onClick={() => void createAll()}
          >
            {running && <span className="loading loading-spinner loading-sm" />}
            Create {ready.length} draft{ready.length === 1 ? '' : 's'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm">
            <span className="sr-only">CSV file</span>
            <input
              type="file"
              accept=".csv,text/csv"
              aria-label="CSV file"
              className="file-input file-input-sm"
              disabled={running}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                setOutcomes({});
                if (!file) return;
                const result = draftsFromCsv(await file.text());
                setFileError(result.error ?? '');
                setRows(result.rows);
              }}
            />
          </label>
          <a
            className="link text-sm"
            download="octap-rewards-template.csv"
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`}
          >
            Download the template
          </a>
        </div>
        {fileError && (
          <p role="alert" className="alert alert-error alert-soft text-sm">
            {fileError}
          </p>
        )}
        {checked.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Reward</th>
                  <th>Points</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {checked.map((row) => {
                  const outcome = outcomes[row.line];
                  const message =
                    outcome?.state === 'created'
                      ? 'Draft created'
                      : outcome?.state === 'failed'
                        ? outcome.message
                        : (row.problem ?? 'Ready');
                  const bad = outcome?.state === 'failed' || (!outcome && row.problem);
                  return (
                    <tr key={row.line}>
                      <td>{row.line}</td>
                      <td>
                        <div className="font-medium">{row.draft.title || '—'}</div>
                        <div className="text-xs opacity-60">
                          {row.draft.code} · {describeBenefit(row.draft)}
                        </div>
                      </td>
                      <td>{row.draft.pointsCost}</td>
                      <td
                        className={cn(
                          'text-xs',
                          bad ? 'text-error' : outcome ? 'text-success' : '',
                        )}
                      >
                        {message}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}

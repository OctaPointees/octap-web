import { useState } from 'react';
import { DownloadSimple, FileCsv, Info, PlusCircle, Trash } from 'phosphor-react';
import { Button, Modal, notify } from '@octap/shared/components';
import { cn } from '@/utils/cn';
import {
  CSV_TEMPLATE,
  MAX_IMPORT_ROWS,
  columnOf,
  draftsFromCsv,
  type ImportRow,
} from '../domain/csv';
import { describeBenefit, describePoints, describeValidity } from '../domain/describe';
import { toRewardInput } from '../domain/draft';
import { coreMessage } from '../domain/errors';
import { useCreateDraft } from '../hooks/useRewards';

type Outcome = { state: 'created' } | { state: 'failed'; message: string };

/** A CSV of 100 rewards is a few kilobytes; anything near this is not a reward file. */
const MAX_FILE_BYTES = 1024 * 1024;

const fileSize = (bytes: number) =>
  bytes < 1024
    ? `${bytes} B`
    : bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/**
 * Reads a CSV of rewards, checks every row, then creates each valid row as a draft. Stays mounted
 * so it animates in and out; closing it clears the chosen file.
 */
export function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateDraft();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileError, setFileError] = useState('');
  const [outcomes, setOutcomes] = useState<Record<number, Outcome>>({});
  const [running, setRunning] = useState(false);
  const [dragging, setDragging] = useState(false);

  const checked = rows.map((row) => {
    const { input, errors } = toRewardInput(row.draft);
    const problem =
      row.problem ??
      Object.entries(errors)
        .map(([field, message]) => `${columnOf(field)}: ${message}`)
        .join('; ');
    return { ...row, input, problem: problem || undefined };
  });
  // A row with any problem, even one the form would accept (an unclear date), is never created.
  const ready = checked.filter((row) => row.input && !row.problem && !outcomes[row.line]);
  const problems = checked.filter((row) => row.problem).length;

  const clear = () => {
    setFile(null);
    setRows([]);
    setFileError('');
    setOutcomes({});
  };
  const close = () => {
    if (running) return;
    onClose();
  };

  async function choose(next: File | undefined) {
    clear();
    if (!next) return;
    if (!/\.csv$/i.test(next.name) && next.type !== 'text/csv')
      return setFileError('Choose a .csv file. From Excel, save as "CSV UTF-8".');
    if (next.size > MAX_FILE_BYTES)
      return setFileError(`That file is ${fileSize(next.size)}; the limit is 1 MB.`);
    setFile(next);
    const result = draftsFromCsv(await next.text());
    setFileError(result.error ?? '');
    setRows(result.rows);
  }

  async function createAll() {
    setRunning(true);
    let created = 0;
    // One at a time, so Core reports each code conflict on its own row.
    for (const row of ready) {
      try {
        await create(row.input!);
        created += 1;
        setOutcomes((current) => ({ ...current, [row.line]: { state: 'created' } }));
      } catch (error) {
        setOutcomes((current) => ({
          ...current,
          [row.line]: { state: 'failed', message: coreMessage(error) },
        }));
      }
    }
    setRunning(false);
    if (created) notify.success(`${created} draft${created === 1 ? '' : 's'} created`);
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && close()}
      onExited={clear}
      title="Import rewards"
      description="Each row of the file becomes a draft you can review before activating."
      size="lg"
      footer={
        <>
          <Button className="btn-ghost" disabled={running} onClick={close}>
            Close
          </Button>
          <Button
            className="btn-primary"
            disabled={!ready.length}
            loading={running}
            onClick={() => void createAll()}
          >
            Create {ready.length} draft{ready.length === 1 ? '' : 's'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (!running) void choose(event.dataTransfer.files[0]);
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-2 rounded-box border border-dashed border-base-300 bg-base-200/30 px-6 py-10 text-center transition-colors hover:border-base-content/30 hover:bg-base-200/60 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-primary',
            dragging && 'border-primary bg-primary/5',
            running && 'pointer-events-none opacity-60',
          )}
        >
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            disabled={running}
            onChange={(event) => {
              void choose(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          <PlusCircle size={30} className="opacity-60" aria-hidden />
          <span className="text-sm opacity-70">Drag & drop or click to choose a CSV file</span>
          <span className="flex items-center gap-1 text-xs opacity-60">
            <Info size={14} aria-hidden /> Up to 1 MB and {MAX_IMPORT_ROWS} rewards per file
          </span>
        </label>

        {fileError && (
          <p role="alert" className="alert alert-error alert-soft text-sm">
            {fileError}
          </p>
        )}

        {file && (
          <div className="flex items-center gap-3 rounded-box border border-base-300 bg-base-100 p-3 shadow-xs">
            <FileCsv size={28} weight="duotone" className="shrink-0 text-warning" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name.replace(/\.csv$/i, '')}</p>
              <p className="text-xs opacity-60">
                .csv | {fileSize(file.size)}
                {checked.length > 0 &&
                  ` | ${ready.length} ready${problems ? `, ${problems} to fix` : ''}`}
              </p>
            </div>
            <Button
              aria-label={`Remove ${file.name}`}
              disabled={running}
              onClick={clear}
              className="btn-ghost btn-sm btn-circle min-w-0 border border-base-300"
            >
              <Trash size={16} />
            </Button>
          </div>
        )}

        <a
          className="btn btn-soft btn-sm w-full font-medium"
          download="octap-rewards-template.csv"
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`}
        >
          <DownloadSimple size={16} /> Download the CSV template
        </a>

        {checked.length > 0 && (
          <ul className="mt-2 divide-y divide-base-300 rounded-box border border-base-300">
            {checked.map((row) => {
              const outcome = outcomes[row.line];
              const failed = outcome?.state === 'failed' || (!outcome && !!row.problem);
              return (
                <li key={row.line} className="flex items-start gap-4 px-4 py-3 text-sm">
                  <span className="w-8 shrink-0 font-mono text-xs opacity-50">#{row.line}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{row.draft.title || 'Untitled'}</p>
                    <p className="truncate text-xs opacity-60">
                      {row.draft.code}, {describeBenefit(row.draft)}, {describeValidity(row.draft)}
                    </p>
                  </div>
                  <span className="shrink-0 tabular-nums opacity-80">
                    {/^\d+$/.test(row.draft.pointsCost)
                      ? describePoints(Number(row.draft.pointsCost))
                      : row.draft.pointsCost || '?'}
                  </span>
                  <span
                    className={cn(
                      'w-40 shrink-0 text-right text-xs',
                      failed ? 'text-error' : outcome ? 'text-success' : 'opacity-60',
                    )}
                  >
                    {outcome?.state === 'created'
                      ? 'Draft created'
                      : outcome?.state === 'failed'
                        ? outcome.message
                        : (row.problem ?? 'Ready')}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}

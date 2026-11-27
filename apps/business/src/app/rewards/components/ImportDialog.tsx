import { useState, type ReactNode } from 'react';
import {
  ArrowCounterClockwise,
  CaretDown,
  CaretRight,
  CheckCircle,
  Circle,
  DownloadSimple,
  FileCsv,
  Info,
  PlusCircle,
  Trash,
  Warning,
} from 'phosphor-react';
import { Button, Modal } from '@octap/shared/components';
import { cn } from '@/utils/cn';
import {
  batchTitle,
  columnOfCoreField,
  describeDifference,
  editedAfterImport,
  reviewGroupOf,
  type BatchItemResult,
  type ReviewGroup,
} from '../domain/batches';
import { CSV_TEMPLATE, MAX_IMPORT_ROWS, columnOf, draftsFromCsv } from '../domain/csv';
import { describeBenefit, describePoints, describeValidity } from '../domain/describe';
import { toRewardInput, type RewardDraft, type RewardInput } from '../domain/draft';
import { coreMessage } from '../domain/errors';
import { buildXlsxTemplate } from '../domain/xlsxTemplate';
import { useBatches, useImportBatch, type ImportResponse } from '../hooks/useBatches';
import { useRewards } from '../hooks/useRewards';

/** A CSV of 100 vouchers is a few kilobytes; anything near this is not a voucher file. */
const MAX_FILE_BYTES = 1024 * 1024;
/** Core's limit on a batch's name (`VOUCHER_BATCH_MAX_NAME_LENGTH`). */
const MAX_BATCH_NAME_LENGTH = 120;

const fileSize = (bytes: number) =>
  bytes < 1024
    ? `${bytes} B`
    : bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** A row of the file after the checks made in the browser: `input` is what Core is sent. */
interface FileRow {
  line: number;
  draft: RewardDraft;
  input?: RewardInput;
  problem?: string;
}

/** A row in the Review step: a problem found in the browser, or Core's dry-run result. */
interface ReviewRow extends FileRow {
  group: ReviewGroup;
  result?: BatchItemResult;
}

type Step = 'upload' | 'review' | 'done';

/**
 * Checks every row in the browser: a row that can't be read, fails the form's own checks, or
 * repeats the code of an earlier row that will be sent gets a `problem` and is never sent.
 */
function checkRows(text: string): { rows: FileRow[]; error?: string } {
  const parsed = draftsFromCsv(text);
  const seen = new Map<string, number>();
  const rows = parsed.rows.map((row): FileRow => {
    const { input, errors } = toRewardInput(row.draft);
    const problems = [
      row.problem,
      ...Object.entries(errors).map(([field, message]) => `${columnOf(field)}: ${message}`),
    ].filter(Boolean);
    const code = input?.code ?? row.draft.code;
    const earlier = seen.get(code);
    if (earlier && !problems.length)
      problems.push(`code: ${code} is already used by row ${earlier}`);
    // Only a row that will be sent holds its code: a corrected copy after a bad row is not a repeat.
    if (!earlier && !problems.length && input) seen.set(code, row.line);
    return problems.length || !input
      ? { ...row, problem: problems.join('; ') || 'This row could not be read' }
      : { ...row, input };
  });
  return { rows, error: parsed.error };
}

/** Saves the Excel template, built in the browser from the CSV template. */
function downloadXlsxTemplate() {
  const blob = new Blob([buildXlsxTemplate() as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'octap-vouchers-template.xlsx';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Imports vouchers from a CSV as one draft batch (OCT-304). Upload checks the file in the browser,
 * Review shows what Core would do with each row (a dry run: nothing is written), and Create writes
 * the rows that can be written as one batch. Closing before Create leaves nothing behind. Stays
 * mounted so it animates in and out; closing it starts over.
 */
export function ImportDialog({
  open,
  onClose,
  onOpenBatch,
}: {
  open: boolean;
  onClose: () => void;
  onOpenBatch: (batchId: string) => void;
}) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<{ name: string; size: number; rows: FileRow[] } | null>(null);
  const [fileError, setFileError] = useState('');
  const [dragging, setDragging] = useState(false);
  const check = useImportBatch();
  const create = useImportBatch();
  const running = check.isPending || create.isPending;

  const clean = file?.rows.filter((row) => row.input) ?? [];
  const local = file?.rows.filter((row) => row.problem) ?? [];
  const body = (dryRun: boolean) => ({
    // The batch is named after the file, so the merchant recognizes it in Import history.
    name: file ? file.name.trim().slice(0, MAX_BATCH_NAME_LENGTH) : undefined,
    items: clean.map((row) => row.input!),
    dryRun,
  });

  const rows: ReviewRow[] = [
    ...local.map((row): ReviewRow => ({ ...row, group: 'attention' })),
    ...(check.data?.items ?? []).map((result): ReviewRow => {
      const row = clean[result.index];
      return { ...row, result, group: reviewGroupOf(result) };
    }),
  ].sort((a, b) => a.line - b.line);
  const count = (group: ReviewGroup) => rows.filter((row) => row.group === group).length;
  const writable = count('fresh') + count('revived');
  const skipped = count('attention');

  // Only to tell whether a conflicting voucher was edited after the import that saved it.
  const conflicts = rows.some((row) => row.result?.status === 'conflict');
  const vouchers = useRewards();
  const batches = useBatches(true, conflicts);
  const edited = (row: ReviewRow) =>
    row.result?.status === 'conflict' &&
    editedAfterImport(
      vouchers.data?.find(
        (voucher) => voucher.id === (row.result as { voucherId: string }).voucherId,
      ),
      batches.data,
    );

  const reset = () => {
    setStep('upload');
    setFile(null);
    setFileError('');
    check.reset();
    create.reset();
  };
  const close = () => {
    if (!running) onClose();
  };

  async function choose(next: File | undefined) {
    reset();
    if (!next) return;
    if (!/\.csv$/i.test(next.name) && next.type !== 'text/csv')
      return setFileError('Choose a .csv file. From Excel, save as "CSV UTF-8".');
    if (next.size > MAX_FILE_BYTES)
      return setFileError(`That file is ${fileSize(next.size)}; the limit is 1 MB.`);
    const checked = checkRows(await next.text());
    setFileError(checked.error ?? '');
    setFile({ name: next.name, size: next.size, rows: checked.rows });
  }

  const failure = check.error ?? create.error;
  const footer =
    step === 'upload' ? (
      <>
        <Button className="btn-ghost" disabled={running} onClick={close}>
          Cancel
        </Button>
        <Button
          className="btn-primary"
          disabled={!clean.length}
          loading={check.isPending}
          onClick={() => check.mutate(body(true), { onSuccess: () => setStep('review') })}
        >
          {check.isPending ? `Checking ${plural(clean.length, 'voucher')}…` : 'Check file'}
        </Button>
      </>
    ) : step === 'review' ? (
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <Button className="btn-ghost" disabled={running} onClick={reset}>
          Choose another file
        </Button>
        <div className="flex flex-col items-end gap-1">
          <Button
            className="btn-primary"
            disabled={writable === 0}
            loading={create.isPending}
            onClick={() => create.mutate(body(false), { onSuccess: () => setStep('done') })}
          >
            {`Create ${plural(writable, 'draft')}`}
            {skipped > 0 && `, skip ${plural(skipped, 'row')}`}
          </Button>
          <span className="text-xs opacity-70">
            {writable === 0
              ? 'No row can be created: fix the file and choose it again.'
              : skipped > 0
                ? 'Skipped rows are not written; fix them and import again later.'
                : 'Nothing goes live until you activate the batch.'}
          </span>
        </div>
      </div>
    ) : (
      <>
        <Button className="btn-ghost" onClick={close}>
          Close
        </Button>
        {create.data?.batch && (
          <Button className="btn-primary" onClick={() => onOpenBatch(create.data.batch!.id)}>
            Open the batch
          </Button>
        )}
      </>
    );

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && close()}
      onExited={reset}
      title="Import vouchers"
      description={
        file && step !== 'upload'
          ? `File: ${file.name}`
          : `Each row becomes a draft (at most ${MAX_IMPORT_ROWS}). Nothing goes live until you activate the batch.`
      }
      size="lg"
      footer={footer}
    >
      <div className="flex flex-col gap-4">
        <Steps step={step} />
        {failure && (
          <p role="alert" className="alert alert-error alert-soft text-sm">
            {coreMessage(failure)}
          </p>
        )}
        {step === 'upload' && (
          <>
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
                aria-label="CSV file"
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
                <Info size={14} aria-hidden /> Up to 1 MB and {MAX_IMPORT_ROWS} vouchers per file.
                From Excel: File › Save as › CSV UTF-8.
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
                    .csv | {fileSize(file.size)} | {clean.length} ready to check
                    {local.length > 0 && `, ${local.length} to fix in the file`}
                  </p>
                </div>
                <Button
                  aria-label={`Remove ${file.name}`}
                  disabled={running}
                  onClick={reset}
                  className="btn-ghost btn-sm btn-circle min-w-0 border border-base-300"
                >
                  <Trash size={16} />
                </Button>
              </div>
            )}

            {/* One download, the Excel template; its CSV twin stays available as a small link. */}
            <div className="flex flex-col gap-1">
              <Button className="btn-soft btn-sm w-full font-medium" onClick={downloadXlsxTemplate}>
                <DownloadSimple size={16} /> Download the template (Excel)
              </Button>
              <p className="text-center text-xs opacity-60">
                Fill it in, save it as CSV, then choose it here. Or use the{' '}
                <a
                  className="link"
                  download="octap-vouchers-template.csv"
                  href={`data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`}
                >
                  CSV version
                </a>
                .
              </p>
            </div>

            {local.length > 0 && (
              <ul className="flex flex-col gap-1 text-sm" aria-label="Rows to fix">
                {local.map((row) => (
                  <li key={row.line} className="flex gap-2 text-error">
                    <Warning size={16} className="mt-0.5 shrink-0" />
                    <span>
                      Row {row.line}: {row.problem}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        {step === 'review' && (
          <Review rows={rows} writable={writable} skipped={skipped} edited={edited} />
        )}
        {step === 'done' && create.data && <Done response={create.data} />}
      </div>
    </Modal>
  );
}

function Steps({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'upload', label: 'Upload' },
    { id: 'review', label: 'Review' },
    { id: 'done', label: 'Done' },
  ];
  const at = steps.findIndex((s) => s.id === step);
  return (
    <ul className="steps steps-horizontal w-full text-xs" aria-label="Import steps">
      {steps.map((s, i) => (
        <li
          key={s.id}
          className={cn('step', i <= at && 'step-primary')}
          aria-current={i === at ? 'step' : undefined}
        >
          {s.label}
        </li>
      ))}
    </ul>
  );
}

const GROUPS: { id: ReviewGroup; label: string; icon: ReactNode; open: boolean }[] = [
  {
    id: 'attention',
    label: 'Needs attention',
    icon: <Warning className="text-warning" />,
    open: true,
  },
  {
    id: 'revived',
    label: 'Will bring back an archived draft',
    icon: <ArrowCounterClockwise className="text-info" />,
    open: false,
  },
  { id: 'fresh', label: 'New', icon: <CheckCircle className="text-success" />, open: false },
  {
    id: 'saved',
    label: 'Already saved, nothing to do',
    icon: <Circle className="opacity-50" />,
    open: false,
  },
];

function Review({
  rows,
  writable,
  skipped,
  edited,
}: {
  rows: ReviewRow[];
  writable: number;
  skipped: number;
  edited: (row: ReviewRow) => boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium" role="status">
        {plural(writable, 'voucher')} can be created.
        {skipped > 0 && ` ${plural(skipped, 'row')} need attention.`}
      </p>
      {GROUPS.map((group) => {
        const members = rows.filter((row) => row.group === group.id);
        if (!members.length) return null;
        return (
          <Group
            key={group.id}
            label={`${group.label} (${members.length})`}
            icon={group.icon}
            defaultOpen={group.open}
          >
            <ul className="flex flex-col divide-y divide-base-300 rounded-box border border-base-300">
              {members.map((row) => (
                <ReviewItem key={row.line} row={row} edited={edited(row)} />
              ))}
            </ul>
          </Group>
        );
      })}
    </div>
  );
}

function Group({
  label,
  icon,
  defaultOpen,
  children,
}: {
  label: string;
  icon: ReactNode;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="flex flex-col gap-2">
      <button
        type="button"
        className="flex items-center gap-2 text-left text-sm font-semibold"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <CaretDown /> : <CaretRight />}
        {icon}
        {label}
      </button>
      {open && children}
    </section>
  );
}

function ReviewItem({ row, edited }: { row: ReviewRow; edited: boolean }) {
  const result = row.result;
  const differences =
    result && (result.status === 'conflict' || result.status === 'replaced')
      ? result.differences
      : [];
  return (
    <li className="flex flex-col gap-1.5 p-3 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="min-w-0">
          <span className="opacity-60">Row {row.line} · </span>
          <span className="font-mono text-xs">{row.draft.code || '—'}</span>
          <span className="opacity-60"> · </span>
          <span className="font-medium">{row.draft.title || '(no title)'}</span>
          {row.draft.title && (
            <span className="opacity-60">
              {' '}
              · {describeBenefit(row.draft)}, {describeValidity(row.draft)}
              {/^\d+$/.test(row.draft.pointsCost) &&
                `, ${describePoints(Number(row.draft.pointsCost))}`}
            </span>
          )}
        </span>
        <span className="text-xs">{verdict(row)}</span>
      </div>
      {differences.length > 0 && (
        <table className="table table-xs w-auto">
          <thead>
            <tr>
              <th>Field</th>
              <th>{result?.status === 'conflict' ? 'Saved now' : 'Archived draft'}</th>
              <th>In this file</th>
            </tr>
          </thead>
          <tbody>
            {differences.map((difference) => {
              const shown = describeDifference(difference);
              return (
                <tr key={difference.field}>
                  <td>{shown.label}</td>
                  <td>{shown.saved}</td>
                  <td>{shown.file}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {result?.status === 'conflict' && (
        <p className="text-xs opacity-75">
          {edited && 'Someone edited the saved one after the last import; this file is older. '}
          Kept as it is. To offer this, give the row a new code.
        </p>
      )}
    </li>
  );
}

function verdict(row: ReviewRow): ReactNode {
  const result = row.result;
  if (!result) return <span className="text-error">✗ Needs fixing: {row.problem}</span>;
  switch (result.status) {
    case 'error': {
      const column = columnOfCoreField(result.error.field);
      return (
        <span className="text-error">
          ✗ Needs fixing{column ? ` (${column})` : ''}: {result.error.message}
        </span>
      );
    }
    case 'conflict':
      return <span className="text-warning">⚠ Different from the saved one</span>;
    case 'replaced':
      return (
        <span className="text-info">↻ Will bring back an archived draft, with these values</span>
      );
    case 'unchanged':
      return result.movedToBatch ? (
        <span className="text-info">↻ Will bring back an archived draft</span>
      ) : (
        <span className="opacity-60">○ Already saved</span>
      );
    case 'created':
      return <span className="text-success">● New draft</span>;
  }
}

function Done({ response }: { response: ImportResponse }) {
  const landed = response.items.filter((item) => {
    const group = reviewGroupOf(item);
    return group === 'fresh' || group === 'revived';
  }).length;
  if (!response.batch)
    return (
      <p role="status" className="alert alert-info alert-soft text-sm">
        Nothing was added: every row is already saved or needs attention.
      </p>
    );
  return (
    <div
      role="status"
      className="flex flex-col gap-2 rounded-box border border-success/40 p-4 text-sm"
    >
      <p className="font-semibold">
        {plural(landed, 'draft')} in “{batchTitle(response.batch)}”.
      </p>
      <p className="opacity-75">
        Check them in the batch, edit any one you need, then activate the whole batch at once.
      </p>
    </div>
  );
}

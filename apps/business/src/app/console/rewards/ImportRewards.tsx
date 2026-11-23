import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowCounterClockwise,
  CaretDown,
  CaretRight,
  CheckCircle,
  Circle,
  Warning,
  XCircle,
} from 'phosphor-react';
import { useState, type ReactNode } from 'react';
import {
  MAX_BATCH_NAME_LENGTH,
  type ConsoleVoucherInput,
  type CreateVoucherBatchResponse,
  type VoucherBatchItemResult,
} from '@octap/services';
import { useAuth } from '@octap/shared/authentication';
import { SidePanel } from '@octap/shared/components';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/cn';
import { batchesApi, rewardsApi } from './api';
import {
  batchTitle,
  columnOfCoreField,
  describeDifference,
  editedAfterImport,
  reviewGroupOf,
  type ReviewGroup,
} from './batches';
import { describeBenefit, toVoucherInput, type RewardDraft } from './benefit';
import { CSV_TEMPLATE, MAX_IMPORT_ROWS, columnOf, draftsFromCsv } from './csv';
import { coreErrors } from './errors';
import { buildXlsxTemplate } from './xlsxTemplate';

/** A row of the file after the checks made in the browser: `input` is what Core is sent. */
interface FileRow {
  line: number;
  draft: RewardDraft;
  input?: ConsoleVoucherInput;
  problem?: string;
}

/** A row in the Review step: a problem found in the browser, or Core's dry-run result. */
interface ReviewRow extends FileRow {
  group: ReviewGroup;
  result?: VoucherBatchItemResult;
}

type Step = 'upload' | 'review' | 'done';

/**
 * Checks every row in the browser: a row that can't be read, fails the form's own checks, or
 * repeats a code of an earlier row gets a `problem` and is never sent.
 */
function checkRows(text: string): { rows: FileRow[]; error?: string } {
  const parsed = draftsFromCsv(text);
  const seen = new Map<string, number>();
  const rows = parsed.rows.map((row): FileRow => {
    const { input, errors } = toVoucherInput(row.draft);
    const problems = [
      row.problem,
      ...Object.entries(errors).map(([key, value]) => `${columnOf(key)}: ${value}`),
    ].filter(Boolean);
    const code = input?.code ?? row.draft.code;
    const earlier = seen.get(code);
    if (earlier && !problems.length)
      problems.push(`code: ${code} is already used by row ${earlier}`);
    if (!earlier) seen.set(code, row.line);
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
  link.download = 'octap-rewards-template.xlsx';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The batch is named after the file, so the merchant recognizes it in Import history. */
const nameOf = (file: string) => file.trim().slice(0, MAX_BATCH_NAME_LENGTH);

/**
 * Import rewards from a CSV as one draft batch (OCT-304): Upload checks the file in the browser,
 * Review shows what Core would do with each row (a dry run: nothing is written), and Create writes
 * the rows that can be written as one batch. Closing before Create leaves nothing behind.
 */
export default function ImportRewards({
  onClose,
  onOpenBatch,
}: {
  onClose: () => void;
  onOpenBatch: (batchId: string) => void;
}) {
  const auth = useAuth();
  const { organizationId } = useOrganization();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<{ name: string; rows: FileRow[]; error?: string } | null>(null);
  const clean = file?.rows.filter((row) => row.input) ?? [];
  const local = file?.rows.filter((row) => row.problem) ?? [];
  const body = (dryRun: boolean) => ({
    name: file ? nameOf(file.name) : undefined,
    items: clean.map((row) => row.input!),
    dryRun,
  });

  const check = useMutation({
    mutationFn: () => batchesApi(auth).create(organizationId, body(true)),
    onSuccess: () => setStep('review'),
  });
  const create = useMutation({
    mutationFn: () => batchesApi(auth).create(organizationId, body(false)),
    onSuccess: () => setStep('done'),
  });
  const running = check.isPending || create.isPending;

  const reviewRows = (response?: CreateVoucherBatchResponse): ReviewRow[] =>
    [
      ...local.map((row): ReviewRow => ({ ...row, group: 'attention' })),
      ...(response?.items ?? []).map((result): ReviewRow => {
        const row = clean[result.index];
        return { ...row, result, group: reviewGroupOf(result) };
      }),
    ].sort((a, b) => a.line - b.line);
  const rows = reviewRows(check.data);
  const count = (group: ReviewGroup) => rows.filter((row) => row.group === group).length;
  const writable = count('fresh') + count('revived');
  const skipped = count('attention');

  // Only to tell whether a conflicting reward was edited after the import that saved it.
  const conflicts = rows.some((row) => row.result?.status === 'conflict');
  const vouchers = useQuery({
    queryKey: ['console-rewards', organizationId],
    queryFn: ({ signal }) => rewardsApi(auth).list(organizationId, signal),
    enabled: conflicts,
  });
  const batches = useQuery({
    queryKey: ['console-voucher-batches', organizationId, true],
    queryFn: ({ signal }) => batchesApi(auth).list(organizationId, true, signal),
    enabled: conflicts,
  });

  const failure = check.error ?? create.error;
  const restart = () => {
    setStep('upload');
    setFile(null);
    check.reset();
    create.reset();
  };

  const footer =
    step === 'upload' ? (
      <>
        <Button className="btn-ghost" disabled={running} onClick={onClose}>
          Cancel
        </Button>
        <Button
          className="btn-primary"
          disabled={running || clean.length === 0}
          onClick={() => check.mutate()}
        >
          {check.isPending && <span className="loading loading-spinner loading-sm" />}
          {check.isPending ? `Checking ${clean.length} rewards…` : 'Check file'}
        </Button>
      </>
    ) : step === 'review' ? (
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <Button className="btn-ghost" disabled={running} onClick={restart}>
          Choose another file
        </Button>
        <div className="flex flex-col items-end gap-1">
          <Button
            className="btn-primary"
            disabled={running || writable === 0}
            onClick={() => create.mutate()}
          >
            {create.isPending && <span className="loading loading-spinner loading-sm" />}
            {`Create ${writable} draft${writable === 1 ? '' : 's'}`}
            {skipped > 0 && `, skip ${skipped} row${skipped === 1 ? '' : 's'}`}
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
        <Button className="btn-ghost" onClick={onClose}>
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
    <SidePanel
      open
      onOpenChange={(open) => !open && !running && onClose()}
      title="Import rewards"
      description={
        file && step !== 'upload'
          ? `File: ${file.name}`
          : `Each row becomes a draft (at most ${MAX_IMPORT_ROWS}). Nothing goes live until you activate the batch.`
      }
      footer={footer}
    >
      <div className="flex flex-col gap-4 py-2">
        <Steps step={step} />
        {failure && (
          <p role="alert" className="alert alert-error alert-soft text-sm">
            {Object.values(coreErrors(failure))[0] ?? 'Core could not check the file. Try again.'}
          </p>
        )}
        {step === 'upload' && (
          <Upload
            file={file}
            disabled={running}
            onFile={(name, text) => {
              check.reset();
              setFile({ name, ...checkRows(text) });
            }}
            problems={local}
            ready={clean.length}
          />
        )}
        {step === 'review' && (
          <Review
            rows={rows}
            writable={writable}
            skipped={skipped}
            edited={(row) =>
              row.result?.status === 'conflict' &&
              editedAfterImport(
                vouchers.data?.find(
                  (v) => v.id === (row.result as { voucherId: string }).voucherId,
                ),
                batches.data,
              )
            }
          />
        )}
        {step === 'done' && create.data && <Done response={create.data} />}
      </div>
    </SidePanel>
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

function Upload({
  file,
  disabled,
  onFile,
  problems,
  ready,
}: {
  file: { name: string; error?: string } | null;
  disabled: boolean;
  onFile: (name: string, text: string) => void;
  problems: FileRow[];
  ready: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col items-center gap-2 rounded-box border-2 border-dashed border-base-300 p-8 text-center text-sm">
        <span className="font-medium">Choose a CSV file</span>
        <input
          type="file"
          accept=".csv,text/csv"
          aria-label="CSV file"
          className="file-input file-input-sm"
          disabled={disabled}
          onChange={async (event) => {
            const chosen = event.target.files?.[0];
            if (chosen) onFile(chosen.name, await chosen.text());
          }}
        />
        <span className="opacity-60">
          At most {MAX_IMPORT_ROWS} rewards. From Excel: File › Save as › CSV UTF-8.
        </span>
      </label>
      <div className="flex flex-col gap-1 text-sm">
        <span className="flex flex-wrap gap-x-4 gap-y-1">
          <button type="button" className="link" onClick={downloadXlsxTemplate}>
            Download the Excel template
          </button>
          <a
            className="link"
            download="octap-rewards-template.csv"
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`}
          >
            Download the template
          </a>
        </span>
        <span className="text-xs opacity-60">
          The Excel template has a drop-down for the type and checks dates and numbers as you type;
          its Guide sheet says which columns each type needs. Fill it in Excel or Google Sheets,
          then save it as CSV and choose that file here.
        </span>
      </div>
      {file?.error && (
        <p role="alert" className="alert alert-error alert-soft text-sm">
          {file.error}
        </p>
      )}
      {file && !file.error && (
        <p className="text-sm">
          {ready} row{ready === 1 ? '' : 's'} ready to check
          {problems.length > 0 && `, ${problems.length} need fixing in the file`}.
        </p>
      )}
      {problems.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm" aria-label="Rows to fix">
          {problems.map((row) => (
            <li key={row.line} className="flex gap-2 text-error">
              <XCircle size={16} className="mt-0.5 shrink-0" />
              <span>
                Row {row.line}: {row.problem}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
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
        {writable} reward{writable === 1 ? '' : 's'} can be created.
        {skipped > 0 && ` ${skipped} row${skipped === 1 ? '' : 's'} need attention.`}
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
          {row.draft.title && <span className="opacity-60"> · {describeBenefit(row.draft)}</span>}
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

function Done({ response }: { response: CreateVoucherBatchResponse }) {
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
        {landed} draft{landed === 1 ? '' : 's'} in “{batchTitle(response.batch)}”.
      </p>
      <p className="opacity-75">
        Check them in the batch, edit any one you need, then activate the whole batch at once.
      </p>
    </div>
  );
}

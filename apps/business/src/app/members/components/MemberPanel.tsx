import { useState, type ReactNode } from 'react';
import { Button, SidePanel } from '@octap/shared/components';
import { CopyButton } from '@/components/shared/Controls';
import { StatusBadge } from '@/components/shared/Display';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { cn } from '@/utils/cn';
import { fmtDate, fmtDateTime, fmtNumber } from '@/utils/format';
import {
  useMember,
  useMemberTransactions,
  useMemberVouchers,
  useUpdateMember,
  type Member,
} from '../hooks/useMembers';
import { initials } from './initials';

const TX_LABEL: Record<string, string> = {
  EARN: 'Earned',
  REDEEM: 'Redeemed',
  ADJUSTMENT: 'Adjusted',
  EXPIRY: 'Expired',
  REVERSAL: 'Reversed',
  TRANSFER: 'Transferred',
};

/** A titled block in the panel. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-b border-base-300 py-5 last:border-b-0">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

/** A label and its value, one row of a details list. */
function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <dt className="opacity-60">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1 text-right">{children}</dd>
    </div>
  );
}

/** A member opened from the list: balance, profile, the Owner's edits, and activity. */
export function MemberPanel({
  open,
  memberId,
  onClose,
}: {
  /** Shows the panel. `memberId` stays set while it slides away, so the content stays too. */
  open: boolean;
  memberId: string | null;
  onClose: () => void;
}) {
  const member = useMember(memberId);
  const name = member.data?.displayName ?? member.data?.email ?? 'Member';

  return (
    <SidePanel
      open={open}
      onOpenChange={(open) => !open && onClose()}
      // Half the screen on desktop; the full width on small screens.
      className="max-w-none md:w-6/10"
      title={
        <span className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
          >
            {initials(name)}
          </span>
          {member.data ? name : 'Loading member…'}
        </span>
      }
      description={member.data && (member.data.email ?? member.data.phoneNumber ?? undefined)}
    >
      {member.error ? (
        <p role="alert" className="py-5 text-sm text-error">
          {member.error.message}
        </p>
      ) : !member.data ? (
        <div className="flex flex-col gap-3 py-5" aria-busy>
          <div className="skeleton h-20 w-full" />
          <div className="skeleton h-32 w-full" />
        </div>
      ) : (
        <MemberDetails key={member.data.id} member={member.data} />
      )}
    </SidePanel>
  );
}

function MemberDetails({ member }: { member: Member }) {
  const { owner } = useOrganization();
  const { balance } = member;

  return (
    <>
      <Section title="Points">
        <div className="grid grid-cols-3 gap-3">
          {[
            ['Available', balance.confirmedBalance],
            ['Pending earn', balance.pendingEarn],
            ['Pending redemption', balance.pendingRedemption],
          ].map(([label, value]) => (
            <div key={label} className="rounded-box border border-base-300 p-3">
              <p className="text-xs opacity-60">{label}</p>
              <p className="text-xl font-semibold tabular-nums">{fmtNumber(value as number)}</p>
            </div>
          ))}
        </div>
        <p className="text-xs opacity-60">
          {fmtNumber(balance.lifetimeEarned)} earned and {fmtNumber(balance.lifetimeRedeemed)}{' '}
          redeemed in total. {balance.stale && 'Pending transactions may still change the balance.'}
        </p>
      </Section>

      <Section title="Profile">
        <dl className="flex flex-col gap-2">
          <Detail label="Status">
            <StatusBadge status={member.status.toLowerCase()} />
          </Detail>
          <Detail label="Joined">{fmtDate(member.joinedAt)}</Detail>
          <Detail label="External ID">
            {member.externalMemberId ? (
              <span className="truncate font-mono">{member.externalMemberId}</span>
            ) : (
              <span className="opacity-50">Not linked</span>
            )}
          </Detail>
          <Detail label="Member ID">
            <span className="truncate font-mono text-xs opacity-70">{member.id}</span>
            <CopyButton value={member.id} />
          </Detail>
        </dl>
      </Section>

      {owner && (
        <Section title="Manage">
          <MemberEditForm member={member} />
        </Section>
      )}

      <Section title="Points history">
        <Transactions memberId={member.id} />
      </Section>

      <Section title="Vouchers">
        <Vouchers memberId={member.id} />
      </Section>
    </>
  );
}

/** The Owner's edits: status, external ID, and metadata as JSON (folded away). */
function MemberEditForm({ member }: { member: Member }) {
  const update = useUpdateMember(member);
  const [status, setStatus] = useState(member.status as 'ACTIVE' | 'BLOCKED');
  const [externalId, setExternalId] = useState(member.externalMemberId ?? '');
  const [metadata, setMetadata] = useState(JSON.stringify(member.metadata ?? {}, null, 2));
  const [error, setError] = useState('');
  const dirty =
    status !== member.status ||
    externalId.trim() !== (member.externalMemberId ?? '') ||
    metadata !== JSON.stringify(member.metadata ?? {}, null, 2);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(metadata) as Record<string, unknown>;
        } catch {
          return setError('Metadata must be valid JSON.');
        }
        setError('');
        update.mutate({ status, externalMemberId: externalId.trim() || null, metadata: parsed });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Status
          <select
            className="select w-full font-normal"
            value={status}
            onChange={(event) => setStatus(event.target.value as 'ACTIVE' | 'BLOCKED')}
          >
            <option value="ACTIVE">Active</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          External ID
          <input
            className="input w-full font-mono font-normal"
            value={externalId}
            maxLength={160}
            placeholder="Your POS or CRM ID"
            onChange={(event) => setExternalId(event.target.value)}
          />
        </label>
      </div>
      <details className="group">
        <summary className="cursor-pointer text-sm opacity-70 hover:opacity-100">Metadata</summary>
        <textarea
          aria-label="Member metadata"
          className={cn('textarea mt-2 w-full font-mono text-xs', error && 'textarea-error')}
          rows={5}
          value={metadata}
          onChange={(event) => setMetadata(event.target.value)}
        />
      </details>
      <div className="flex items-center justify-end gap-2">
        {error && (
          <p role="alert" className="mr-auto text-sm text-error">
            {error}
          </p>
        )}
        <Button
          type="submit"
          className="btn-primary btn-sm"
          disabled={!dirty}
          loading={update.isPending}
        >
          Save
        </Button>
      </div>
    </form>
  );
}

/** The member's points history, newest first, ten at a time. */
function Transactions({ memberId }: { memberId: string }) {
  const history = useMemberTransactions(memberId);
  const items = history.data?.pages.flatMap((page) => page.items) ?? [];

  if (history.isPending) return <div className="skeleton h-16 w-full" aria-busy />;
  if (history.error)
    return (
      <p role="alert" className="text-sm text-error">
        {history.error.message}
      </p>
    );
  if (!items.length) return <p className="text-sm opacity-60">No points activity yet.</p>;

  return (
    <>
      <ul className="divide-y divide-base-300 rounded-box border border-base-300">
        {items.map((tx) => (
          <li key={tx.id} className="flex items-center gap-3 px-3 py-2 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{TX_LABEL[tx.transactionType] ?? tx.transactionType}</p>
              <p className="text-xs opacity-60">{fmtDateTime(tx.createdAt)}</p>
            </div>
            <StatusBadge status={tx.status.toLowerCase()} />
            <span className="w-20 text-right font-mono tabular-nums">
              {tx.pointsAmount === null ? '?' : fmtNumber(tx.pointsAmount)}
            </span>
          </li>
        ))}
      </ul>
      {history.hasNextPage && (
        <Button
          className="btn-ghost btn-sm self-center"
          loading={history.isFetchingNextPage}
          onClick={() => void history.fetchNextPage()}
        >
          Load more
        </Button>
      )}
    </>
  );
}

/** The vouchers the member has claimed, with their serial codes. */
function Vouchers({ memberId }: { memberId: string }) {
  const vouchers = useMemberVouchers(memberId);

  if (vouchers.isPending) return <div className="skeleton h-12 w-full" aria-busy />;
  if (vouchers.error)
    return (
      <p role="alert" className="text-sm text-error">
        {vouchers.error.message}
      </p>
    );
  if (!vouchers.data.length) return <p className="text-sm opacity-60">No vouchers claimed.</p>;

  return (
    <ul className="divide-y divide-base-300 rounded-box border border-base-300">
      {vouchers.data.map((owned) => (
        <li key={owned.id} className="flex items-center gap-3 px-3 py-2 text-sm">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{owned.voucher?.title ?? 'Voucher'}</p>
            <p className="text-xs opacity-60">
              <span className="font-mono">{owned.serialCode}</span>, claimed{' '}
              {fmtDate(owned.claimedAt)}
            </p>
          </div>
          <StatusBadge status={owned.status.toLowerCase()} />
        </li>
      ))}
    </ul>
  );
}

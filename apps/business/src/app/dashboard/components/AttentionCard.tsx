import { CaretRight, Clock, Warning, WarningCircle, type Icon } from 'phosphor-react';
import { Link } from 'react-router';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { organizationPath } from '@/app/organization/utils';
import { cn } from '@/utils/cn';
import type { AttentionItem } from '../domain/insights';

const TONES: Record<AttentionItem['tone'], { icon: Icon; className: string }> = {
  error: { icon: WarningCircle, className: 'bg-error/10 text-error' },
  warning: { icon: Warning, className: 'bg-warning/15 text-warning' },
  info: { icon: Clock, className: 'bg-info/10 text-info' },
};

function AttentionRow({ item }: { item: AttentionItem }) {
  const { slug } = useOrganization();
  const { icon: ToneIcon, className } = TONES[item.tone];
  const content = (
    <>
      <span
        className={cn('flex size-9 shrink-0 items-center justify-center rounded-field', className)}
      >
        <ToneIcon size={18} weight="fill" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{item.title}</span>
        <span className="block text-sm opacity-65">{item.detail}</span>
      </span>
    </>
  );
  const row = 'flex items-center gap-3 px-5 py-3';

  return item.rewards ? (
    <Link
      to={organizationPath(slug, 'vouchers')}
      className={cn(row, 'outline-none hover:bg-base-200/60 focus-visible:bg-base-200/60')}
    >
      {content}
      <CaretRight size={16} className="shrink-0 opacity-50" aria-hidden />
    </Link>
  ) : (
    <div className={row}>{content}</div>
  );
}

/** What needs someone right now, most urgent first. Shows nothing when all is well. */
export function AttentionCard({ items }: { items: AttentionItem[] }) {
  if (!items.length) return null;
  return (
    <section
      aria-label="Needs attention"
      className="overflow-hidden rounded-box border border-base-300 bg-base-100"
    >
      <header className="flex items-center gap-2 border-b border-base-300 px-5 py-3">
        <h2 className="font-semibold">Needs attention</h2>
        <span className="badge badge-ghost badge-sm">{items.length}</span>
      </header>
      <ul className="divide-y divide-base-300">
        {items.map((item) => (
          <li key={item.id}>
            <AttentionRow item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

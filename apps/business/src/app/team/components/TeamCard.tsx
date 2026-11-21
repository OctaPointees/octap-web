import type { ReactNode } from 'react';

/** A titled card on the team page, with a count beside the title. */
export function TeamCard({
  title,
  count,
  actions,
  children,
}: {
  title: string;
  count?: number;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-box border border-base-300 bg-base-100">
      <header className="flex items-center gap-2 border-b border-base-300 px-5 py-3">
        <h2 className="font-semibold">{title}</h2>
        {count !== undefined && <span className="badge badge-ghost badge-sm">{count}</span>}
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </header>
      {children}
    </section>
  );
}

/** Placeholder rows while a list loads. */
export function TeamCardSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4" aria-busy>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex items-center gap-4">
          <div className="skeleton size-9 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="skeleton h-3 w-40" />
            <div className="skeleton h-3 w-56" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** A list that failed to load, with a retry. */
export function TeamCardMessage({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 px-5 py-4 text-sm">
      <p className="flex-1 opacity-80">{error.message}</p>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

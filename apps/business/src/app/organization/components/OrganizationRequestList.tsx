import { Menu } from '@base-ui/react/menu';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowSquareOut, Buildings, Copy, DotsThreeCircle } from 'phosphor-react';
import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import { useAuth } from '@octap/shared/authentication';
import { useNavigate } from 'react-router';
import { dashboardPath } from '../utils';
import { useOrganizationRequests } from '../hooks/useOrganizationRequests';
import type { OrganizationApplication } from '@octap/shared/console-api';

const STATUS: Record<OrganizationApplication['status'], { label: string; badge: string }> = {
  PENDING: { label: 'Pending review', badge: 'badge-warning' },
  APPROVED: { label: 'Approved', badge: 'badge-success' },
  REJECTED: { label: 'Rejected', badge: 'badge-error' },
  CANCELLED: { label: 'Cancelled', badge: 'badge-neutral' },
};
const menuItem =
  'flex cursor-pointer items-center gap-2.5 rounded-field px-3 py-2 text-sm outline-none data-highlighted:bg-base-200';

/** Your organization requests as compact rows, newest first (Core already sorts them). */
export function OrganizationRequestList() {
  const requests = useOrganizationRequests();
  const items = requests.data ?? [];

  return (
    <section
      aria-labelledby="organization-requests"
      // Beside the form on xl, a divider on its left; stacked below it, a divider on top.
      className="flex min-w-0 flex-col gap-3 border-t border-base-300 pt-8 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-8"
    >
      <h2 id="organization-requests" className="flex items-center gap-2 font-semibold">
        Your requests
        {items.length > 0 && <span className="badge badge-ghost badge-sm">{items.length}</span>}
      </h2>

      {requests.isPending ? (
        <div className="flex flex-col gap-2" aria-busy>
          {[0, 1, 2].map((row) => (
            <div key={row} className="skeleton h-16 w-full rounded-box" />
          ))}
        </div>
      ) : requests.isError ? (
        <div role="alert" className="flex flex-col items-start gap-2 text-sm">
          <p className="opacity-80">Your requests could not be loaded.</p>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => void requests.refetch()}
          >
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-box border border-dashed border-base-300 px-4 py-6 text-center text-sm opacity-65">
          No requests yet. Submitted requests show here.
        </p>
      ) : (
        <ul aria-label="Organization requests" className="flex flex-col gap-2">
          {items.map((request) => (
            <li key={request.id}>
              <RequestRow request={request} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** One request: building mark, name and status, how long ago, and a menu. */
function RequestRow({ request }: { request: OrganizationApplication }) {
  const { identity } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);
  const status = STATUS[request.status] ?? STATUS.PENDING;
  const parsed = request.createdAt ? new Date(request.createdAt) : null;
  const created = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
  // Approved requests you are a member of can be opened from here.
  const membership = identity?.organizations.find(
    (org) => org.organizationId === request.organizationId,
  );

  return (
    <article className="flex items-center gap-3 rounded-box border border-base-300 bg-base-100 p-3">
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-field border border-base-300 bg-base-200/60"
      >
        <Buildings size={20} className="opacity-70" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-sm font-medium" title={request.name}>
            {request.name}
          </h3>
          <span
            className={cn('badge badge-soft badge-xs shrink-0', status.badge)}
            title={request.reason ? `Reason: ${request.reason}` : undefined}
          >
            {status.label}
          </span>
        </div>
        <p className="truncate text-xs opacity-65">
          {copied ? (
            <span role="status" className="text-success">
              ID copied
            </span>
          ) : created ? (
            <time dateTime={request.createdAt} title={format(created, 'PPpp')}>
              Requested {formatDistanceToNow(created, { addSuffix: true })}
            </time>
          ) : (
            'Requested'
          )}
        </p>
      </div>

      {request.organizationId && (
        <Menu.Root>
          <Menu.Trigger
            aria-label={`More actions for ${request.name}`}
            className="flex size-8 shrink-0 items-center justify-center rounded-full opacity-70 outline-none hover:bg-base-200 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-primary data-popup-open:bg-base-200 data-popup-open:opacity-100"
          >
            <DotsThreeCircle size={22} />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner sideOffset={4} align="end" className="z-50">
              <Menu.Popup className="min-w-52 max-w-72 rounded-box border border-base-300 bg-base-100 p-1 shadow-lg outline-none">
                {request.reason && (
                  <p className="px-3 pt-2 pb-1 text-xs opacity-70">Reason: {request.reason}</p>
                )}
                {membership && (
                  <Menu.Item
                    className={menuItem}
                    onClick={() => membership && navigate(dashboardPath(membership))}
                  >
                    <ArrowSquareOut size={16} className="opacity-70" /> Open organization
                  </Menu.Item>
                )}
                <Menu.Item
                  className={menuItem}
                  onClick={() =>
                    void navigator.clipboard
                      ?.writeText(request.organizationId)
                      .then(() => setCopied(true))
                      .catch(() => {})
                  }
                >
                  <Copy size={16} className="opacity-70" /> Copy organization ID
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      )}
    </article>
  );
}

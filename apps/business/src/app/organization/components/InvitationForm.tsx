import type { ReactNode } from 'react';
import { Key, NotePencil, UsersThree, WarningCircle, type Icon } from 'phosphor-react';
import { Link, useNavigate } from 'react-router';
import { OctapError } from '@octap/internal-sdk';
import { useAuth } from '@octap/shared/authentication';
import { Button, notify } from '@octap/shared/components';
import { initials } from '@/app/members/components/initials';
import { cn } from '@/utils/cn';
import { useAcceptInvitation } from '../hooks/useAcceptInvitation';
import { dashboardPath } from '../utils';

const TOKEN = /^[a-f0-9]{64}$/;

const CAN_DO: { icon: Icon; text: string }[] = [
  { icon: Key, text: 'Create read-only API keys for your integrations' },
  { icon: NotePencil, text: 'Create and edit reward drafts' },
  { icon: UsersThree, text: 'View members, rewards and the points budget' },
];

type Problem = { title: string; detail: string; next: 'switch' | 'leave' };

const INVALID: Problem = {
  title: 'This invitation link isn’t valid',
  detail: 'Check that you opened the full link, or ask the Owner to send a new one.',
  next: 'leave',
};

/** Core's answers that retrying can't fix. Anything else leaves the invitation ready to retry. */
function problemOf(error: unknown): Problem | null {
  const status = error instanceof OctapError ? error.status : null;
  if (status === 403)
    return {
      title: 'This invitation is for another account',
      detail: 'Sign in with the Google account the invitation was sent to.',
      next: 'switch',
    };
  if (status === 404) return INVALID;
  if (status === 409)
    return {
      title: 'You already have access',
      detail: 'Your account is already part of this organization.',
      next: 'leave',
    };
  if (status === 410)
    return {
      title: 'This invitation is no longer available',
      detail: 'It expired, was revoked or has been used. Ask the Owner to send a new one.',
      next: 'leave',
    };
  return null;
}

/** The notch and perforated line that make the card read as a pass. */
function Perforation() {
  const notch =
    'absolute -top-2.5 size-5 rotate-45 rounded-full border border-base-300 bg-base-200';
  return (
    <div aria-hidden className="relative">
      <div className="mx-5 border-t-2 border-dashed border-base-300" />
      <span className={cn(notch, '-left-2.5 border-b-transparent border-l-transparent')} />
      <span className={cn(notch, '-right-2.5 border-t-transparent border-r-transparent')} />
    </div>
  );
}

const leaveLink = (label: ReactNode, primary: boolean) => (
  <Link
    to="/organizations"
    replace
    className={cn('btn w-full', { 'btn-primary': primary, 'btn-ghost': !primary })}
  >
    {label}
  </Link>
);

/**
 * Accepts a Developer invitation from its link. Core can't describe an invitation before it is
 * accepted, so this explains the role instead of naming the organization. The token is a
 * credential, so it is never shown.
 */
export function InvitationForm({ token }: { token: string }) {
  const { identity, signOut } = useAuth();
  const accept = useAcceptInvitation();
  const navigate = useNavigate();
  const problem = TOKEN.test(token) ? problemOf(accept.error) : INVALID;
  const failed = !!accept.error && !problem;
  const user = identity?.user;

  return (
    <article className="rounded-box border border-base-300 bg-base-100 shadow-sm">
      <div className="flex flex-col gap-4 p-6">
        <div className="mb-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {problem?.title ?? 'You’re invited'}
          </h1>
          <p className="mt-1 text-sm opacity-70" role={problem ? 'alert' : undefined}>
            {problem?.detail ??
              'Join an organization on OctaP as a Developer. You’ll see which one as soon as you accept.'}
          </p>
        </div>

        {!problem && (
          <ul className="flex flex-col gap-2.5 text-sm">
            {CAN_DO.map(({ icon: ItemIcon, text }) => (
              <li key={text} className="flex items-start gap-2.5">
                <ItemIcon size={18} className="mt-px shrink-0 text-primary" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Perforation />

      <div className="flex flex-col gap-4 p-6">
        {user && (
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
            >
              {initials(user.fullName)}
            </span>
            <div className="min-w-0 flex-1 text-sm">
              <p className="text-xs opacity-60">Signed in as</p>
              <p className="truncate font-medium" title={user.email}>
                {user.email}
              </p>
            </div>
            {problem?.next !== 'switch' && (
              <Button className="btn-ghost btn-xs min-w-0 shrink-0" onClick={signOut}>
                Switch
              </Button>
            )}
          </div>
        )}

        {failed && (
          <p role="alert" className="flex items-start gap-2 text-sm text-error">
            <WarningCircle size={18} weight="fill" className="mt-px shrink-0" aria-hidden />
            Couldn’t accept the invitation. Check your connection and try again.
          </p>
        )}

        {problem?.next === 'switch' ? (
          <div className="flex flex-col gap-1">
            <Button className="btn-primary w-full" onClick={signOut}>
              Use another account
            </Button>
            {leaveLink('Not now', false)}
          </div>
        ) : problem ? (
          leaveLink('Go to organizations', true)
        ) : (
          <div className="flex flex-col gap-1">
            <Button
              className="btn-primary w-full"
              loading={accept.isPending}
              onClick={() =>
                accept.mutate(token, {
                  onSuccess: (organization) => {
                    notify.success(
                      'Invitation accepted',
                      organization ? `You’ve joined ${organization.name}.` : undefined,
                    );
                    // Replaced, so going back can't return to a used invitation.
                    navigate(organization ? dashboardPath(organization) : '/organizations', {
                      replace: true,
                    });
                  },
                })
              }
            >
              Accept invitation
            </Button>
            {leaveLink('Not now', false)}
          </div>
        )}
      </div>
    </article>
  );
}

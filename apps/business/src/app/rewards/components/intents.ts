import {
  ArrowCounterClockwise,
  CheckCircle,
  Copy,
  Eye,
  Lightning,
  PaperPlaneTilt,
  Pause,
  PencilSimple,
  Play,
  SlidersHorizontal,
  XCircle,
  type Icon,
} from 'phosphor-react';
import type { RewardPermissions } from '../domain/stage';
import type { RewardAction } from '../hooks/useRewards';

/** Anything a user can ask for on a reward: open it, change its availability, or move it along. */
export type RewardIntent = 'view' | 'edit' | 'duplicate' | 'availability' | RewardAction;

export const INTENTS: { intent: RewardIntent; label: string; icon: Icon; tone?: string }[] = [
  { intent: 'edit', label: 'Edit draft', icon: PencilSimple },
  { intent: 'view', label: 'View details', icon: Eye },
  { intent: 'activate', label: 'Activate', icon: Lightning },
  { intent: 'submit', label: 'Submit for approval', icon: PaperPlaneTilt },
  { intent: 'approve', label: 'Approve', icon: CheckCircle },
  { intent: 'reject', label: 'Reject', icon: XCircle, tone: 'text-error' },
  { intent: 'withdraw', label: 'Take back to draft', icon: ArrowCounterClockwise },
  { intent: 'resume', label: 'Resume', icon: Play },
  { intent: 'pause', label: 'Pause', icon: Pause },
  { intent: 'availability', label: 'Edit availability', icon: SlidersHorizontal },
  { intent: 'duplicate', label: 'Duplicate', icon: Copy },
];

/** The intents a user has on a reward, in menu order. A reward they can't edit opens read-only. */
export function intentsFor(permissions: RewardPermissions): RewardIntent[] {
  return INTENTS.map((item) => item.intent).filter((intent) =>
    intent === 'view' ? !permissions.edit : permissions[intent as keyof RewardPermissions],
  );
}

/** The one action worth a button of its own, if the reward has one. */
export function primaryIntent(permissions: RewardPermissions): RewardIntent | undefined {
  return (['activate', 'submit', 'approve', 'resume'] as const).find(
    (intent) => permissions[intent],
  );
}

export const intentOf = (intent: RewardIntent) => INTENTS.find((item) => item.intent === intent)!;

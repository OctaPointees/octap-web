import { Menu } from '@base-ui/react/menu';
import { DotsThreeVertical } from 'phosphor-react';
import { Button } from '@octap/shared/components';
import { cn } from '@/utils/cn';
import type { Reward } from '../domain/draft';
import type { RewardPermissions } from '../domain/stage';
import { INTENTS, intentOf, intentsFor, primaryIntent, type RewardIntent } from './intents';

const menuItem =
  'flex cursor-pointer items-center gap-2.5 rounded-field px-3 py-2 text-sm outline-none data-highlighted:bg-base-200';

/** The "more" menu of a reward card or row. */
export function RewardActions({
  reward,
  permissions,
  onIntent,
}: {
  reward: Reward;
  permissions: RewardPermissions;
  onIntent: (intent: RewardIntent, reward: Reward) => void;
}) {
  const intents = intentsFor(permissions);
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Actions for ${reward.title}`}
        onClick={(event) => event.stopPropagation()}
        className="btn btn-ghost btn-sm btn-square"
      >
        <DotsThreeVertical size={18} weight="bold" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} align="end" className="z-50">
          <Menu.Popup className="min-w-52 rounded-box border border-base-300 bg-base-100 p-1 shadow-lg outline-none">
            {INTENTS.filter((item) => intents.includes(item.intent)).map(
              ({ intent, label, icon: ItemIcon, tone }) => (
                <Menu.Item
                  key={intent}
                  className={cn(menuItem, tone)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onIntent(intent, reward);
                  }}
                >
                  <ItemIcon size={16} className="opacity-70" /> {label}
                </Menu.Item>
              ),
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** The reward's main next step as a button (Activate, Approve, Resume...), if it has one. */
export function RewardPrimaryAction({
  reward,
  permissions,
  busy,
  onIntent,
}: {
  reward: Reward;
  permissions: RewardPermissions;
  busy: boolean;
  onIntent: (intent: RewardIntent, reward: Reward) => void;
}) {
  const intent = primaryIntent(permissions);
  if (!intent) return null;
  const { label, icon: ActionIcon } = intentOf(intent);
  return (
    <Button
      className="btn-primary btn-soft btn-sm"
      loading={busy}
      onClick={(event) => {
        event.stopPropagation();
        onIntent(intent, reward);
      }}
      icon={ActionIcon}
    >
      {label}
    </Button>
  );
}

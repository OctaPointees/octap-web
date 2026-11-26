import { useRef } from 'react';
import { Check, type Icon } from 'phosphor-react';

import { Button as BaseButton, type ButtonProps } from '@base-ui/react';
import { cn } from '../utils';
import { useFlash } from './useFlash';

interface IProps {
  icon?: Icon;
  loading?: boolean;
  loadingPlaceholder?: string;
  /**
   * Changes each time the action succeeds, such as `save.isSuccess ? save.submittedAt : null`.
   * The button then shows a check for a moment, for results that stay on screen.
   */
  successKey?: number | string | null;
  /** What screen readers hear when the check appears. */
  successLabel?: string;
}

/**
 * A request only disables its button once React has re-rendered, which a double-click can beat.
 * Buttons with a `loading` prop run an action, so they ignore a repeat click this soon after one.
 */
const REPEAT_CLICK_MS = 400;

const fade = 'transition-[opacity,scale] duration-(--motion-fast) ease-enter';
const overlay =
  'pointer-events-none absolute inset-0 flex items-center justify-center gap-2 whitespace-nowrap';
const shown = (visible: boolean) => ({
  'scale-100 opacity-100': visible,
  'scale-75 opacity-0': !visible,
});

/**
 * The app's button. While loading, and for a moment after succeeding, a spinner or check fades in
 * over the label, which stays in place underneath so the button never changes size.
 */
export function Button({
  icon: ButtonIcon,
  loading: loadingProp,
  className,
  loadingPlaceholder,
  successKey,
  successLabel = 'Saved',
  onClick,
  children,
  ...props
}: ButtonProps & IProps) {
  const loading = !!loadingProp;
  const lastClick = useRef(Number.NEGATIVE_INFINITY);
  const handleClick: ButtonProps['onClick'] = (event) => {
    if (loadingProp !== undefined) {
      if (event.timeStamp - lastClick.current < REPEAT_CLICK_MS) {
        event.preventDefault();
        return;
      }
      lastClick.current = event.timeStamp;
    }
    onClick?.(event);
  };
  const flashing = useFlash(successKey);
  const succeeded = flashing && !loading;
  const covered = loading || succeeded;
  // Square and circle buttons size themselves; a minimum width would stretch them.
  const square = typeof className === 'string' && /\bbtn-(square|circle)\b/.test(className);

  return (
    <BaseButton
      {...props}
      onClick={handleClick}
      aria-busy={loading || undefined}
      disabled={props.disabled || loading}
      className={cn(
        'group btn relative gap-0 transition-[color,background-color,border-color,box-shadow,scale] duration-(--motion-press) ease-enter active:not-disabled:scale-[0.97]',
        { 'min-w-25': !square },
        className,
        { 'border-success bg-success text-success-content': succeeded },
      )}
    >
      <span aria-hidden className={cn(overlay, fade, shown(loading))}>
        {loading && <span className="loading loading-spin size-[1.25em]" />}
        {loading && loadingPlaceholder}
      </span>

      {successKey !== undefined && (
        <>
          <span aria-hidden className={cn(overlay, fade, shown(succeeded))}>
            <Check size="1.25em" weight="bold" />
          </span>
          <span role="status" className="sr-only">
            {succeeded ? successLabel : ''}
          </span>
        </>
      )}

      <span
        className={cn('flex min-w-0 flex-1 items-center justify-center', fade, {
          'opacity-0': covered,
          'pr-4 justify-start': !!ButtonIcon,
        })}
      >
        {children}
      </span>
      {ButtonIcon && <ButtonIcon size="1.5em" className={cn(fade, { 'opacity-0': covered })} />}
    </BaseButton>
  );
}

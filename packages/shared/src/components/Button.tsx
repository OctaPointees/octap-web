import type { Icon } from 'phosphor-react';

import { Button as BaseButton, type ButtonProps } from '@base-ui/react';
import { cn } from '../utils';

interface IProps {
  icon?: Icon;
  loading?: boolean;
  loadingPlaceholder?: string;
}

export function Button({ loading, className, loadingPlaceholder, ...props }: ButtonProps & IProps) {
  const c = cn('group btn gap-0 transition-all min-w-25', className, {
    'text-[0px]': loading,
  });

  return (
    <BaseButton {...props} className={c} disabled={props.disabled || loading}>
      <div
        className={cn('overflow-hidden w-0 opacity-0 transition-all', {
          'w-full opacity-100': loading,
        })}
      >
        <span className="loading loading-spin"></span>
        {loadingPlaceholder ?? ''}
      </div>

      <div
        className={cn('flex items-center justify-center flex-1', {
          'pr-4 justify-start': !!props.icon && !loading,
        })}
      >
        {props.children}
      </div>
      {props.icon && <props.icon size="1.5em" />}
    </BaseButton>
  );
}

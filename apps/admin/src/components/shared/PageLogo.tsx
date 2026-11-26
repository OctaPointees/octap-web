import { cn } from '@octap/shared/utils';
import type { ComponentProps } from 'react';
import { useNavigate } from 'react-router';

type Props = {
  subtitle?: string;
} & ComponentProps<'div'>;

export function PageLogo(props: Props) {
  const nav = useNavigate();

  return (
    <div
      className={cn(
        'flex items-center gap-4 test-gradient rounded-field select-none transition-all',
        'hover:brightness-90 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer',
        props.className,
      )}
      onClick={() => nav('/')}
    >
      <div className="flex items-center flex-1 gap-4 pl-4 text-primary-content">
        <div className="text-xl font-bold">OctaP</div>
        <div className="truncate">{props.subtitle ?? 'Credit-as-a-Service'}</div>
      </div>

      <div className="mx-4 size-12">
        <img
          src="/icons/logo_dark.png"
          className="w-full"
          alt=""
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    </div>
  );
}

import { Toast } from '@base-ui/react/toast';
import { CheckCircle, Info, WarningCircle, X } from 'phosphor-react';
import { cn } from '../../utils';
import { toastManager } from './notify';

const TONE: Record<string, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle, className: 'text-success' },
  error: { icon: WarningCircle, className: 'text-error' },
  info: { icon: Info, className: 'text-info' },
};

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => {
    const tone = TONE[toast.type ?? 'info'] ?? TONE.info;
    return (
      <Toast.Root
        key={toast.id}
        toast={toast}
        // They enter from the top, so they leave the same way, or off to the side.
        swipeDirection={['up', 'right']}
        className={cn(
          '[--gap:0.75rem] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)+calc(var(--toast-index)*var(--gap))+var(--toast-swipe-movement-y))]',
          'absolute top-0 right-0 z-[calc(1000-var(--toast-index))] w-full origin-top',
          '[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+(var(--toast-index)*var(--peek))+(var(--shrink)*var(--height))))_scale(var(--scale))]',
          'data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--offset-y)))]',
          'data-starting-style:[transform:translateY(-150%)] data-ending-style:opacity-0 data-limited:opacity-0',
          'h-(--height) data-expanded:h-(--toast-height) [transition:transform_0.5s_cubic-bezier(0.22,1,0.36,1),opacity_0.5s,height_0.15s]',
          "after:absolute after:bottom-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
          'rounded-box border border-base-300 bg-base-100 shadow-lg',
        )}
      >
        <Toast.Content className="flex items-center gap-3 overflow-hidden p-3 transition-opacity duration-200 data-behind:opacity-0 data-expanded:opacity-100">
          <tone.icon size={22} weight="fill" className={cn('mt-0.5 shrink-0', tone.className)} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <Toast.Title className="text-sm font-bold" />
            <Toast.Description className="text-sm opacity-75 break-words" />
          </div>
          <Toast.Close className="btn btn-ghost btn-xs btn-square" aria-label="Dismiss">
            <X />
          </Toast.Close>
        </Toast.Content>
      </Toast.Root>
    );
  });
}

/**
 * Renders the shared toast queue at the top-right, newest on top, just below the app's main toolbar
 * (`--size-main-toolbar`, or 1rem from the top in an app without one). Wrap the app once.
 */
export function ToasterProvider({ children }: { children: React.ReactNode }) {
  return (
    <Toast.Provider toastManager={toastManager} limit={4}>
      {children}
      <Toast.Portal>
        {/* Full width less the 1rem gutters on phones. z-100 keeps toasts above dialogs (z-50). */}
        <Toast.Viewport className="fixed top-(--size-main-toolbar,1rem) right-4 z-100 w-[calc(100vw-2rem)] sm:w-96">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

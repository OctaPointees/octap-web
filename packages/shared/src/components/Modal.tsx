import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Dialog } from '@base-ui/react/dialog';
import { X } from 'phosphor-react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { cn } from '../utils';

const backdrop =
  'fixed inset-0 z-50 bg-black/40 transition-opacity duration-(--motion-base) ease-enter data-ending-style:duration-(--motion-fast) data-starting-style:opacity-0 data-ending-style:opacity-0';
/** Capped by its size on smaller screens; half the window on wide ones (`xl` and up). */
const popup =
  'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-3rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-box bg-base-100 shadow-2xl outline-none transition-[scale,opacity] duration-(--motion-base) ease-enter data-ending-style:duration-(--motion-fast) xl:w-1/2 xl:max-w-none data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0';

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Runs once the close animation has finished: the time to clear what the dialog showed. */
  onExited?: () => void;
};

// The larger sizes keep their width where half the window would be narrower.
const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-xl xl:min-w-xl',
  xl: 'max-w-2xl xl:min-w-2xl',
};

/**
 * A centered dialog built on Base UI: it animates in and out, traps focus, closes on Escape and
 * the backdrop, and has dialog semantics.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  onExited,
}: ModalProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => onOpenChange(o)}
      onOpenChangeComplete={(o) => !o && onExited?.()}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={backdrop} />
        <Dialog.Popup className={cn(popup, SIZES[size])}>
          <div className="flex items-start justify-between gap-4 border-b border-base-300 p-5">
            <div>
              <Dialog.Title className="text-lg font-bold">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-sm opacity-70">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Button
              className="btn-ghost btn-sm btn-square min-w-0"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
            >
              <X size={18} />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
          {footer && (
            <div className="flex justify-end gap-2 border-t border-base-300 p-4">{footer}</div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const panel =
  'fixed inset-y-0 right-0 z-50 flex h-dvh w-full flex-col bg-base-100 shadow-2xl outline-none transition-transform duration-(--motion-slow) ease-drawer data-ending-style:duration-(--motion-base) data-starting-style:translate-x-full data-ending-style:translate-x-full';

/**
 * A dialog that slides in from the right and takes the full height, for forms too large for a
 * centered modal. The header and footer stay put; only the body scrolls, and only when the
 * screen is too small for it.
 */
export function SidePanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: Omit<ModalProps, 'size' | 'onExited'> & { className?: string }) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => onOpenChange(o)}>
      <Dialog.Portal>
        <Dialog.Backdrop className={backdrop} />
        <Dialog.Popup className={cn(panel, 'max-w-5xl', className)}>
          <div className="flex items-start justify-between gap-4 border-b border-base-300 px-6 py-4">
            <div>
              <Dialog.Title className="text-lg font-bold">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="mt-0.5 text-sm opacity-70">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Button
              className="btn-ghost btn-sm btn-square min-w-0"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
            >
              <X size={18} />
            </Button>
          </div>
          <div data-panel-body className="flex-1 overflow-y-auto px-6 py-3">
            {children}
          </div>
          {footer && (
            <div className="flex justify-end gap-2 border-t border-base-300 px-6 py-3">
              {footer}
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type ConfirmProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmLabel?: string;
  tone?: 'primary' | 'error' | 'warning';
  loading?: boolean;
  onConfirm: () => void;
  /** Turns the confirm button off, such as when what it would act on has changed. */
  confirmDisabled?: boolean;
  children?: ReactNode;
};

/** An alert dialog that asks the user to confirm or cancel an action. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'primary',
  loading,
  onConfirm,
  confirmDisabled = false,
  children,
}: ConfirmProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(o) => onOpenChange(o)}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={backdrop} />
        <AlertDialog.Popup className={cn(popup, 'max-w-md gap-4 p-5')}>
          <AlertDialog.Title className="text-lg font-bold">{title}</AlertDialog.Title>
          <AlertDialog.Description className="text-sm opacity-75">
            {description}
          </AlertDialog.Description>
          {children}
          <div className="flex justify-end gap-2">
            <Button className="btn-ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className={cn({
                'btn-primary': tone === 'primary',
                'btn-error': tone === 'error',
                'btn-warning': tone === 'warning',
              })}
              loading={loading}
              disabled={confirmDisabled}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

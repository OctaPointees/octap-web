import { useRef, useState, type ComponentProps } from 'react';

type AnimatedModalProps<T> = Omit<ComponentProps<'div'>, 'children'> & {
  onClose?: () => void;
  onOpen?: () => void;

  disableBackdrop?: boolean;
  onBackdropClick?: () => void;

  value: T | null | undefined;

  children: (props: { value: NonNullable<T> }) => React.ReactNode;
};

function ModalWrapper<T>(props: AnimatedModalProps<T>) {
  const { children, value, onClose, onOpen, disableBackdrop, onBackdropClick } = props;

  const last = useRef<NonNullable<T> | null>(null);
  const record = (v: T) => (last.current = v as NonNullable<T>);
  const reset = () => (last.current = null);

  const [_, triggerRender] = useState(0);

  function onCloseEnd() {
    triggerRender(0);
    reset();
    onClose?.();
  }

  function onOpenEnd() {
    onOpen?.();
  }

  if (value) {
    record(value); // Recording value for close state

    return (
      <div className="modal modal-open" onAnimationEnd={onOpenEnd} onTransitionEnd={onOpenEnd}>
        {children({ value })}

        <button
          className="modal-backdrop cursor-default"
          disabled={disableBackdrop}
          onClick={onBackdropClick}
          type="button"
        />
      </div>
    );
  }

  const shown = value ?? last.current;

  if (shown) {
    return (
      <div className="modal modal-close" onAnimationEnd={onCloseEnd} onTransitionEnd={onCloseEnd}>
        {children({ value: shown })}
      </div>
    );
  }

  return <></>;
}

export const AnimatedModal = {
  Root: ModalWrapper,
};

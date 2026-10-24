import { createContext, useContext } from 'react';

export type TransitionCtx = {
  enterDeveloper: (e?: React.MouseEvent) => void;
  exitDeveloper: (e?: React.MouseEvent) => void;
};

export const TransitionContext = createContext<TransitionCtx | null>(null);

export function useTransition() {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error('useTransition must be used inside <TransitionProvider>');
  return ctx;
}

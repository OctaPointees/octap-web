import { useCallback, useEffect, useState } from 'react';

/** How long a change stays highlighted. Matches `animate-flash-row` in the shared motion styles. */
const FLASH_MS = 1400;

/**
 * True for a moment whenever `signal` changes to a new value, such as a mutation's `submittedAt`
 * once it has succeeded. A value it starts with doesn't count, and `null` ends the moment early.
 */
export function useFlash(signal: unknown, duration = FLASH_MS) {
  const [seen, setSeen] = useState(signal);
  const [flashing, setFlashing] = useState(false);
  if (signal !== seen) {
    setSeen(signal);
    setFlashing(signal != null);
  }

  useEffect(() => {
    if (!flashing) return;
    const timer = setTimeout(() => setFlashing(false), duration);
    return () => clearTimeout(timer);
  }, [flashing, signal, duration]);

  return flashing;
}

/** Highlights the row or card that just changed, so the eye lands on the result. */
export function useRowFlash() {
  const [flashed, setFlashed] = useState<{ id: string } | null>(null);
  const flashing = useFlash(flashed);
  const flashRow = useCallback((id: string) => setFlashed({ id }), []);
  const isFlashing = (id: string) => flashing && flashed?.id === id;
  return { flashRow, isFlashing };
}

import { useState } from 'react';

/**
 * For a dialog opened with a value (`open={!!value}`): the value while it is set, then the last one
 * while the dialog animates out, so its content doesn't blank or change as it closes.
 */
export function useExitValue<T>(value: T | null | undefined): T | null {
  const [last, setLast] = useState<T | null>(value ?? null);
  if (value != null && value !== last) setLast(value);
  return value ?? last;
}

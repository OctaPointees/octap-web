import { useCallback, useState } from 'react';

export function useTimestamp() {
  const [timestamp, setTimestamp] = useState(new Date());

  const stamp = useCallback(() => {
    setTimestamp(new Date());
  }, []);

  return { timestamp, stamp };
}

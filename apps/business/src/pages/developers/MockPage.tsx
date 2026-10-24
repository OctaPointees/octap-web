import { useEffect, useState } from 'react';
import MockTransactions from './MockTransactions';
import MockTransactionsRunning from './MockTransactionsRunning';

export default function MockPage() {
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setRunning(false), 4500);
    return () => clearTimeout(t);
  }, [running]);

  return running ? (
    <MockTransactionsRunning />
  ) : (
    <MockTransactions onRun={() => setRunning(true)} />
  );
}

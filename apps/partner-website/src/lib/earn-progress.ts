export type EarnProgress =
  | { state: 'confirmed'; points: number | null }
  | { state: 'failed' }
  | { state: 'reversed' }
  | { state: 'pending' };

/**
 * Judges one earn by its own transaction row. Aggregate balance fields can't tell this earn
 * confirmed from this earn failed, because a failed earn's pending hold is released as well.
 */
export function earnProgress(
  transactionId: string,
  transactions: { id: string; status: string; pointsAmount: number | null }[],
): EarnProgress {
  const row = transactions.find((tx) => tx.id === transactionId);
  switch (row?.status) {
    case 'CONFIRMED':
      return { state: 'confirmed', points: row.pointsAmount };
    case 'FAILED':
      return { state: 'failed' };
    case 'REVERSED':
      return { state: 'reversed' };
    default:
      // PENDING, or not in the latest history page yet: the outcome is still unknown.
      return { state: 'pending' };
  }
}

export function earnMessage(progress: EarnProgress): string {
  switch (progress.state) {
    case 'confirmed':
      return progress.points === null
        ? 'Points confirmed on-chain.'
        : `${progress.points} points confirmed on-chain.`;
    case 'failed':
      return 'The chain did not record these points. Issue points again to start a new attempt.';
    case 'reversed':
      return 'These points were confirmed, then reversed.';
    case 'pending':
      return 'Still waiting for the chain. Refresh later. Issuing the same amount again resumes this purchase and never earns twice.';
  }
}

/** A history row's amount: actual points, a labelled estimate while pending, or nothing for a failed earn. */
export function transactionPointsLabel(tx: {
  points: number | null;
  estimatedPoints?: number | null;
}): string {
  if (tx.points !== null) return String(tx.points);
  return tx.estimatedPoints == null ? '—' : `about ${tx.estimatedPoints} (estimate)`;
}

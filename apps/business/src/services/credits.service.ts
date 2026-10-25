export interface EarnResult {
  transactionId: string;
  status: string;
  newBalance: number;
}

export interface CreditsSnapshot {
  balance: { confirmedBalance: number; pendingEarn: number; stale: boolean };
  transactions: {
    id: string;
    status: string;
    pointsAmount: number;
    blockchainDigest?: string | null;
  }[];
}

async function request<T>(body: object): Promise<T> {
  const response = await fetch('/api/demo/credits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25_000),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      data?.message ?? 'Demo service unavailable. Start partner-website on port 4001.',
    );
  return data as T;
}

export const earnPoints = (
  organizationEndUserId: string,
  pointsAmount: number,
  idempotencyKey: string,
  receiptReference: string,
) =>
  request<EarnResult>({
    action: 'earn',
    organizationEndUserId,
    pointsAmount,
    idempotencyKey,
    receiptReference,
  });

export const readCredits = (organizationEndUserId: string) =>
  request<CreditsSnapshot>({ action: 'read', organizationEndUserId });

export const redeemVoucher = (organizationEndUserId: string, serialCode: string) =>
  request<{ status: string; voucherTitle: string }>({
    action: 'redeemVoucher',
    organizationEndUserId,
    serialCode,
  });

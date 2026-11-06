export interface VoucherClaim {
  voucherOwnershipId: string;
  voucherId: string;
  organizationEndUserId: string;
  serialCode: string;
  status: string;
  pointsCost?: number;
  pointsDeducted?: number;
  digest?: string | null;
  transactionBytes?: string | null;
}

export async function rewardsRequest<T>(body: object): Promise<T> {
  const response = await fetch('/api/customer/rewards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(65_000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Could not load rewards.');
  return data as T;
}

/** Uses an AVAILABLE voucher: the store asks, the customer signs, and the chain marks it used. */
export async function redeemCustomerVoucher(
  ownershipId: string,
  sign: (bytes: string, digest: string) => Promise<string>,
): Promise<{ voucherOwnershipId: string; status: string }> {
  const use = await rewardsRequest<{
    voucherOwnershipId: string;
    status: string;
    digest: string | null;
    transactionBytes: string | null;
  }>({ action: 'use', ownershipId });
  if (use.voucherOwnershipId !== ownershipId)
    throw new Error('This request is for a different voucher. Nothing was signed.');
  if (!use.digest || !use.transactionBytes) return use;
  const signature = await sign(use.transactionBytes, use.digest);
  return rewardsRequest({ action: 'finalizeUse', ownershipId, digest: use.digest, signature });
}

/** Never use a serial until Core confirms the customer-signed chain debit. */
export async function claimCustomerReward(
  voucherId: string,
  memberId: string,
  expectedPointsCost: number,
  sign: (bytes: string, digest: string) => Promise<string>,
): Promise<VoucherClaim> {
  const claim = await rewardsRequest<VoucherClaim>({ action: 'claim', voucherId });
  if (claim.voucherId !== voucherId || claim.organizationEndUserId !== memberId)
    throw new Error('This claim belongs to a different membership or reward. Nothing was signed.');
  if (claim.status !== 'RESERVED') return claim;
  // A free voucher has nothing to sign: OctaP records it on-chain, then it becomes AVAILABLE.
  if (claim.pointsCost === 0 && !claim.transactionBytes) return claim;
  if (claim.pointsCost !== expectedPointsCost)
    throw new Error(
      'The reward cost changed. Refresh and confirm the updated cost before signing.',
    );
  if (
    !claim.transactionBytes ||
    !claim.digest ||
    !claim.voucherOwnershipId ||
    claim.pointsDeducted !== 0
  )
    throw new Error('Your claim is awaiting confirmation. Refresh its status before continuing.');
  const signature = await sign(claim.transactionBytes, claim.digest);
  const finalized = await rewardsRequest<VoucherClaim>({
    action: 'finalize',
    ownershipId: claim.voucherOwnershipId,
    digest: claim.digest,
    signature,
  });
  if (
    finalized.voucherOwnershipId !== claim.voucherOwnershipId ||
    finalized.organizationEndUserId !== memberId ||
    finalized.voucherId !== voucherId
  )
    throw new Error('The claim confirmation did not match. Refresh to check your vouchers.');
  return finalized;
}

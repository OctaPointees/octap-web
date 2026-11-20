/** Types generated from the OctaP OpenAPI document. */
export interface ConsoleApiCredentialsIssueInput {
  name: string;
  scope?: 'read' | 'write';
}

export interface ConsoleApiCredentialsIssueResponse {
  rawKey: string;
  id: string;
  name: string;
  keyPrefix: string;
  scopes: Array<string>;
  status: string;
  createdAt: string;
  lastUsedAt: null | string;
}

export type ConsoleApiCredentialsListResponse = Array<ConsoleCredential>;

export interface ConsoleApiCredentialsRenameInput {
  name: string;
}

export type ConsoleApiCredentialsRenameResponse = ConsoleCredential;

export interface ConsoleApiCredentialsRevokeResponse {
  revoked: boolean;
}

export interface ConsoleChangeRequestsProposeInput {
  requestType: GovernanceRequestType;
  reason: string;
  payload: {
  name?: string;
  targetUserId?: string;
  amount?: number;
} & IdentityChangePayload;
}

export interface ConsoleChangeRequestsProposeResponse {
  id: string;
  status: 'APPROVED' | 'CANCELLED' | 'PENDING' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  organizationId: null | string;
  requestedById: string;
  reviewedById: null | string;
  requestType: 'BUDGET_TOP_UP' | 'CREATE_ORGANIZATION' | 'DEACTIVATE' | 'REINSTATE' | 'SUSPEND' | 'TRANSFER_OWNERSHIP' | 'UPDATE_IDENTITY' | 'UPDATE_PROFILE';
  payload: unknown;
  reason: null | string;
  reviewedAt: string | null;
}

export interface ConsoleIdentityLoginInput {
  idToken: string;
}

export interface ConsoleIdentityLoginResponse {
  user: {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: null | string;
  systemRole: SystemRole;
};
  organizations: Array<{
  organizationId: string;
  name: string;
  slug: string;
  persona: OrganizationPersona;
}>;
  expiresAt: string;
}

export interface ConsoleIdentityMeResponse {
  user: {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: null | string;
  systemRole: SystemRole;
};
  organizations: Array<{
  organizationId: string;
  name: string;
  slug: string;
  persona: OrganizationPersona;
}>;
  expiresAt: string;
}

export interface ConsoleIssuanceBudgetReadResponse {
  organizationId: string;
  remaining: number;
  initialBudget: number;
  capacity: number;
  warningThreshold: 80 | 95 | null;
  shards: Array<IssuanceBudgetShard>;
  recentTopUps: Array<IssuanceBudgetTopUp>;
  observedAt: string;
}

export interface ConsoleOrganizationsAcceptResponse {
  organizationId: string;
}

export type ConsoleOrganizationsApplicationsResponse = Array<{
  slug: string;
  requestedById: string;
  id: string;
  organizationId: string;
  name: string;
  status: 'APPROVED' | 'CANCELLED' | 'PENDING' | 'REJECTED';
  reason: null | string;
  createdAt: string;
  applicantEmail: string;
  organizationType: 'COMPANY' | 'INDIVIDUAL_HOUSEHOLD' | null;
  representativeName: null | string;
  legalName: null | string;
  taxId: null | string;
  nationalIdLast4: null | string;
  initialOwnerName: null | string;
  initialOwnerEmail: null | string;
}>;

export interface ConsoleOrganizationsApplyInput {
  name: string;
  slug: string;
  organizationType: OrganizationType;
  legalName?: string;
  taxId?: string;
  representativeName?: string;
  nationalId?: string;
}

export interface ConsoleOrganizationsApplyResponse {
  id: string;
}

export type ConsoleOrganizationsInvitationsResponse = Array<{
  status: 'ACCEPTED' | 'EXPIRED' | 'PENDING' | 'REVOKED';
  expiresAt: string;
  persona: string;
  id: string;
  email: string;
}>;

export interface ConsoleOrganizationsInviteInput {
  email: string;
  persona?: string;
}

export interface ConsoleOrganizationsInviteResponse {
  id: string;
  email: string;
  status: 'ACCEPTED' | 'EXPIRED' | 'PENDING' | 'REVOKED';
  expiresAt: string;
  persona: string;
  token: string;
}

export interface ConsoleOrganizationsOrganizationResponse {
  status: 'ACTIVE' | 'ARCHIVED' | 'PENDING_APPROVAL' | 'SUSPENDED';
  persona: 'BUSINESS_DEVELOPER' | 'BUSINESS_OWNER';
  nationalIdLast4?: string;
  id: string;
  name: string;
  slug: string;
  legalName: null | string;
  taxId: null | string;
  organizationType: 'COMPANY' | 'INDIVIDUAL_HOUSEHOLD' | null;
  representativeName: null | string;
  logoUrl: null | string;
  voucherApprovalRequired: boolean;
}

export interface ConsoleOrganizationsProfileInput {
  name?: string;
  logoUrl?: null | string;
}

export interface ConsoleOrganizationsProfileResponse {
  updated: boolean;
}

export interface ConsoleOrganizationsRevokeResponse {
  revoked: boolean;
}

export interface ConsoleOrganizationsSettingsInput {
  voucherApprovalRequired: boolean;
}

export interface ConsoleOrganizationsSettingsResponse {
  updated: boolean;
}

export interface ConsoleOrganizationsStaffAccessInput {
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface ConsoleOrganizationsStaffAccessResponse {
  updated: boolean;
}

export type ConsoleOrganizationsStaffResponse = Array<{
  persona: string;
  id: string;
  fullName: string;
  email: string;
  status: string;
}>;

export interface ConsoleRefundPolicyCurrentResponse {
  reason: string;
  createdByUserId: null | string;
  createdByCredentialId: null | string;
  createdAt: null | string;
  version: number;
  allowUnused: boolean;
  allowExpired: boolean;
  allowRedeemed: boolean;
  restockUnused: boolean;
  refundWindowDays: null | number;
}

export interface ConsoleRefundPolicyHistoryParams {
  limit?: number;
  beforeVersion?: number;
}

export type ConsoleRefundPolicyHistoryResponse = Array<VoucherRefundPolicyDto>;

export interface ConsoleRefundPolicyPublishInput {
  reason: string;
  allowUnused: boolean;
  allowExpired: boolean;
  allowRedeemed: boolean;
  restockUnused: boolean;
  refundWindowDays: null | number;
}

export type ConsoleRefundPolicyPublishResponse = VoucherRefundPolicyDto;

export type ConsoleRewardsApproveResponse = VoucherDto;

export interface ConsoleRewardsCreateInput {
  pointsCost: number;
  status?: string;
  code: string;
  metadata?: Record_string_unknown;
  title: string;
  description?: string;
  discountType?: 'FIXED_AMOUNT' | 'FREE_ITEM' | 'PERCENTAGE';
  discountValue?: string;
  terms?: Record_string_unknown;
  totalSupply?: number | null;
  perMemberLimit?: number | null;
  startsAt?: null | string;
  expiresAt?: null | string;
  validForDays?: null | number;
}

export type ConsoleRewardsCreateResponse = VoucherDto;

export type ConsoleRewardsDetailResponse = VoucherDto;

export type ConsoleRewardsListResponse = Array<VoucherDto>;

export interface ConsoleRewardsRejectInput {
  reason: string;
}

export type ConsoleRewardsRejectResponse = VoucherDto;

export type ConsoleRewardsSubmitResponse = VoucherDto;

export interface ConsoleRewardsUpdateInput {
  code?: string;
  title?: string;
  description?: string;
  pointsCost?: number;
  discountType?: 'FIXED_AMOUNT' | 'FREE_ITEM' | 'PERCENTAGE';
  discountValue?: string;
  terms?: Record_string_unknown;
  totalSupply?: number | null;
  perMemberLimit?: number | null;
  startsAt?: null | string;
  expiresAt?: null | string;
  validForDays?: null | number;
  metadata?: Record_string_unknown;
  status?: 'ACTIVE' | 'DRAFT' | 'PAUSED';
}

export type ConsoleRewardsUpdateResponse = VoucherDto;

export type ConsoleRewardsWithdrawResponse = VoucherDto;

export interface ConsoleWebhooksDisableEndpointResponse {
  id: string;
  organizationId: string;
  url: string;
  description: null | string;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  updatedAt: string;
}

export interface ConsoleWebhooksEnableEndpointResponse {
  id: string;
  organizationId: string;
  url: string;
  description: null | string;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  updatedAt: string;
}

export type ConsoleWebhooksListDeliveriesResponse = Array<{
  id: string;
  status: 'DEAD_LETTER' | 'DELIVERED' | 'PENDING';
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  payload: unknown;
  endpointId: string;
  eventType: string;
  attemptCount: number;
  nextAttemptAt: string;
  lastResponseStatus: null | number;
  lastError: null | string;
}>;

export type ConsoleWebhooksListEndpointsResponse = Array<{
  id: string;
  organizationId: string;
  url: string;
  description: null | string;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  updatedAt: string;
}>;

export interface ConsoleWebhooksRegisterEndpointInput {
  url: string;
  description?: string;
}

export interface ConsoleWebhooksRegisterEndpointResponse {
  secret: string;
  id: string;
  organizationId: string;
  url: string;
  description: null | string;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  updatedAt: string;
}

export interface ConsoleWebhooksReplayDeliveryResponse {
  id: string;
  organizationId: string;
  endpointId: string;
  eventType: string;
  payload: unknown;
  status: 'DEAD_LETTER' | 'DELIVERED' | 'PENDING';
  attemptCount: number;
  nextAttemptAt: string;
  lastResponseStatus: null | number;
  lastError: null | string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsoleWebhooksRotateSecretResponse {
  secret: string;
  id: string;
  organizationId: string;
  url: string;
  description: null | string;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  updatedAt: string;
}

export interface CreditsEarnInput {
  organizationEndUserId: string;
  purchaseAmount: number;
  idempotencyKey: string;
  receiptReference?: string;
  metadata?: Record_string_unknown;
}

export interface CreditsEarnResponse {
  transactionId: string;
  organizationEndUserId: string;
  purchaseAmount: null | number;
  estimatedPoints: null | number;
  pointsEarned: null | number;
  newBalance: number;
  status: LoyaltyTxStatus;
  idempotencyKey: string;
}

export interface CreditsFinalizePosRedemptionInput {
  digest: string;
  signature: string;
}

export interface CreditsFinalizePosRedemptionResponse {
  transactionId: string;
  organizationEndUserId: string;
  pointsRedeemed: number;
  newBalance: number;
  status: LoyaltyTxStatus;
  blockchainDigest: string;
}

export interface CreditsGetBalanceParams {
  programId?: string;
}

export interface CreditsGetBalanceResponse {
  organizationEndUserId: string;
  confirmedBalance: number;
  pendingEarn: number;
  pendingRedemption: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  asOfCheckpoint: null | string;
  observedAt: string;
  stale: boolean;
}

export interface CreditsGetBudgetResponse {
  organizationId: string;
  remaining: number;
  initialBudget: number;
  capacity: number;
  warningThreshold: 80 | 95 | null;
  shards: Array<IssuanceBudgetShard>;
  recentTopUps: Array<IssuanceBudgetTopUp>;
  observedAt: string;
}

export interface CreditsGetTransactionsParams {
  limit?: string;
  cursor?: string;
}

export interface CreditsGetTransactionsResponse {
  items: Array<LoyaltyTransactionDto>;
  nextCursor: null | string;
}

export interface CreditsReservePosRedemptionInput {
  organizationEndUserId: string;
  pointsAmount: number;
  idempotencyKey: string;
  orderReference: string;
  discountAmount: number;
  currency: string;
}

export interface CreditsReservePosRedemptionResponse {
  transactionId: string;
  digest: null | string;
  transactionBytes: null | string;
  status: LoyaltyTxStatus;
  idempotencyKey: string;
}

export interface CreditsReverseTransactionInput {
  idempotencyKey: string;
  reason: string;
}

export interface CreditsReverseTransactionResponse {
  reversalTransactionId: string;
  reversedTransactionId: string;
  organizationEndUserId: string;
  pointsAmount: number;
  newBalance: number;
  balanceWentNegative: boolean;
  idempotencyKey: string;
}

export interface CustomerVerificationVerifyInput {
  idToken: string;
}

export interface CustomerVerificationVerifyResponse {
  endUserId: null | string;
  suiAddress: string;
  memberId: null | string;
  active: boolean;
}

export type GovernanceRequestType = 'BUDGET_TOP_UP' | 'DEACTIVATE' | 'REINSTATE' | 'SUSPEND' | 'TRANSFER_OWNERSHIP' | 'UPDATE_IDENTITY' | 'UPDATE_PROFILE';

export interface HealthCheckResponse {
  status: HealthStatus;
  checkedAt: string;
  checks: HealthChecks;
}

export type HealthStatus = 'degraded' | 'down' | 'ok';

export interface IdentityCreateNonceInput {
  ephemeralPublicKey: string;
  additionalEpochs?: number;
}

export interface IdentityCreateNonceResponse {
  nonce: string;
  randomness: string;
  epoch: number;
  maxEpoch: number;
  estimatedExpiration: number;
}

export interface IdentityCreateProofInput {
  idToken: string;
  ephemeralPublicKey: string;
  randomness: string;
  maxEpoch: number;
}

export interface IdentityCreateProofResponse {
  proofPoints: a_Iterable_string_length_number_b_Iterable_Iterable_string_length_number_length_number_c_Iterable_string_length_number;
  issBase64Details: value_string_indexMod4_number;
  headerBase64: string;
  addressSeed: string;
}

export interface IdentityEnrollInput {
  idToken: string;
}

export interface IdentityEnrollResponse {
  organizationEndUserId: string;
  endUserId: string;
  isNewEnrollment: boolean;
}

export interface IdentityGoogleLoginInput {
  idToken: string;
}

export interface IdentityGoogleLoginResponse {
  endUserId: string;
  suiAddress: string;
  isNewUser: boolean;
}

export type Iterable_Iterable_string_length_number = Record<string, unknown>;

export type Iterable_string = Record<string, unknown>;

export type LoyaltyTxStatus = 'CONFIRMED' | 'FAILED' | 'PENDING' | 'REVERSED';

export type LoyaltyTxType = 'ADJUSTMENT' | 'EARN' | 'EXPIRY' | 'REDEEM' | 'REVERSAL' | 'TRANSFER';

export interface MembersDetailResponse {
  balance: CreditBalanceSnapshot;
  joinedAt: string;
  id: string;
  endUserId: string;
  displayName: null | string;
  email: null | string;
  phoneNumber: null | string;
  status: string;
  externalMemberId: null | string;
  metadata: unknown;
}

export interface MembersListParams {
  limit?: number;
  cursor?: string;
  q?: string;
  status?: 'ACTIVE' | 'BLOCKED';
  externalMemberId?: string;
}

export interface MembersListResponse {
  items: Array<{
  joinedAt: string;
  id: string;
  endUserId: string;
  displayName: null | string;
  email: null | string;
  phoneNumber: null | string;
  status: string;
  externalMemberId: null | string;
  metadata: unknown;
}>;
  nextCursor: null | string;
}

export interface MembersPatchInput {
  status?: 'ACTIVE' | 'BLOCKED';
  externalMemberId?: null | string;
  metadata?: Record_string_unknown;
}

export interface MembersPatchResponse {
  updated: boolean;
}

export interface MembersTransactionsParams {
  limit?: number;
  cursor?: string;
}

export interface MembersTransactionsResponse {
  items: Array<LoyaltyTransactionDto>;
  nextCursor: null | string;
}

export type MembersVouchersResponse = Array<VoucherOwnershipDto>;

export type OrganizationPersona = 'BUSINESS_DEVELOPER' | 'BUSINESS_OWNER';

export interface OrganizationResolutionResolveResponse {
  organizationId: string;
  name: string;
  slug: string;
}

export type OrganizationType = 'COMPANY' | 'INDIVIDUAL_HOUSEHOLD';

export interface PlatformChangeRequestsApproveInput {
  reason: string;
}

export interface PlatformChangeRequestsApproveResponse {
  organizationId: string;
}

export interface PlatformChangeRequestsListParams {
  limit?: number;
  cursor?: string;
  status?: 'APPROVED' | 'CANCELLED' | 'PENDING' | 'REJECTED';
  organizationId?: string;
}

export interface PlatformChangeRequestsListResponse {
  items: Array<{
  organizationName: null | string;
  requesterEmail: string;
  reviewerEmail: null | string;
  id: string;
  organizationId: null | string;
  requestedById: string;
  reviewedById: null | string;
  requestType: 'BUDGET_TOP_UP' | 'CREATE_ORGANIZATION' | 'DEACTIVATE' | 'REINSTATE' | 'SUSPEND' | 'TRANSFER_OWNERSHIP' | 'UPDATE_IDENTITY' | 'UPDATE_PROFILE';
  status: 'APPROVED' | 'CANCELLED' | 'PENDING' | 'REJECTED';
  payload: unknown;
  reason: null | string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
} & {
  initialOwnerName: null | string;
  initialOwnerEmail: null | string;
}>;
  nextCursor: null | string;
}

export interface PlatformChangeRequestsProposeInput {
  requestType: GovernanceRequestType;
  reason: string;
  payload: {
  name?: string;
  targetUserId?: string;
  amount?: number;
} & IdentityChangePayload;
}

export interface PlatformChangeRequestsProposeResponse {
  id: string;
  status: 'APPROVED' | 'CANCELLED' | 'PENDING' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  organizationId: null | string;
  requestedById: string;
  reviewedById: null | string;
  requestType: 'BUDGET_TOP_UP' | 'CREATE_ORGANIZATION' | 'DEACTIVATE' | 'REINSTATE' | 'SUSPEND' | 'TRANSFER_OWNERSHIP' | 'UPDATE_IDENTITY' | 'UPDATE_PROFILE';
  payload: unknown;
  reason: null | string;
  reviewedAt: string | null;
}

export interface PlatformChangeRequestsRejectInput {
  reason: string;
}

export interface PlatformChangeRequestsRejectResponse {
  organizationId: string;
}

export interface PlatformHealthReportResponse {
  workerLag: WorkerLag | null;
  status: HealthStatus;
  checkedAt: string;
  checks: HealthChecks;
}

export interface PlatformIssuanceBudgetReadResponse {
  organizationId: string;
  remaining: number;
  initialBudget: number;
  capacity: number;
  warningThreshold: 80 | 95 | null;
  shards: Array<IssuanceBudgetShard>;
  recentTopUps: Array<IssuanceBudgetTopUp>;
  observedAt: string;
}

export interface PlatformOrganizationOwnersBootstrapInput {
  systemUserId: string;
}

export interface PlatformOrganizationOwnersBootstrapResponse {
  created: boolean;
}

export interface PlatformOrganizationRequestsApproveInput {
  reason: string;
}

export interface PlatformOrganizationRequestsApproveResponse {
  organizationId: string;
}

export type PlatformOrganizationRequestsListResponse = Array<{
  slug: string;
  requestedById: string;
  id: string;
  organizationId: string;
  name: string;
  status: 'APPROVED' | 'CANCELLED' | 'PENDING' | 'REJECTED';
  reason: null | string;
  createdAt: string;
  applicantEmail: string;
  organizationType: 'COMPANY' | 'INDIVIDUAL_HOUSEHOLD' | null;
  representativeName: null | string;
  legalName: null | string;
  taxId: null | string;
  nationalIdLast4: null | string;
  initialOwnerName: null | string;
  initialOwnerEmail: null | string;
}>;

export interface PlatformOrganizationRequestsRejectInput {
  reason: string;
}

export interface PlatformOrganizationRequestsRejectResponse {
  organizationId: string;
}

export interface PlatformOrganizationsCreateInput {
  ownerUserId: string;
  name: string;
  slug: string;
  organizationType: OrganizationType;
  legalName?: string;
  taxId?: string;
  representativeName?: string;
  nationalId?: string;
}

export interface PlatformOrganizationsCreateResponse {
  id: string;
}

export interface PlatformOrganizationsDetailResponse {
  provisioning: {
  tenantId: string;
  operationId: string;
  status: string;
  errorMessage: null | string;
  updatedAt: string;
};
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'PENDING_APPROVAL' | 'SUSPENDED';
  organizationType: 'COMPANY' | 'INDIVIDUAL_HOUSEHOLD' | null;
  legalName: null | string;
  taxId: null | string;
  representativeName: null | string;
  logoUrl: null | string;
  createdAt: string;
  programStatus: null | string;
  programControlId: null | string;
}

export interface PlatformOrganizationsListParams {
  limit?: number;
  cursor?: string;
  status?: 'ACTIVE' | 'ARCHIVED' | 'PENDING_APPROVAL' | 'SUSPENDED';
  q?: string;
}

export interface PlatformOrganizationsListResponse {
  items: Array<{
  provisioning: {
  tenantId: string;
  operationId: string;
  status: string;
  errorMessage: null | string;
  updatedAt: string;
} | null;
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'PENDING_APPROVAL' | 'SUSPENDED';
  organizationType: 'COMPANY' | 'INDIVIDUAL_HOUSEHOLD' | null;
  legalName: null | string;
  taxId: null | string;
  representativeName: null | string;
  logoUrl: null | string;
  createdAt: string;
  programStatus: null | string;
  programControlId: null | string;
}>;
  nextCursor: null | string;
}

export interface PlatformOrganizationsOwnersParams {
  q?: string;
}

export type PlatformOrganizationsOwnersResponse = Array<{
  id: string;
  email: string;
  fullName: string;
}>;

export interface PlatformOrganizationsProvisionInput {
  earnBps: number;
  expiryDays: number;
  totalBudget: number;
  shardCount: number;
  idempotencyKey: string;
}

export interface PlatformOrganizationsProvisionResponse {
  operationId: string;
  status: string;
}

export type Record_string_unknown = Record<string, unknown>;

export interface RewardsClaimVoucherInput {
  organizationEndUserId: string;
  idempotencyKey: string;
}

export interface RewardsClaimVoucherResponse {
  refundPolicy?: VoucherRefundPolicySnapshot;
  voucherOwnershipId: string;
  voucherId: string;
  organizationEndUserId: string;
  serialCode: string;
  status: VoucherOwnershipStatus;
  pointsDeducted: number;
  pointsCost?: number;
  transactionId?: null | string;
  digest?: null | string;
  transactionBytes?: null | string;
  claimedAt: string;
  expiresAt?: null | string;
}

export interface RewardsCreateVoucherInput {
  code: string;
  title: string;
  description?: string;
  pointsCost?: number;
  discountType?: 'FIXED_AMOUNT' | 'FREE_ITEM' | 'PERCENTAGE';
  discountValue?: string;
  terms?: Record_string_unknown;
  totalSupply?: number | null;
  perMemberLimit?: number | null;
  startsAt?: null | string;
  expiresAt?: null | string;
  validForDays?: null | number;
  metadata?: Record_string_unknown;
  status?: 'ACTIVE' | 'DRAFT' | 'PAUSED';
}

export type RewardsCreateVoucherResponse = VoucherDto;

export interface RewardsFinalizeVoucherUseInput {
  digest: string;
  signature: string;
}

export interface RewardsFinalizeVoucherUseResponse {
  voucherOwnershipId: string;
  voucherId: string;
  serialCode: string;
  status: VoucherOwnershipStatus;
  redeemedAt: string;
  voucherTitle: string;
  discountType?: null | string;
  discountValue?: null | string;
  blockchainDigest: string;
}

export interface RewardsGetClaimResponse {
  refundPolicy?: VoucherRefundPolicySnapshot;
  voucherOwnershipId: string;
  voucherId: string;
  organizationEndUserId: string;
  serialCode: string;
  status: VoucherOwnershipStatus;
  pointsDeducted: number;
  pointsCost?: number;
  transactionId?: null | string;
  digest?: null | string;
  transactionBytes?: null | string;
  claimedAt: string;
  expiresAt?: null | string;
}

export interface RewardsGetRefundPolicyHistoryParams {
  limit?: number;
  beforeVersion?: number;
}

export type RewardsGetRefundPolicyHistoryResponse = Array<VoucherRefundPolicyDto>;

export type RewardsGetRefundPolicyResponse = VoucherRefundPolicyDto;

export type RewardsGetVoucherResponse = VoucherDto;

export interface RewardsGrantVoucherInput {
  organizationEndUserId: string;
  idempotencyKey: string;
}

export interface RewardsGrantVoucherResponse {
  refundPolicy?: VoucherRefundPolicySnapshot;
  voucherOwnershipId: string;
  voucherId: string;
  organizationEndUserId: string;
  serialCode: string;
  status: VoucherOwnershipStatus;
  pointsDeducted: number;
  pointsCost?: number;
  transactionId?: null | string;
  digest?: null | string;
  transactionBytes?: null | string;
  claimedAt: string;
  expiresAt?: null | string;
}

export type RewardsListMemberVouchersResponse = Array<VoucherOwnershipDto>;

export type RewardsListVouchersResponse = Array<VoucherDto>;

export interface RewardsPrepareVoucherUseInput {
  serialCode: string;
  idempotencyKey: string;
}

export interface RewardsPrepareVoucherUseResponse {
  voucherOwnershipId: string;
  voucherId: string;
  serialCode: string;
  status: VoucherOwnershipStatus;
  digest: null | string;
  transactionBytes: null | string;
  voucherTitle: string;
  discountType?: null | string;
  discountValue?: null | string;
}

export interface RewardsUpdateVoucherInput {
  code?: string;
  title?: string;
  description?: string;
  pointsCost?: number;
  discountType?: 'FIXED_AMOUNT' | 'FREE_ITEM' | 'PERCENTAGE';
  discountValue?: string;
  terms?: Record_string_unknown;
  totalSupply?: number | null;
  perMemberLimit?: number | null;
  startsAt?: null | string;
  expiresAt?: null | string;
  validForDays?: null | number;
  metadata?: Record_string_unknown;
  status?: 'ACTIVE' | 'DRAFT' | 'PAUSED';
}

export type RewardsUpdateVoucherResponse = VoucherDto;

export type SystemRole = 'SYSTEM_ADMIN' | 'SYSTEM_USER';

export type VoucherApprovalStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'WITHDRAWN';

export type VoucherOwnershipStatus = 'AVAILABLE' | 'CANCELLED' | 'EXPIRED' | 'REDEEMED' | 'RESERVED';

export type VoucherPublishStatus = 'FAILED' | 'NOT_PUBLISHED' | 'PUBLISHED' | 'PUBLISHING';

export type VoucherStatus = 'ACTIVE' | 'DEPLETED' | 'DRAFT' | 'EXPIRED' | 'PAUSED' | 'PENDING_APPROVAL';

export type WebhooksListDeliveriesResponse = Array<{
  id: string;
  status: 'DEAD_LETTER' | 'DELIVERED' | 'PENDING';
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  payload: unknown;
  endpointId: string;
  eventType: string;
  attemptCount: number;
  nextAttemptAt: string;
  lastResponseStatus: null | number;
  lastError: null | string;
}>;

export type WebhooksListEndpointsResponse = Array<{
  id: string;
  organizationId: string;
  url: string;
  description: null | string;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  updatedAt: string;
}>;

export interface DependencyCheck {
  status: 'down' | 'up';
  latencyMs: number;
  error?: string;
}

export interface HealthChecks {
  database: DependencyCheck;
  redis: DependencyCheck;
  sui: DependencyCheck;
}

export interface IndexerLag {
  streamName: string;
  lastCheckpoint: null | string;
  caughtUpCheckpoint: null | string;
  chainCheckpoint: null | string;
  checkpointsBehind: null | string;
  sinceUpdateSeconds: number;
}

export interface OperationLag {
  commandType: string;
  status: string;
  count: number;
  oldestAgeSeconds: number;
  awaitingCustomer: boolean;
}

export interface WorkerLag {
  operations: {
  oldestWorkerOwedAgeSeconds: null | number;
  byCommandType: Array<OperationLag>;
};
  webhookDeliveries: {
  pending: number;
  due: number;
  oldestDueAgeSeconds: null | number;
  deadLettered: number;
};
  indexer: Array<IndexerLag>;
}

export interface ConsoleCredential {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: Array<string>;
  status: string;
  createdAt: string;
  lastUsedAt: null | string;
}

export interface IdentityChangePayload {
  organizationType?: 'COMPANY' | 'INDIVIDUAL_HOUSEHOLD';
  legalName?: string;
  taxId?: string;
  representativeName?: string;
  nationalId?: string;
}

export interface CreditBalanceSnapshot {
  organizationEndUserId: string;
  confirmedBalance: number;
  pendingEarn: number;
  pendingRedemption: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  asOfCheckpoint: null | string;
  observedAt: string;
  stale: boolean;
}

export interface IssuanceBudgetShard {
  shardId: string;
  remaining: number;
}

export interface IssuanceBudgetTopUp {
  operationId: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface LoyaltyTransactionDto {
  id: string;
  organizationId: string;
  organizationEndUserId: string;
  createdByMembershipId?: null | string;
  blockchainTransactionId?: null | string;
  blockchainDigest?: null | string;
  transactionType: LoyaltyTxType;
  pointsAmount: null | number;
  purchaseAmount?: null | number;
  estimatedPoints?: null | number;
  idempotencyKey: string;
  receiptReference?: null | string;
  status: LoyaltyTxStatus;
  metadata?: Record_string_unknown | null;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherApprovalDto {
  status: VoucherApprovalStatus;
  submittedBy: {
  type: 'API_CREDENTIAL' | 'USER';
  id: string;
} | null;
  submittedAt: string;
  reviewedById: null | string;
  reviewedAt: null | string;
  reason: null | string;
}

export interface VoucherDto {
  id: string;
  organizationId: string;
  code: string;
  title: string;
  description?: null | string;
  pointsCost: number;
  discountType?: null | string;
  discountValue?: null | string;
  terms?: Record_string_unknown | null;
  publishStatus: VoucherPublishStatus;
  suiTermsId?: null | string;
  refundPolicy?: VoucherRefundPolicySnapshot | null;
  totalSupply?: null | number;
  perMemberLimit: null | number;
  claimedCount: number;
  status: VoucherStatus;
  startsAt?: null | string;
  expiresAt?: null | string;
  validForDays: null | number;
  metadata?: Record_string_unknown | null;
  approval?: VoucherApprovalDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherOwnershipDto {
  refundPolicy?: VoucherRefundPolicySnapshot;
  id: string;
  voucherId: string;
  organizationEndUserId: string;
  serialCode: string;
  status: VoucherOwnershipStatus;
  claimedAt: string;
  redeemedAt?: null | string;
  expiresAt?: null | string;
  voucher?: VoucherDto;
}

export interface VoucherRefundPolicyDto {
  reason: string;
  createdByUserId: null | string;
  createdByCredentialId: null | string;
  createdAt: null | string;
  version: number;
  allowUnused: boolean;
  allowExpired: boolean;
  allowRedeemed: boolean;
  restockUnused: boolean;
  refundWindowDays: null | number;
}

export interface VoucherRefundPolicySnapshot {
  version: number;
  allowUnused: boolean;
  allowExpired: boolean;
  allowRedeemed: boolean;
  restockUnused: boolean;
  refundWindowDays: null | number;
}

export interface a_Iterable_string_length_number_b_Iterable_Iterable_string_length_number_length_number_c_Iterable_string_length_number {
  a: Iterable_string & {
  length: number;
};
  b: Iterable_Iterable_string_length_number & {
  length: number;
};
  c: Iterable_string & {
  length: number;
};
}

export interface value_string_indexMod4_number {
  value: string;
  indexMod4: number;
}

export interface ErrorResponse {
  statusCode: number;
  message: string | Array<string>;
  error?: string;
}

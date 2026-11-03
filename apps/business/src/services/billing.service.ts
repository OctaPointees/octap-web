import { requireIntegrationRole } from './session';
import { simulate } from './mock/http';

export type BillingPlanId = 'sandbox' | 'growth' | 'scale';
export type BillingInvoice = {
  id: string;
  date: string;
  description: string;
  amountVnd: number;
  status: 'paid' | 'open';
};
export type BillingState = {
  plan: BillingPlanId;
  status: 'free' | 'active' | 'cancelled';
  renewalAt: string | null;
  paymentMethod: { brand: string; last4: string } | null;
  invoices: BillingInvoice[];
};

export const BILLING_PLANS = {
  sandbox: { name: 'Sandbox', priceVnd: 0, description: 'Test keys and test data for building integrations.' },
  growth: { name: 'Growth', priceVnd: 1_190_000, description: 'Production access for growing integrations.' },
  scale: { name: 'Scale', priceVnd: 3_490_000, description: 'Production access for high volume integrations.' },
} satisfies Record<BillingPlanId, { name: string; priceVnd: number; description: string }>;

const storageKey = (tenantId: string) => `octap.billing:${tenantId}`;
export function getNextBillingDate(from = new Date()) {
  const date = new Date(from);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + 1);
  date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
  return date;
}

function initialState(): BillingState {
  return { plan: 'sandbox', status: 'free', renewalAt: null, paymentMethod: null, invoices: [] };
}

function readState(tenantId: string): BillingState {
  try {
    const value = localStorage.getItem(storageKey(tenantId));
    return value ? { ...initialState(), ...JSON.parse(value) as Partial<BillingState> } : initialState();
  } catch {
    return initialState();
  }
}

function writeState(tenantId: string, state: BillingState) {
  localStorage.setItem(storageKey(tenantId), JSON.stringify(state));
  return state;
}

export function hasProductionAccess(tenantId: string) {
  const state = readState(tenantId);
  return state.status === 'active' && state.plan !== 'sandbox';
}

export const billingService = {
  getState() {
    return simulate('GET /v1/developer/billing', () => readState(requireIntegrationRole()));
  },
  subscribe(plan: Exclude<BillingPlanId, 'sandbox'>) {
    return simulate('POST /v1/developer/billing/subscription', () => {
      const tenantId = requireIntegrationRole();
      const current = readState(tenantId);
      const renewalAt = getNextBillingDate().toISOString();
      const invoice: BillingInvoice = {
        id: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        description: `${BILLING_PLANS[plan].name} plan · first month`,
        amountVnd: BILLING_PLANS[plan].priceVnd,
        status: 'paid',
      };
      return writeState(tenantId, {
        ...current,
        plan,
        status: 'active',
        renewalAt,
        paymentMethod: current.paymentMethod ?? { brand: 'Visa', last4: '4242' },
        invoices: [invoice, ...current.invoices],
      });
    }, { plan });
  },
  cancel() {
    return simulate('POST /v1/developer/billing/cancel', () => {
      const tenantId = requireIntegrationRole();
      return writeState(tenantId, { ...readState(tenantId), plan: 'sandbox', status: 'free', renewalAt: null });
    });
  },
  updatePaymentMethod() {
    return simulate('POST /v1/developer/billing/payment-method', () => {
      const tenantId = requireIntegrationRole();
      const state = readState(tenantId);
      const last4 = String(Math.floor(1000 + Math.random() * 9000));
      return writeState(tenantId, { ...state, paymentMethod: { brand: 'Visa', last4 } });
    });
  },
};

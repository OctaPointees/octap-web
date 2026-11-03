import { useState } from 'react';
import { ArrowRight, CreditCard, LockKey, Receipt, Sparkle } from 'phosphor-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/shared/Button';
import {
  Card,
  ErrorState,
  LoadingBlock,
  PageHeader,
  StatusBadge,
} from '@/components/shared/Display';
import { ConfirmDialog, Modal } from '@/components/shared/Modal';
import {
  billingKeys,
  useBillingState,
  useCancelBilling,
  useSubscribeBillingPlan,
  useUpdateBillingPaymentMethod,
} from '@/queries/merchant';
import { BILLING_PLANS, getNextBillingDate, type BillingPlanId } from '@/services/billing.service';
import { fmtDate, fmtVnd } from '@/utils/format';
import { notify } from '@/utils/toast';

type PaidPlan = Exclude<BillingPlanId, 'sandbox'>;

export default function DeveloperBillingPage() {
  const queryClient = useQueryClient();
  const billing = useBillingState();
  const subscribe = useSubscribeBillingPlan();
  const cancel = useCancelBilling();
  const updatePayment = useUpdateBillingPaymentMethod();
  const [selectedPlan, setSelectedPlan] = useState<PaidPlan>('growth');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSummaryOpen, setReviewSummaryOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (billing.isLoading) return <LoadingBlock rows={3} />;
  if (billing.error) return <ErrorState error={billing.error} onRetry={billing.refetch} />;
  if (!billing.data) return null;

  const state = billing.data;
  const active = state.status === 'active' && state.plan !== 'sandbox';
  const plan = BILLING_PLANS[state.plan];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: billingKeys.state() });
  const submitUpgrade = () =>
    subscribe.mutate(selectedPlan, {
      onSuccess: () => {
        setReviewOpen(false);
        setConfirmationOpen(true);
        void invalidate();
      },
      onError: notify.error,
    });

  return (
    <>
      <PageHeader
        title="Billing & plan"
        description="Manage your demo subscription and Production access."
        actions={
          <span className="badge badge-warning badge-soft">Demo billing · no real charges</span>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card
          title="Current plan"
          actions={<StatusBadge status={active ? 'active' : 'free'} />}
          style={{
            backgroundImage:
              'linear-gradient(95deg, var(--color-primary) 0%, #a2007b 48%, #7a1068 100%)',
          }}
          className="text-white"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-3xl font-bold">{plan.name}</div>
              <p className="mt-1 text-sm opacity-65">
                {active ? `${fmtVnd(plan.priceVnd)} / month` : 'Free forever for testing'}
              </p>
            </div>
            {active ? (
              <Button className="btn-error btn-soft" onClick={() => setCancelOpen(true)}>
                Cancel subscription
              </Button>
            ) : (
              <Button className="btn-primary" onClick={() => setReviewOpen(true)}>
                Upgrade plan <ArrowRight />
              </Button>
            )}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 text-black">
            <div className="rounded-box bg-base-200 p-4">
              <div className="text-xs opacity-60">Renewal date</div>
              <div className="mt-1 font-semibold">
                {active && state.renewalAt ? fmtDate(state.renewalAt) : 'No renewal scheduled'}
              </div>
            </div>
            <div className="rounded-box bg-base-200 p-4">
              <div className="text-xs opacity-60">Payment status</div>
              <div className="mt-1 font-semibold">
                {active ? 'Paid · demo confirmation' : 'No payment required'}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Payment method" actions={<CreditCard size={20} className="opacity-60" />}>
          <p className="text-sm opacity-65">
            This demo never collects card numbers or payment credentials.
          </p>
          <div className="my-4 rounded-box border border-base-300 p-4">
            {state.paymentMethod ? (
              <>
                <div className="font-semibold">
                  {state.paymentMethod.brand} ending in {state.paymentMethod.last4}
                </div>
                <div className="mt-1 text-xs opacity-60">Mock payment method</div>
              </>
            ) : (
              <>
                <div className="font-semibold">No payment method</div>
                <div className="mt-1 text-xs opacity-60">
                  A mock method appears after upgrading.
                </div>
              </>
            )}
          </div>
          <Button
            disabled={updatePayment.isPending}
            onClick={() =>
              updatePayment.mutate(undefined, {
                onSuccess: () => {
                  void invalidate();
                  notify.success('Demo payment method updated');
                },
                onError: (error) => notify.error(error),
              })
            }
          >
            {state.paymentMethod ? 'Change demo payment method' : 'Add demo payment method'}
          </Button>
        </Card>
      </div>

      <Card title="Sandbox and Production" actions={<LockKey size={20} className="opacity-60" />}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-box border border-success/30 bg-success/5 p-4">
            <div className="flex items-center gap-2 font-semibold">
              <span className="badge badge-success badge-sm">Free</span> Sandbox
            </div>
            <p className="mt-2 text-sm opacity-70">
              Available for test keys and test data. Build and verify your integration without a
              subscription.
            </p>
            <div className="mt-3 font-mono text-xs">ocp_test_••••••</div>
          </div>
          <div className="rounded-box border border-base-300 p-4">
            <div className="flex items-center gap-2 font-semibold">
              <span className={`badge badge-sm ${active ? 'badge-success' : 'badge-ghost'}`}>
                {active ? 'Unlocked' : 'Subscription required'}
              </span>{' '}
              Production
            </div>
            <p className="mt-2 text-sm opacity-70">
              {active
                ? 'Production key creation is available in the API keys page.'
                : 'Production keys are locked until a paid plan is active. Upgrade to create a mock production key.'}
            </p>
            <div className="mt-3 font-mono text-xs">
              {active ? 'ocp_live_•••••• · demo state' : 'ocp_live_•••••• · locked'}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Demo invoice history" actions={<Receipt size={20} className="opacity-60" />}>
        {state.invoices.length ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {state.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="font-mono text-xs">{invoice.id}</td>
                    <td>{fmtDate(invoice.date)}</td>
                    <td>{invoice.description}</td>
                    <td>
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="text-right">{fmtVnd(invoice.amountVnd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-6 text-center text-sm opacity-60">
            No demo invoices yet. An invoice appears after you confirm an upgrade.
          </div>
        )}
        <p className="mt-2 text-xs opacity-50">
          Illustrative records only. No invoices are sent and no payments are processed.
        </p>
      </Card>

      <Modal
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        title="Choose a plan"
        description="Select a demo plan. The next step shows the recurring amount before confirmation."
        size="lg"
        footer={
          <>
            <Button onClick={() => setReviewOpen(false)}>Close</Button>
            <Button
              className="btn-primary"
              onClick={() => {
                setReviewOpen(false);
                setReviewSummaryOpen(true);
              }}
            >
              Continue to review <ArrowRight />
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {(['growth', 'scale'] as PaidPlan[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelectedPlan(id)}
              className={`rounded-box border p-4 text-left transition-colors ${selectedPlan === id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-base-300 hover:border-primary/50'}`}
            >
              <div className="flex items-center justify-between font-semibold">
                {BILLING_PLANS[id].name}
                {selectedPlan === id && <Sparkle className="text-primary" />}
              </div>
              <div className="mt-2 text-xl font-bold">
                {fmtVnd(BILLING_PLANS[id].priceVnd)}
                <span className="text-sm font-normal opacity-60"> / month</span>
              </div>
              <p className="mt-2 text-sm opacity-65">{BILLING_PLANS[id].description}</p>
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={reviewSummaryOpen}
        onOpenChange={setReviewSummaryOpen}
        title="Review your demo subscription"
        description="Check the recurring price and next charge before you confirm."
        footer={
          <>
            <Button
              onClick={() => {
                setReviewSummaryOpen(false);
                setReviewOpen(true);
              }}
            >
              Back
            </Button>
            <Button className="btn-primary" disabled={subscribe.isPending} onClick={submitUpgrade}>
              {subscribe.isPending ? 'Confirming…' : 'Confirm demo upgrade'}
            </Button>
          </>
        }
      >
        <div className="rounded-box border border-base-300 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">{BILLING_PLANS[selectedPlan].name}</div>
              <p className="text-sm opacity-65">{BILLING_PLANS[selectedPlan].description}</p>
            </div>
            <div className="text-right font-semibold">
              {fmtVnd(BILLING_PLANS[selectedPlan].priceVnd)}
              <div className="text-xs font-normal opacity-60">per month</div>
            </div>
          </div>
          <div className="my-4 border-t border-base-300" />
          <div className="flex justify-between text-sm">
            <span>Due today</span>
            <span>
              {fmtVnd(BILLING_PLANS[selectedPlan].priceVnd)}{' '}
              <span className="opacity-60">(mock)</span>
            </span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span>Next charge</span>
            <span>{fmtDate(getNextBillingDate().toISOString())}</span>
          </div>
        </div>
        <div className="alert alert-info alert-soft mt-4 text-sm">
          Demo only. No card details are collected and no real charge will occur.
        </div>
      </Modal>

      <Modal
        open={confirmationOpen}
        onOpenChange={setConfirmationOpen}
        title="Production is unlocked"
        description="Your mock upgrade is complete. No payment was processed."
        footer={
          <Button className="btn-primary" onClick={() => setConfirmationOpen(false)}>
            Done
          </Button>
        }
      >
        <div className="rounded-box bg-success/10 p-4">
          <div className="font-semibold">
            {BILLING_PLANS[state.plan].name} · {fmtVnd(BILLING_PLANS[state.plan].priceVnd)} / month
          </div>
          <p className="mt-1 text-sm opacity-70">
            Next demo charge: {state.renewalAt ? fmtDate(state.renewalAt) : 'one month from today'}
          </p>
        </div>
        <p className="mt-4 text-sm">
          Production is now available on{' '}
          <a className="link link-primary" href="/developer/api-keys">
            API keys
          </a>
          . Your mock production key will use the <code>ocp_live_</code> prefix.
        </p>
      </Modal>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel demo subscription?"
        description="The demo subscription ends immediately and Production key creation will be locked again. Existing keys remain listed as sample data."
        confirmLabel="Cancel subscription"
        tone="warning"
        loading={cancel.isPending}
        onConfirm={() =>
          cancel.mutate(undefined, {
            onSuccess: () => {
              setCancelOpen(false);
              void invalidate();
              notify.success('Demo subscription cancelled');
            },
            onError: (error) => notify.error(error),
          })
        }
      />
    </>
  );
}

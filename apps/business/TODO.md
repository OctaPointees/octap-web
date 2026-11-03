# TODO

## Current work: Developer billing demo

- [ ] Add a **Billing & plan** page to the developer portal navigation.
- [ ] Show the current plan, monthly price, renewal date, payment status, and demo invoice history.
- [ ] Present Sandbox as free and available for test keys and test data.
- [ ] Present Production as subscription-gated, with a clear upgrade action and locked-state explanation.
- [ ] Build a demo upgrade journey: choose a plan, review recurring price and next charge, then show a mock confirmation.
- [ ] Add mock subscription management and payment-method interactions; label the experience clearly as a demo and do not collect real card details.
- [ ] After the mock upgrade, show Production unlocking and a mock production key state in the developer experience.
- [ ] Keep plan details and subscription state in a small mock data/service layer so a real billing provider can replace it later.

## Next work

- [ ] Review billing page behavior and responsive layout alongside the existing developer portal UI.
- [ ] Verify developer routing, navigation, and the Sandbox-to-Production demo flow.
- [ ] Update developer-facing documentation to explain the demo subscription experience and the intended Sandbox/Production distinction.
- [ ] Later, agree on actual plans and billing rules, then integrate hosted checkout, subscription status, invoices, and billing management.
- [ ] Later, enforce production access server-side based on subscription status; keep sandbox credentials isolated from live services.
- [ ] Investigate localhost restrictions only as a separate technical decision; do not treat localhost detection as the security boundary for production access.

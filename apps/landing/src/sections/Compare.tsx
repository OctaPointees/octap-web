export default function Compare() {
  return (
    <section id="compare" className="scroll-mt-20 py-20">
      <div className="max-w-320 mx-auto px-8">
        <h2 className="font-head text-4xl font-extrabold tracking-tight mb-10">
          How OctaP compares
        </h2>
        <div className="overflow-x-auto rounded-field shadow-float-sm border border-purple/10">
          <table className="w-full text-sm border-collapse min-w-220">
            <thead>
              <tr className="bg-tint text-left">
                <th className="p-4 font-bold text-muted w-[18%]"></th>
                <th className="p-4 font-bold text-pink w-[20%]">OctaP</th>
                <th className="p-4 font-bold text-muted w-[20%]">Centralized DB</th>
                <th className="p-4 font-bold text-muted w-[20%]">UrBox</th>
                <th className="p-4 font-bold text-muted w-[20%]">Talon.one</th>
              </tr>
            </thead>
            <tbody>
              <tr className="ledger-row">
                <td className="p-4 font-bold">Auditability</td>
                <td className="p-4 font-medium">
                  Point history is recorded on Sui and can be checked against the ledger.
                </td>
                <td className="p-4 text-muted">
                  Accuracy depends on trusting the operator of an internal database.
                </td>
                <td className="p-4 text-muted">
                  Closed marketplace ledger; not exposed for independent verification.
                </td>
                <td className="p-4 text-muted">
                  Proprietary audit trail inside the vendor's own database.
                </td>
              </tr>
              <tr className="ledger-row">
                <td className="p-4 font-bold">Tenant isolation</td>
                <td className="p-4 font-medium">
                  Each merchant's points are a separate record from day one.
                </td>
                <td className="p-4 text-muted">Depends on custom schema design per merchant.</td>
                <td className="p-4 text-muted">
                  Shared marketplace model, not built around one merchant's program.
                </td>
                <td className="p-4 text-muted">
                  Configurable per account, within one shared database.
                </td>
              </tr>
              <tr className="ledger-row">
                <td className="p-4 font-bold">White-label / SDK</td>
                <td className="p-4 font-medium">
                  TypeScript SDK and API keys to run points under your own brand.
                </td>
                <td className="p-4 text-muted">Usually built in-house; no packaged SDK.</td>
                <td className="p-4 text-muted">
                  Consumer-facing marketplace, not a backend for other brands.
                </td>
                <td className="p-4 text-muted">Has an API, aimed at enterprise promotion teams.</td>
              </tr>
              <tr className="ledger-row">
                <td className="p-4 font-bold">Onboarding friction</td>
                <td className="p-4 font-medium">
                  Sign in with Google, email, or phone — no wallet setup.
                </td>
                <td className="p-4 text-muted">
                  Typically account + password, another login to manage.
                </td>
                <td className="p-4 text-muted">Sign up inside the UrBox app or site.</td>
                <td className="p-4 text-muted">
                  Depends entirely on what the merchant builds on top.
                </td>
              </tr>
              <tr className="ledger-row">
                <td className="p-4 font-bold">AI / MCP readiness</td>
                <td className="p-4 font-medium">
                  Built-in MCP server for agents to query balances within RBAC.
                </td>
                <td className="p-4 text-muted">Needs custom integration work.</td>
                <td className="p-4 text-muted">No agent protocol exposed.</td>
                <td className="p-4 text-muted">REST webhooks only; no agent-context protocol.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

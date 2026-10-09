const COLUMNS = ['OctaP', 'Centralized DB', 'UrBox', 'Talon.one'];

const ROWS = [
  {
    label: 'Auditability',
    cells: [
      'Point history is recorded on Sui and can be checked against the ledger.',
      'Accuracy depends on trusting the operator of an internal database.',
      'Closed marketplace ledger; not exposed for independent verification.',
      "Proprietary audit trail inside the vendor's own database.",
    ],
  },
  {
    label: 'Tenant isolation',
    cells: [
      "Each merchant's points are a separate record from day one.",
      'Depends on custom schema design per merchant.',
      "Shared marketplace model, not built around one merchant's program.",
      'Configurable per account, within one shared database.',
    ],
  },
  {
    label: 'White-label / SDK',
    cells: [
      'TypeScript SDK and API keys to run points under your own brand.',
      'Usually built in-house; no packaged SDK.',
      'Consumer-facing marketplace, not a backend for other brands.',
      'Has an API, aimed at enterprise promotion teams.',
    ],
  },
  {
    label: 'Onboarding friction',
    cells: [
      'Sign in with Google, email, or phone — no wallet setup.',
      'Typically account + password, another login to manage.',
      'Sign up inside the UrBox app or site.',
      'Depends entirely on what the merchant builds on top.',
    ],
  },
  {
    label: 'AI / MCP readiness',
    cells: [
      'Built-in MCP server for agents to query balances within RBAC.',
      'Needs custom integration work.',
      'No agent protocol exposed.',
      'REST webhooks only; no agent-context protocol.',
    ],
  },
];

export default function Compare() {
  return (
    <section id="compare" className="scroll-mt-16 py-24">
      <div className="max-w-[1280px] mx-auto px-8">
        <h2 className="text-4xl font-extrabold mb-10 tracking-tight text-white" data-reveal>
          How OctaP compares
        </h2>
        <div className="overflow-x-auto rounded-2xl glass">
          <table className="w-full text-sm border-collapse min-w-[880px]">
            <thead>
              <tr className="text-left">
                <th className="p-4 font-bold text-[#c8bcdb] w-[18%]" />
                {COLUMNS.map((column, i) => (
                  <th key={column} className={`p-4 font-bold w-[20%] ${i === 0 ? 'text-[#ff5fc4]' : 'text-[#c8bcdb]'}`}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {ROWS.map((row) => (
                <tr key={row.label} data-reveal-wipe>
                  <td className="p-4 font-semibold text-white">{row.label}</td>
                  <td className="p-4 font-medium text-[#f5eefc]">{row.cells[0]}</td>
                  <td className="p-4 text-[#8a7fa3]">{row.cells[1]}</td>
                  <td className="p-4 text-[#8a7fa3]">{row.cells[2]}</td>
                  <td className="p-4 text-[#8a7fa3]">{row.cells[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

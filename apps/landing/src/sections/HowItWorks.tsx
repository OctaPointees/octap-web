import CardFrame from '../components/CardFrame';

const STEPS = [
  {
    slot: 0,
    color: '#ff5fc4',
    glow: 'rgba(255,95,196,0.28)',
    icon: 'ti-receipt-2',
    number: '01',
    label: '01 · PAY',
    title: 'Customer pays',
    description: "Shopper checks out at a partner's shop, in person or online — no account needed yet.",
  },
  {
    slot: 1,
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.28)',
    icon: 'ti-fingerprint',
    number: '02',
    label: '02 · SIGN IN',
    title: 'Signs in',
    description: 'Enoki zkLogin verifies identity with a phone number or Google account — no seed phrase, no wallet popup.',
  },
  {
    slot: 2,
    color: '#38dbe0',
    glow: 'rgba(56,219,224,0.28)',
    icon: 'ti-adjustments',
    number: '03',
    label: '03 · GATEWAY',
    title: 'Gateway applies rules',
    description: "OctaP's gateway checks the merchant's active campaign and tier rules to calculate the right number of points.",
  },
  {
    slot: 3,
    color: '#ff5fc4',
    glow: 'rgba(255,95,196,0.28)',
    icon: 'ti-cube',
    number: '04',
    label: '04 · SUI LEDGER',
    title: 'Recorded on Sui',
    description: "Written to the merchant's isolated Move record — the transaction is sponsored, so the customer pays no gas.",
  },
  {
    slot: 4,
    color: '#38dbe0',
    glow: 'rgba(56,219,224,0.28)',
    icon: 'ti-certificate',
    number: '05',
    label: '05 · PROOF',
    title: 'Verifiable proof',
    description: 'Customer and merchant can both check the same record afterwards — nothing hides in an internal database.',
  },
];

// Pinned, scroll-scrubbed 3D flip-card deck. See useLandingAnimations for the GSAP timeline that
// fans this deck out and flips it — the DOM below only needs to expose the hooks it queries for:
// [data-name="process pin stage"], .flip-card, .flip-card-inner, .flip-face.
export default function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-16 relative" data-name="process pin wrapper">
      <div className="h-screen overflow-hidden flex flex-col items-center justify-center relative z-20" data-name="process pin stage">
        <div className="absolute top-16 left-0 right-0 text-center px-8">
          <h2 className="text-4xl font-extrabold tracking-tight text-white">How it works</h2>
          <p className="mt-2 text-sm font-mono text-[#8a7fa3]">Scroll to fan out the deck, then flip each card — scroll back to reverse it.</p>
        </div>

        <div className="flip-stage" style={{ perspective: 1800 }} data-name="process flip stage">
          {STEPS.map((step) => (
            <div key={step.slot} className="flip-card" style={{ boxShadow: `0 0 40px ${step.glow}` }} data-slot={step.slot}>
              <div className="flip-card-inner">
                <div className="flip-face flip-back" style={{ color: step.color }}>
                  <CardFrame opacity={1} />
                  <i className={`ti ${step.icon} relative text-2xl mb-2`} />
                  <span className="relative font-mono text-3xl font-extrabold">{step.number}</span>
                </div>
                <div className="flip-face flip-front" style={{ color: step.color }}>
                  <CardFrame opacity={0.14} />
                  <i className={`ti ${step.icon} relative text-3xl mb-3`} />
                  <span className="relative font-mono text-[10px] mb-1 tracking-wider">{step.label}</span>
                  <h4 className="relative text-sm font-bold text-white mb-2">{step.title}</h4>
                  <p className="relative text-[11px] text-[#c8bcdb] leading-relaxed">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

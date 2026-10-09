// Ornate tarot-card-style line frame shared by every flip-card face in the "How it works" deck.
// The back face uses full opacity; the front face fades it to a faint watermark.
export default function CardFrame({ opacity = 1 }: { opacity?: number }) {
  return (
    <svg className="card-frame" viewBox="0 0 230 330" fill="none" stroke="currentColor" style={{ opacity }}>
      <rect x="4" y="4" width="222" height="322" rx="22" strokeWidth="2" />
      <rect x="16" y="16" width="198" height="298" rx="14" strokeWidth="1" opacity={opacity === 1 ? 0.45 : 1} />
      {opacity === 1 && (
        <>
          <path
            d="M16 46 L16 16 L46 16M184 16 L214 16 L214 46M214 284 L214 314 L184 314M46 314 L16 314 L16 284"
            strokeWidth="1.5"
            opacity="0.6"
          />
          <path d="M115 127 L115 60M115 203 L115 270M77 165 L30 165M153 165 L200 165" strokeWidth="1" opacity="0.35" />
          <g transform="translate(115,165)">
            <rect x="-32" y="-32" width="64" height="64" rx="10" transform="rotate(45)" strokeWidth="2" />
          </g>
        </>
      )}
    </svg>
  );
}

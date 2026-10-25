/** Original vector artwork for the unofficial coffee rewards concept. */
export default function CoffeeIllustration() {
  return (
    <svg
      viewBox="0 0 440 300"
      className="w-full max-w-md"
      role="img"
      aria-label="A takeaway coffee and an iced latte"
    >
      <circle cx="234" cy="150" r="126" className="fill-surface opacity-35" />
      <ellipse cx="230" cy="269" rx="151" ry="13" className="fill-evergreen opacity-10" />
      <g transform="translate(65 27) rotate(-10 90 120)">
        <path d="M32 61h128l-17 177c-28 13-65 13-94 0Z" className="fill-surface" />
        <path d="M39 126h114l-7 73H46Z" className="fill-cream" />
        <path d="M24 52h144v14H24Z M37 35h117l10 17H27Z" className="fill-evergreen" />
        <path
          d="M45 39h97"
          className="stroke-surface opacity-20"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="96" cy="161" r="32" className="fill-partner" />
        <circle
          cx="96"
          cy="161"
          r="26"
          fill="none"
          className="stroke-surface opacity-60"
          strokeWidth="1"
        />
        <path d="m96 143 5 12 13 1-10 9 3 13-11-7-11 7 3-13-10-9 13-1Z" className="fill-surface" />
      </g>
      <g transform="translate(232 66) rotate(11 65 95)">
        <path d="m22 43 10 155c25 11 54 11 78 0l10-155Z" className="fill-cream" />
        <path d="m26 101 7 97c25 11 53 11 77 0l6-97Z" className="fill-coffee" />
        <path d="m26 87 2 29c26 10 60 12 86 2l2-31Z" className="fill-coffee-dark opacity-70" />
        <path
          d="m39 54 20-3 4 20-20 4Zm39 6 21 4-5 20-21-4ZM56 80l19-7 7 19-19 7Z"
          className="fill-surface opacity-70"
        />
        <path d="M17 39h108v10H17Z" className="fill-surface" />
        <path d="M30 39c2-32 80-32 82 0" className="fill-surface opacity-70" />
        <path d="m77 34 9-72" className="stroke-partner" strokeWidth="8" strokeLinecap="round" />
        <circle cx="71" cy="146" r="23" className="fill-partner" />
        <path d="m71 132 4 9 10 1-8 6 3 10-9-5-9 5 3-10-8-6 10-1Z" className="fill-surface" />
      </g>
      <g className="fill-gold">
        <path d="m356 54 3 8 9 1-7 6 2 9-7-5-8 5 2-9-7-6 9-1Z" />
        <path d="m52 192 2 6 7 1-5 4 1 7-5-4-6 4 2-7-5-4 7-1Z" />
      </g>
    </svg>
  );
}

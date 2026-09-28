/** The Anumat logo: orange tile mark plus wordmark. The wordmark follows the text colour. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 289.9 64" className={className} role="img" aria-label="Anumat">
      <rect width="64" height="64" rx="15" fill="#F26A1B" />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 51 L32 13 L48 51" stroke="#FFFFFF" strokeWidth="6.5" />
        <path d="M25.5 38 L30 42.5 L39 32" stroke="#1B2230" strokeWidth="4.5" />
      </g>
      <g transform="translate(82 3.2) scale(0.9)">
        <path d="M 3.5 50 L 17.5 14 L 31.5 50 M 9.5 37 H 25.5 M 44.5 50 V 14 L 70.5 50 V 14 M 83.5 14 V 37 A 13 13 0 0 0 109.5 37 V 14 M 122.5 50 V 14 L 139.5 38 L 156.5 14 V 50 M 169.5 50 L 183.5 14 L 197.5 50 M 175.5 37 H 191.5 M 201.5 14 H 227.5 M 214.5 14 V 50" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** The mark alone (orange tile, A and check), for avatars and small spaces. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="15" fill="#F26A1B" />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 51 L32 13 L48 51" stroke="#FFFFFF" strokeWidth="6.5" />
        <path d="M25.5 38 L30 42.5 L39 32" stroke="#1B2230" strokeWidth="4.5" />
      </g>
    </svg>
  );
}

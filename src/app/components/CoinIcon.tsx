export function CoinIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path d="M16 3 L27 11 L16 29 L5 11 Z" fill="#0E8B80" />
      <path d="M16 3 L27 11 L16 15 Z" fill="#2FBFAF" />
      <path d="M16 3 L5 11 L16 15 Z" fill="#43D9C6" />
      <path d="M5 11 L16 15 L16 29 Z" fill="#14A497" />
      <path d="M27 11 L16 15 L16 29 Z" fill="#0B7A70" />
    </svg>
  );
}

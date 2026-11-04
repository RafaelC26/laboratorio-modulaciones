export function LogoLaboratorio({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#141820" stroke="#2f3647" />
      <path d="M4 16c2.5-7 5-7 7.5 0s5 7 7.5 0 5-7 7.5 0" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 16c2.5-3.5 5-3.5 7.5 0s5 3.5 7.5 0 5-3.5 7.5 0" fill="none" stroke="#4f8cff" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

// A small hibiscus flower, reused as an accent and as a separator.
export function Hibiscus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <g fill="#BE3A34">
        <ellipse cx="12" cy="6.5" rx="3.3" ry="5" />
        <ellipse cx="12" cy="6.5" rx="3.3" ry="5" transform="rotate(72 12 12)" />
        <ellipse cx="12" cy="6.5" rx="3.3" ry="5" transform="rotate(144 12 12)" />
        <ellipse cx="12" cy="6.5" rx="3.3" ry="5" transform="rotate(216 12 12)" />
        <ellipse cx="12" cy="6.5" rx="3.3" ry="5" transform="rotate(288 12 12)" />
      </g>
      <circle cx="12" cy="12" r="2.4" fill="#F5EFE3" />
      <circle cx="12" cy="12" r="1.1" fill="#E0A312" />
    </svg>
  );
}

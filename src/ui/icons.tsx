import * as React from 'react';

// Safe fallback: renders a bullet, never crashes.
export function Icon({ className, size = 18 }: { className?: string; size?: number }) {
  return (
    <span
      className={className}
      aria-hidden
      style={{ display: 'inline-block', width: size, height: size, lineHeight: `${size}px`, textAlign: 'center' }}
    >
      •
    </span>
  );
}
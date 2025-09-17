import * as React from 'react';
import * as L from 'lucide-react';

type IconName =
  | 'ClipboardList' | 'Route' | 'FileSignature' | 'Wallet' | 'HeartPulse'
  | 'Percent' | 'ScrollText' | 'PackageSearch' | 'MapPin' | 'CreditCard';

export function Icon({
  name,
  size = 18,
  strokeWidth = 2,
  className,
}: {
  name?: IconName; // name is optional so we can still render harmlessly if omitted
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  // If name missing or not found, show a dot (never crash)
  const Cmp = name ? (L as any)[name] : null;
  if (!Cmp) return <span className={className} style={{ display: 'inline-block', width: size, height: size }}>•</span>;
  return <Cmp size={size} strokeWidth={strokeWidth} className={className} />;
}
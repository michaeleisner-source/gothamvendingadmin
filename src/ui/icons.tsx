import * as React from 'react';
import * as L from 'lucide-react';

// Usage: <Icon name="Truck" size={18} className="..." />
export function Icon({
  name,
  size = 18,
  strokeWidth = 2,
  className,
}: {
  name:
    | 'Truck' | 'Route' | 'FileSignature' | 'Wallet' | 'Activity'
    | 'Percent' | 'ScrollText' | 'PackageSearch' | 'MapPin' | 'CreditCard'
    | 'ClipboardList' | 'Navigation' | 'PiggyBank' | 'BarChart3' | 'HeartPulse';
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const Cmp = (L as any)[name] as React.ComponentType<any>;
  if (!Cmp) return <span className={className} style={{ display: 'inline-block', width: size, height: size }}>□</span>;
  return <Cmp size={size} strokeWidth={strokeWidth} className={className} />;
}
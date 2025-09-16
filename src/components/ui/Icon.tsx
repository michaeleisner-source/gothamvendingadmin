// src/components/ui/Icon.tsx
import * as L from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export function Icon({ name, size=18 }: { name: keyof typeof L, size?: number }) {
  const Cmp = L[name] as LucideIcon;
  if (!Cmp || typeof Cmp !== 'function') {
    return <L.Dot size={size} className="mr-2" />;
  }
  return <Cmp size={size} className="mr-2" />;
}
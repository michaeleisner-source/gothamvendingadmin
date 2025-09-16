// src/components/ui/Icon.tsx
import * as L from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export function Icon({ name, size=18 }: { name: string, size?: number }) {
  // Handle lucide: prefix
  const iconName = name.startsWith('lucide:') ? name.replace('lucide:', '') : name;
  
  // Convert kebab-case to PascalCase for Lucide icon names
  const pascalName = iconName.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('') as keyof typeof L;
  
  const Cmp = L[pascalName] as LucideIcon;
  if (!Cmp || typeof Cmp !== 'function') {
    return <L.Dot size={size} className="mr-2" />;
  }
  return <Cmp size={size} className="mr-2" />;
}
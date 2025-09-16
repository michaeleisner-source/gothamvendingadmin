// src/components/ui/Icon.tsx
import * as L from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 18, className = "mr-2" }: IconProps) {
  // Handle different icon prefixes
  if (name.startsWith('lucide:')) {
    const iconName = name.replace('lucide:', '');
    
    // Convert kebab-case to PascalCase for Lucide icon names
    const pascalName = iconName.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('') as keyof typeof L;
    
    const LucideIcon = L[pascalName] as LucideIcon;
    if (LucideIcon && typeof LucideIcon === 'function') {
      return <LucideIcon size={size} className={className} />;
    }
    
    // Fallback for unknown Lucide icons
    console.warn(`Lucide icon not found: ${iconName}`);
    return <L.Dot size={size} className={className} />;
  }
  
  // Handle Iconify icons (with prefixes like mdi:, material-symbols:, etc.)
  if (name.includes(':')) {
    return (
      <iconify-icon 
        icon={name} 
        width={size} 
        height={size} 
        className={className}
      />
    );
  }
  
  // Default fallback - treat as Lucide icon without prefix
  const pascalName = name.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('') as keyof typeof L;
  
  const LucideIcon = L[pascalName] as LucideIcon;
  if (LucideIcon && typeof LucideIcon === 'function') {
    return <LucideIcon size={size} className={className} />;
  }
  
  return <L.Dot size={size} className={className} />;
}
import { useEffect, useState } from 'react';

export type Theme = 'emerald' | 'sapphire';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('gv:theme');
    return (saved === 'emerald' || saved === 'sapphire') ? saved : 'emerald';
  });

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    
    // Persist to localStorage
    localStorage.setItem('gv:theme', theme);
    
    // Dispatch theme change event for other components
    window.dispatchEvent(new CustomEvent('gv:themeChange', { detail: { theme } }));
  }, [theme]);

  return { theme, setTheme };
}
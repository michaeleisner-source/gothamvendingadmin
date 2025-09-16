import { useEffect, useState } from 'react';

const THEMES = ['emerald','sapphire'] as const;
type Theme = typeof THEMES[number];

const getSaved = (): Theme => (localStorage.getItem('gv:theme') as Theme) || 'emerald';
const applyTheme = (t: Theme) => document.documentElement.setAttribute('data-theme', t);

export default function ThemeSwitcher(){
  const [theme, setTheme] = useState<Theme>(() => getSaved());

  useEffect(() => { applyTheme(theme); localStorage.setItem('gv:theme', theme); }, [theme]);

  const next = () => setTheme(t => (t === 'emerald' ? 'sapphire' : 'emerald'));

  return (
    <button className="btn" onClick={next} title={`Switch theme (${theme})`}>
      {theme === 'emerald' ? '🌿' : '💎'}
    </button>
  );
}
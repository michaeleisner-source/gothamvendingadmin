import { useEffect, useState } from 'react';

function isDemo() {
  const v = (import.meta as any).env?.VITE_PUBLIC_DEMO;
  if (v === '1' || v === 1 || v === true || v === 'true') return true;
  return localStorage.getItem('gv:demo') === '1';
}

export default function RedactionBadge() {
  const [demo, setDemo] = useState(isDemo());
  
  useEffect(() => { 
    document.documentElement.toggleAttribute('data-demo', demo); 
  }, [demo]);
  
  if (!demo) return null;
  
  return (
    <span 
      title="Demo Mode: some sensitive metrics may be redacted"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        borderRadius: 999,
        border: '1px solid #fbbf24',
        background: '#fff7cc',
        color: '#7c3f00',
        fontWeight: 700,
        fontSize: 12
      }}
    >
      DEMO / REDACTED
    </span>
  );
}
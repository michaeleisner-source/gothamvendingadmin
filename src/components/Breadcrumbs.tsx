import { useEffect, useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';

const pretty = (s:string) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const [override, setOverride] = useState<string | null>(null);

  // Allow pages to set a friendly last crumb:
  // window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: 'Machine M-001' }))
  useEffect(() => {
    const onSet = (e: Event) => setOverride((e as CustomEvent).detail || null);
    window.addEventListener('gv:breadcrumb:set', onSet as any);
    return () => window.removeEventListener('gv:breadcrumb:set', onSet as any);
  }, []);

  const parts = useMemo(() => {
    const segs = pathname.split('/').filter(Boolean);
    const items: { href: string; label: string }[] = [{ href: '#/', label: 'Home' }];
    let acc = '';
    segs.forEach((p, i) => {
      acc += '/' + p;
      items.push({ href: '#'+acc, label: i === segs.length - 1 && override ? override : pretty(p) });
    });
    return items;
  }, [pathname, override]);

  // 🔌 Update the hidden slot (for audits) + document.title
  useEffect(() => {
    const slot = document.getElementById('gv-breadcrumb-slot');
    const text = parts.map(p => p.label).join(' / ');
    if (slot) slot.textContent = text;
    document.title = text ? `${text} — Gotham Vending` : 'Gotham Vending';
  }, [parts]);

  return (
    <div style={{padding:'10px 16px', borderBottom:'1px solid var(--border)', background:'#fafafa'}}>
      <nav aria-label="Breadcrumb" style={{display:'flex', gap:6, flexWrap:'wrap'}}>
        {parts.map((p, i) => (
          <span key={p.href} style={{display:'inline-flex', alignItems:'center', gap:6}}>
            {i>0 && <span style={{color:'#94a3b8'}}>›</span>}
            {i < parts.length - 1
              ? <Link to={p.href} style={{textDecoration:'none', color:'#2563eb'}}>{p.label}</Link>
              : <span style={{fontWeight:700}}>{p.label}</span>}
          </span>
        ))}
      </nav>
      {/* Hidden text slot that audits read */}
      <div id="gv-breadcrumb-slot" style={{display:'none'}} aria-hidden />
    </div>
  );
}

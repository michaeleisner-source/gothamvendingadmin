import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Breadcrumbs() {
  const [path, setPath] = useState<string>(() => currentPath());

  useEffect(() => {
    const update = () => setPath(currentPath());
    update(); // initial
    window.addEventListener('hashchange', update);
    window.addEventListener('popstate', update);
    return () => {
      window.removeEventListener('hashchange', update);
      window.removeEventListener('popstate', update);
    };
  }, []);

  const [override, setOverride] = useState<string | null>(null);
  useEffect(() => {
    const onSet = (e: Event) => setOverride((e as CustomEvent).detail || null);
    window.addEventListener('gv:breadcrumb:set', onSet as any);
    return () => window.removeEventListener('gv:breadcrumb:set', onSet as any);
  }, []);

  const parts = useMemo(() => makeParts(path, override), [path, override]);

  useEffect(() => {
    const slot = document.getElementById('gv-breadcrumb-slot');
    const text = parts.map(p => p.label).join(' / ');
    if (slot) slot.textContent = text;
    document.title = text ? `${text} — Gotham Vending` : 'Gotham Vending';
  }, [parts]);

  return (
    <div style={{padding:'10px 16px', borderBottom:'1px solid #e5e7eb', background:'#fafafa'}}>
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
      <div id="gv-breadcrumb-slot" style={{position:'absolute', left:-9999, width:1, height:1}} aria-hidden />
    </div>
  );
}

/* helpers */
function currentPath(){ return location.hash.startsWith('#/') ? location.hash.slice(1) : location.pathname || '/'; }
function pretty(s:string){ return s.replace(/[-_]/g,' ').replace(/\b\w/g, c=>c.toUpperCase()); }
function makeParts(path:string, override:string|null){
  const segs = path.split('/').filter(Boolean);
  const items = [{ href: '/', label:'Home' }];
  let acc = '';
  segs.forEach((p, i) => {
    acc += '/' + p;
    items.push({ href: acc, label: i===segs.length-1 && override ? override : pretty(p) });
  });
  return items;
}
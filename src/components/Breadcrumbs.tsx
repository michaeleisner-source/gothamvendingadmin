import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Breadcrumbs() {
  const [path, setPath] = useState<string>(() => currentPath());
  useEffect(() => {
    const update = () => setPath(currentPath());
    update(); window.addEventListener('hashchange', update); window.addEventListener('popstate', update);
    return () => { window.removeEventListener('hashchange', update); window.removeEventListener('popstate', update); };
  }, []);
  const [override, setOverride] = useState<string | null>(null);
  useEffect(() => {
    const onSet = (e: Event) => setOverride((e as CustomEvent).detail || null);
    window.addEventListener('gv:breadcrumb:set', onSet as any);
    return () => window.removeEventListener('gv:breadcrumb:set', onSet as any);
  }, []);
  const parts = useMemo(() => makeParts(path, override), [path, override]);
  useEffect(() => {
    const text = parts.map(p => p.label).join(' / ');
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
    </div>
  );
}

function currentPath(){ return location.hash.startsWith('#/') ? location.hash.slice(1) : location.pathname || '/'; }
function pretty(s:string){ return s.replace(/[-_]/g,' ').replace(/\b\w/g, c=>c.toUpperCase()); }
function makeParts(path:string, override:string|null){
  const segs = path.split('/').filter(Boolean);
  const items = [{ href: '/', label:'Home' }];
  let acc = '';
  segs.forEach((p, i) => { acc += '/' + p; items.push({ href: acc, label: i===segs.length-1 && override ? override : pretty(p) }); });
  return items;
}
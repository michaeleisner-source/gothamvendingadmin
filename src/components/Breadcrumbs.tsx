import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Works with BOTH HashRouter and BrowserRouter.
 * - Listens to hashchange + popstate so it never misses a route change.
 * - Renders visible breadcrumbs.
 * - Updates hidden #gv-breadcrumb-slot (for audits) and document.title.
 */
export default function Breadcrumbs() {
  const [path, setPath] = useState<string>(() => getPath());

  useEffect(() => {
    const update = () => setPath(getPath());
    // initial + subsequent changes
    update();
    window.addEventListener('hashchange', update);
    window.addEventListener('popstate', update);
    return () => {
      window.removeEventListener('hashchange', update);
      window.removeEventListener('popstate', update);
    };
  }, []);

  // Optional dynamic override from pages:
  // window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: 'Machine M-001' }))
  const [override, setOverride] = useState<string | null>(null);
  useEffect(() => {
    const onSet = (e: Event) => setOverride((e as CustomEvent).detail || null);
    window.addEventListener('gv:breadcrumb:set', onSet as any);
    return () => window.removeEventListener('gv:breadcrumb:set', onSet as any);
  }, []);

  const parts = useMemo(() => makeParts(path, override), [path, override]);

  // Update the hidden slot + document.title on every render
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
      {/* Hidden text slot (audits read this). Keep it in DOM even if visually hidden. */}
      <div id="gv-breadcrumb-slot" style={{position:'absolute', left:-9999, top:'auto', width:1, height:1, overflow:'hidden'}} aria-hidden />
    </div>
  );
}

/* ---------- helpers ---------- */

function getPath(): string {
  const h = window.location.hash || '';
  if (h.startsWith('#/')) return h.slice(1);          // HashRouter → "/route"
  return window.location.pathname || '/';             // BrowserRouter → "/route"
}

function pretty(s: string) {
  return s.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function makeParts(path: string, override: string | null) {
  const segs = path.split('/').filter(Boolean);
  const items: { href: string; label: string }[] = [{ href: '/', label: 'Home' }];
  let acc = '';
  segs.forEach((p, i) => {
    acc += '/' + p;
    items.push({
      href: acc,                                    // Link "to" uses clean path, router will hash if needed
      label: i === segs.length - 1 && override ? override : pretty(p),
    });
  });
  return items;
}

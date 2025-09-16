import { useLocation, Link } from 'react-router-dom';
import { NAV } from '@/config/nav';
import { useEffect, useMemo, useState } from 'react';

const norm = (p:string)=> (p || '/').replace(/\/+$/,'') || '/';

function matchNav(path: string) {
  const n = norm(path);
  for (const sec of NAV) {
    for (const item of sec.items) {
      if (norm(item.path) === n) return { section: sec, item };
    }
  }
  // fallback: try prefix match for nested routes
  for (const sec of NAV) {
    for (const item of sec.items) {
      if (n.startsWith(norm(item.path) + '/')) return { section: sec, item };
    }
  }
  return null;
}

// Make "abc-123_coke-zero" → "Abc 123 Coke Zero"
const prettify = (slug: string) =>
  decodeURIComponent(slug)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, m => m.toUpperCase());

export default function Breadcrumbs() {
  const loc = useLocation();
  const path = norm(loc.pathname);

  // Optional dynamic override from pages: window.dispatchEvent(new CustomEvent('gv:pageTitle', { detail: { title: 'M-001 — Downtown' } }))
  const [override, setOverride] = useState<string | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { title?: string };
      if (detail?.title) setOverride(detail.title);
    };
    window.addEventListener('gv:pageTitle', handler);
    return () => window.removeEventListener('gv:pageTitle', handler);
  }, []);
  useEffect(() => { setOverride(null); }, [path]); // reset on route change

  const crumbs = useMemo(() => {
    const m = matchNav(path);
    const parts: { type:'link'|'text'; to?:string; label:string }[] = [];

    if (m) {
      const first = m.section.items[0]?.path || '/';
      parts.push({ type:'link', to:first, label:m.section.title });
      parts.push({ type:'link', to:m.item.path, label:m.item.label });

      // if deeper than base, add last segment (prettified or override)
      const base = norm(m.item.path);
      if (path.length > base.length) {
        const segs = path.split('/').filter(Boolean);
        const last = segs[segs.length - 1];
        parts.push({ type:'text', label: override || prettify(last) });
      }
    } else {
      parts.push({ type:'text', label:path });
    }
    return parts;
  }, [path, override]);

  // render breadcrumb into header slot for visual; keep an a11y copy hidden
  useEffect(() => {
    const slot = document.getElementById('gv-breadcrumb-slot');
    if (!slot) return;
    slot.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'gv-breadcrumb';
    el.innerHTML = crumbs.map((c, i) => {
      const sep = i ? `<span class="sep">›</span>` : '';
      if (c.type === 'link') return `${sep}<a href="${c.to}">${c.label}</a>`;
      return `${sep}<span class="current">${c.label}</span>`;
    }).join('');
    slot.appendChild(el);

    // also update document title for polish
    const title = crumbs.map(c => c.label).join(' • ');
    document.title = `${title} — Gotham Vending`;
  }, [crumbs]);

  // a11y breadcrumb (screen readers)
  return (
    <nav aria-label="Breadcrumb" className="sr-only">
      <ol>
        {crumbs.map((c, i) =>
          c.type === 'link'
            ? <li key={i}><Link to={c.to!}>{c.label}</Link></li>
            : <li key={i}>{c.label}</li>
        )}
      </ol>
    </nav>
  );
}

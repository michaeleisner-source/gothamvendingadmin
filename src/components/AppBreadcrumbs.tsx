import { useLocation, Link } from 'react-router-dom';
import { NAV, NavSection } from '@/config/nav';
import { useEffect } from 'react';

function matchNav(path: string) {
  const norm = (p:string)=> (p || '/').replace(/\/+$/,'') || '/';
  for (const sec of NAV) {
    for (const item of sec.items) {
      if (norm(item.path) === norm(path)) {
        return { section: sec, item };
      }
    }
  }
  return null;
}

export default function Breadcrumbs() {
  const loc = useLocation();
  const path = loc.pathname;
  const normPath = path.replace(/\/+$/,'') || '/';

  // push current breadcrumb into header slot (keeps header clean)
  useEffect(() => {
    const slot = document.getElementById('gv-breadcrumb-slot');
    if (!slot) return;
    const container = document.createElement('div');
    container.className = 'gv-breadcrumb';
    const matched = matchNav(normPath);

    const parts: string[] = [];
    if (matched) {
      const sectionFirst = matched.section.items[0]?.path || '/';
      parts.push(`<a href="${sectionFirst}">${matched.section.title}</a>`);
      parts.push(`<span class="sep">›</span>`);
      parts.push(`<a href="${matched.item.path}">${matched.item.label}</a>`);
      const segs = normPath.split('/').filter(Boolean);
      if (segs.length > 2) {
        parts.push(`<span class="sep">›</span>`);
        parts.push(`<span class="current">${decodeURIComponent(segs[segs.length - 1])}</span>`);
      }
    } else {
      parts.push(`<span class="current">${normPath}</span>`);
    }
    container.innerHTML = parts.join('');

    slot.innerHTML = '';
    slot.appendChild(container);
  }, [normPath]);

  // also render an accessible breadcrumb in-page
  const matched = matchNav(normPath);
  return (
    <nav aria-label="Breadcrumb" className="sr-only">
      {matched ? (
        <ol>
          <li><Link to={matched.section.items[0]?.path || '/'}>{matched.section.title}</Link></li>
          <li><Link to={matched.item.path}>{matched.item.label}</Link></li>
        </ol>
      ) : <span>{normPath}</span>}
    </nav>
  );
}
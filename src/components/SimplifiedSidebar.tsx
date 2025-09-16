import { NavLink, useLocation } from 'react-router-dom';
import { NAV, isDevEnv } from '@/config/nav';
import { useEffect, useState } from 'react';

const keyFor = (title: string) => `gv:navCollapsed:${title}`;

export default function SimplifiedSidebar() {
  const loc = useLocation();
  const currentPath = (loc.pathname.replace(/\/+$/,'') || '/') as string;
  const dev = isDevEnv();

  // read initial collapsed states
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const obj: Record<string, boolean> = {};
    NAV.forEach(sec => {
      const raw = localStorage.getItem(keyFor(sec.title));
      obj[sec.title] = raw === '1';
    });
    return obj;
  });

  useEffect(() => {
    // persist whenever changed
    Object.entries(collapsed).forEach(([title, val]) => {
      localStorage.setItem(keyFor(title), val ? '1' : '0');
    });
  }, [collapsed]);

  const toggle = (title: string) =>
    setCollapsed(s => ({ ...s, [title]: !s[title] }));

  return (
    <aside className="gv-sidebar">
      <div className="gv-brand">
        <div className="gv-badge">GV</div>
        <div className="gv-title">Gotham Vending</div>
      </div>

      <nav className="gv-nav">
        {NAV.map(section => {
          if (section.devOnly && !dev) return null;
          const isColl = !!collapsed[section.title];
          return (
            <div className={`gv-section ${isColl ? 'collapsed' : ''}`} key={section.title}>
              <div className="gv-section-header" onClick={() => toggle(section.title)}>
                <div className="gv-section-title">{section.title}</div>
                <div className="gv-section-toggle">{isColl ? '▸' : '▾'}</div>
              </div>

              {section.items.map(item => {
                if (item.devOnly && !dev) return null;
                const to = item.path.replace(/\/+$/,'') || '/';
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      'gv-nav-item' + (isActive || to === currentPath ? ' active' : '')
                    }
                  >
                    <span className="gv-icon">{item.icon ?? '•'}</span>
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
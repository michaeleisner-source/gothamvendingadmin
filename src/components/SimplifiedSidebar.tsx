import { NavLink, useLocation } from 'react-router-dom';
import { NAV, isDevEnv } from '@/config/nav';

export default function SimplifiedSidebar() {
  const loc = useLocation();
  const currentPath = loc.pathname.replace(/\/+$/,'') || '/';
  const dev = isDevEnv();

  return (
    <aside className="gv-sidebar">
      <div className="gv-brand">
        <div className="gv-badge">GV</div>
        <div className="gv-title">Gotham Vending</div>
      </div>

      <nav className="gv-nav">
        {NAV.map((section) => {
          if (section.devOnly && !dev) return null;
          return (
            <div className="gv-section" key={section.title}>
              <div className="gv-section-title">{section.title}</div>
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
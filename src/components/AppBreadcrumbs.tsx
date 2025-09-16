import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { findCurrentNavItem } from '@/config/navigation';

export function AppBreadcrumbs() {
  const location = useLocation();
  const currentNav = findCurrentNavItem(location.pathname);

  if (!currentNav) {
    // Fallback for unknown routes
    const pathSegments = location.pathname.split('/').filter(Boolean);
    return (
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Home className="size-4" />
        <ChevronRight className="size-4" />
        <span className="text-foreground capitalize">
          {pathSegments[pathSegments.length - 1] || 'Home'}
        </span>
      </nav>
    );
  }

  const { section, item } = currentNav;
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const isDetailPage = pathSegments.length > 2;

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
      {/* Home icon */}
      <Home className="size-4" />
      
      {/* Section link */}
      <ChevronRight className="size-4" />
      <Link 
        to={section.items[0]?.path || '/'} 
        className="hover:text-foreground transition-colors"
      >
        {section.title}
      </Link>
      
      {/* Current item */}
      <ChevronRight className="size-4" />
      <Link 
        to={item.path} 
        className={isDetailPage ? "hover:text-foreground transition-colors" : "text-foreground font-medium"}
      >
        {item.label}
      </Link>
      
      {/* Detail page indicator */}
      {isDetailPage && (
        <>
          <ChevronRight className="size-4" />
          <span className="text-foreground font-medium capitalize">
            {decodeURIComponent(pathSegments[pathSegments.length - 1])}
          </span>
        </>
      )}
    </nav>
  );
}
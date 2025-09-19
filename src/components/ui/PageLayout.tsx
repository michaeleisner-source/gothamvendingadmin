import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PageLayoutProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  badges?: Array<{ text: string; variant?: 'default' | 'secondary' | 'destructive' | 'outline' }>;
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({
  title,
  description,
  icon: Icon,
  actions,
  badges,
  children,
  className = ''
}: PageLayoutProps) {
  return (
    <div className={`section-spacing animate-fade-in container-mobile ${className}`}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            {Icon && (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="heading-mobile font-bold text-foreground truncate">{title}</h1>
              {badges && badges.length > 0 && (
                <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2 flex-wrap">
                  {badges.map((badge, index) => (
                    <Badge key={index} variant={badge.variant || 'default'} className="text-xs">
                      {badge.text}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          {description && (
            <p className="text-sm sm:text-base text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
            {actions}
          </div>
        )}
      </div>

      {/* Page Content */}
      <div className="section-spacing">
        {children}
      </div>
    </div>
  );
}
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
    <div className={`space-y-6 animate-fade-in ${className}`}>
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2">
            {Icon && (
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold text-foreground">{title}</h1>
              {badges && badges.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  {badges.map((badge, index) => (
                    <Badge key={index} variant={badge.variant || 'default'}>
                      {badge.text}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          {description && (
            <p className="text-base text-muted-foreground max-w-2xl">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Page Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}
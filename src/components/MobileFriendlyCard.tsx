import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MobileFriendlyCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
  compact?: boolean;
}

export function MobileFriendlyCard({ 
  title, 
  children, 
  className, 
  headerActions,
  compact = false 
}: MobileFriendlyCardProps) {
  return (
    <Card className={cn("card-hover", className)}>
      {title && (
        <CardHeader className={compact ? "pb-3" : "pb-4"}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-base sm:text-lg font-medium">{title}</CardTitle>
            {headerActions && (
              <div className="flex items-center gap-2">
                {headerActions}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn(
        "card-padding",
        title ? "" : "pt-4 sm:pt-6"
      )}>
        {children}
      </CardContent>
    </Card>
  );
}
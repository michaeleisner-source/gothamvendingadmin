import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, MoreHorizontal } from 'lucide-react';

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onExport?: () => void;
  actions?: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function ChartCard({
  title,
  description,
  children,
  onExport,
  actions,
  className = '',
  fullWidth = false
}: ChartCardProps) {
  return (
    <Card className={`card-hover ${fullWidth ? 'col-span-full' : ''} ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {description && (
            <CardDescription className="text-sm text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4" />
            </Button>
          )}
          {actions && actions}
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}
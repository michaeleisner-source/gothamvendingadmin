import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TableColumn {
  key: string;
  label: string;
  className?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface MobileOptimizedTableProps {
  data: any[];
  columns: TableColumn[];
  title?: string;
  actions?: React.ReactNode;
  onRowClick?: (row: any) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function MobileOptimizedTable({
  data,
  columns,
  title,
  actions,
  onRowClick,
  loading,
  emptyMessage = "No data available",
  className
}: MobileOptimizedTableProps) {
  if (loading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className="card-padding">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle>{title}</CardTitle>
              {actions}
            </div>
          </CardHeader>
        )}
        <CardContent className="card-padding">
          <div className="text-center py-8 text-muted-foreground">
            {emptyMessage}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
            {actions && (
              <div className="flex items-center gap-2 flex-wrap">
                {actions}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-4 py-3 text-left text-sm font-medium text-muted-foreground",
                      column.className
                    )}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr
                  key={index}
                  className={cn(
                    "border-b border-border/50 hover:bg-muted/50 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-sm">
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden divide-y">
          {data.map((row, index) => (
            <div
              key={index}
              className={cn(
                "p-4 space-y-3",
                onRowClick && "cursor-pointer hover:bg-muted/50 transition-colors"
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <div key={column.key} className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground min-w-0 flex-1">
                    {column.label}:
                  </span>
                  <span className="text-sm text-right min-w-0 flex-1">
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]
                    }
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
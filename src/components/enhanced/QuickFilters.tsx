import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, RefreshCw } from 'lucide-react';

interface QuickFiltersProps {
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  additionalFilters?: React.ReactNode;
  className?: string;
}

export function QuickFilters({
  timeRange = '30d',
  onTimeRangeChange,
  onRefresh,
  isLoading = false,
  additionalFilters,
  className = ''
}: QuickFiltersProps) {
  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
    { value: 'custom', label: 'Custom range' }
  ];

  return (
    <div className={`flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border ${className}`}>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select value={timeRange} onValueChange={onTimeRangeChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeRangeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {additionalFilters && (
        <div className="flex items-center gap-2 border-l pl-3 ml-1">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {additionalFilters}
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        {onRefresh && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        )}
      </div>
    </div>
  );
}
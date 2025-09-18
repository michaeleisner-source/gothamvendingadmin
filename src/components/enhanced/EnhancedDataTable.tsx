import React, { useState, useMemo } from "react";
import { Search, ChevronUp, ChevronDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface DataTableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

export interface DataTableAction<T> {
  label: string;
  onClick: (row: T) => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "default" | "destructive";
}

interface EnhancedDataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  actions?: DataTableAction<T>[];
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function EnhancedDataTable<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  searchPlaceholder = "Search...",
  searchFields = [],
  isLoading = false,
  emptyMessage = "No data available",
  className = "",
}: EnhancedDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm || searchFields.length === 0) return data;
    
    return data.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, searchFields]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (columnKey: string) => {
    setSortConfig((current) => {
      if (current?.key === columnKey) {
        if (current.direction === "asc") {
          return { key: columnKey, direction: "desc" };
        } else {
          return null; // Remove sorting
        }
      }
      return { key: columnKey, direction: "asc" };
    });
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig?.key !== columnKey) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {searchFields.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background"
              disabled
            />
          </div>
        )}
        <div className="rounded-lg border border-border bg-card">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      {searchFields.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {sortedData.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key.toString()}
                      className={`px-4 py-3 text-left text-sm font-medium text-muted-foreground ${
                        column.width || ""
                      }`}
                    >
                      {column.sortable ? (
                        <button
                          onClick={() => handleSort(column.key.toString())}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          {column.label}
                          {getSortIcon(column.key.toString())}
                        </button>
                      ) : (
                        column.label
                      )}
                    </th>
                  ))}
                  {actions.length > 0 && (
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-12">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedData.map((row, index) => (
                  <tr key={index} className="hover:bg-muted/30 transition-colors">
                    {columns.map((column) => (
                      <td key={column.key.toString()} className="px-4 py-3 text-sm">
                        {column.render
                          ? column.render(row[column.key], row)
                          : row[column.key] || "-"}
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actions.map((action, actionIndex) => (
                              <DropdownMenuItem
                                key={actionIndex}
                                onClick={() => action.onClick(row)}
                                className={
                                  action.variant === "destructive"
                                    ? "text-destructive focus:text-destructive"
                                    : ""
                                }
                              >
                                {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results info */}
      {sortedData.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {sortedData.length} of {data.length} results
          {searchTerm && ` for "${searchTerm}"`}
        </div>
      )}
    </div>
  );
}
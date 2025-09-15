import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

type QueryFunction<T> = () => Promise<T>;

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  queryKey: (string | number)[];
  queryFn: QueryFunction<T>;
  showErrorToast?: boolean;
  errorMessage?: string;
}

/**
 * Optimized query hook with built-in error handling and standardized patterns
 */
export function useOptimizedQuery<T>({
  queryKey,
  queryFn,
  showErrorToast = true,
  errorMessage = "Failed to load data",
  ...options
}: OptimizedQueryOptions<T>) {
  const { toast } = useToast();

  const result = useQuery({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if ((error as any)?.message?.includes('JWT')) return false;
      return failureCount < 2;
    },
    ...options,
  });

  // Handle errors with toast
  useEffect(() => {
    if (result.error && showErrorToast) {
      toast({
        title: "Error",
        description: `${errorMessage}: ${result.error.message}`,
        variant: "destructive",
      });
    }
  }, [result.error, showErrorToast, errorMessage, toast]);

  return result;
}

/**
 * Optimized Supabase query with consistent error handling
 */
export function useSupabaseQuery<T>(
  table: string,
  select: string = "*",
  filters: Array<{ column: string; operator: string; value: any }> = [],
  orderBy?: { column: string; ascending?: boolean },
  queryKey?: string[]
) {
  const baseKey = queryKey || [table, select, JSON.stringify(filters), JSON.stringify(orderBy)];
  
  return useOptimizedQuery({
    queryKey: baseKey,
    queryFn: async () => {
      let query = (supabase as any).from(table).select(select);
      
      // Apply filters
      filters.forEach(({ column, operator, value }) => {
        query = query.filter(column, operator, value);
      });
      
      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as T[];
    },
    errorMessage: `Failed to load ${table}`,
  });
}
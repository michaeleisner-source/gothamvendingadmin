import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ScopeProvider } from "@/context/Scope";
import AppRoutes from "@/components/AppRoutes";
import HelpBot from "@/components/HelpBot";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes for better caching
      gcTime: 1000 * 60 * 30, // 30 minutes cache time
      retry: (failureCount, error) => {
        // Don't retry on auth errors or network errors
        if (error?.message?.includes('JWT') || error?.message?.includes('network')) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      refetchOnMount: false, // Use cached data when available
    },
    mutations: {
      retry: 2,
    },
  },
});

export default function AppShell() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ScopeProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background">
              <Toaster />
              <AppRoutes />
              <HelpBot />
            </div>
          </TooltipProvider>
        </ScopeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
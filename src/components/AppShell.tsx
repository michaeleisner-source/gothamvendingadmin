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
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
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
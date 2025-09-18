import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
  console.log("AppShell component rendering!");
  
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div style={{padding: '20px', border: '2px solid red'}}>
            <h2>APPSHELL TEST</h2>
            <Toaster />
            <AppRoutes />
            <HelpBot />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error("Error in AppShell:", error);
    return <div>APPSHELL ERROR: {String(error)}</div>;
  }
}
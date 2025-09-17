import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "@/AppRoutes";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  useEffect(() => {
    // Initialize database tables if they don't exist
    const initializeDatabase = async () => {
      try {
        // Check if tables exist by trying to fetch from them
        const { error: prospectsError } = await supabase
          .from('prospects')
          .select('count')
          .limit(1);
        
        const { error: machinesError } = await supabase
          .from('machines')
          .select('count')
          .limit(1);

        const { error: locationsError } = await supabase
          .from('locations')
          .select('count')
          .limit(1);

        // Log initialization status
        console.log('Database initialization check:', {
          prospects: !prospectsError ? 'Connected' : 'Needs setup',
          machines: !machinesError ? 'Connected' : 'Needs setup',
          locations: !locationsError ? 'Connected' : 'Needs setup'
        });

      } catch (error) {
        console.log('Database initialization:', error);
      }
    };

    initializeDatabase();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
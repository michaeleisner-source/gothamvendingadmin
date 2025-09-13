import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import HomeDashboard from "./pages/HomeDashboard";
import Products from "./pages/Products";
import Machines from "./pages/Machines";
import DeliveryRoutes from "./pages/DeliveryRoutes";
import Picklists from "./pages/Picklists";
import Tickets from "./pages/Tickets";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomeDashboard />} />
            <Route path="/machines" element={<Machines />} />
            <Route path="/products" element={<Products />} />
            <Route path="/delivery-routes" element={<DeliveryRoutes />} />
            <Route path="/picklists" element={<Picklists />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/reports" element={<Reports />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

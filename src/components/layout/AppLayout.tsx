import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from '@/components/AppSidebar';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b bg-background">
            <SidebarTrigger className="ml-2" />
            <h1 className="ml-4 font-semibold">Gotham Vending</h1>
          </header>
          
          <Breadcrumbs />
          
          <main className="flex-1 p-4">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
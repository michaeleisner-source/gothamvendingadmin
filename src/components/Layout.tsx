import { useState } from "react";
import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { name: "Dashboard", path: "/" },
  { name: "Machines", path: "/machines" },
  { name: "Locations", path: "/locations" },
  { name: "Prospects", path: "/prospects" },
  { name: "Products", path: "/products" },
  { name: "Suppliers", path: "/suppliers" },
  { name: "Purchase Orders", path: "/purchase-orders" },
  { name: "Delivery Routes", path: "/delivery-routes" },
  { name: "Picklists", path: "/picklists" },
  { name: "Tickets", path: "/tickets" },
  { name: "Reports", path: "/reports" },
  { name: "Account", path: "/account" },
];

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 mr-3"
                aria-label="Open navigation menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="border-b p-6">
                <SheetTitle className="text-left text-xl font-bold">
                  Gotham Vending
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center min-h-[44px] px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.path)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          
          <h1 className="text-xl font-bold">Gotham Vending</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};
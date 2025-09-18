import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

// All searchable pages
const allPages = [
  // Dashboards
  { title: "Home Dashboard", url: "/", category: "Dashboard" },
  { title: "Enhanced Dashboard", url: "/enhanced-dashboard", category: "Dashboard" },
  
  // Sales
  { title: "Prospects", url: "/prospects", category: "Sales" },
  { title: "Prospect Dashboard", url: "/prospect-dashboard", category: "Sales" },
  { title: "Locations", url: "/locations", category: "Sales" },
  { title: "Locations Enhanced", url: "/locations-enhanced", category: "Sales" },
  { title: "Location Performance", url: "/location-performance", category: "Sales" },
  { title: "Sales Entry", url: "/sales", category: "Sales" },
  { title: "Sales Dashboard", url: "/sales/dashboard", category: "Sales" },
  
  // Operations
  { title: "Machines", url: "/machines", category: "Operations" },
  { title: "Machines Enhanced", url: "/machines-enhanced", category: "Operations" },
  { title: "Machine Setup", url: "/machine-setup", category: "Operations" },
  { title: "Route Planning", url: "/routes", category: "Operations" },
  { title: "Delivery Routes", url: "/delivery-routes", category: "Operations" },
  { title: "Driver Dashboard", url: "/driver", category: "Operations" },
  { title: "Daily Ops", url: "/daily-ops", category: "Operations" },
  { title: "Business Flow", url: "/business-flow", category: "Operations" },
  { title: "Cash Collection", url: "/cash-collection", category: "Operations" },
  
  // Maintenance
  { title: "Maintenance Scheduler", url: "/maintenance", category: "Maintenance" },
  { title: "Machine Maintenance", url: "/machine-maintenance", category: "Maintenance" },
  { title: "Maintenance Backlog", url: "/maintenance-backlog", category: "Maintenance" },
  { title: "Machine Health Monitor", url: "/machine-health", category: "Maintenance" },
  
  // Inventory
  { title: "Inventory", url: "/inventory", category: "Inventory" },
  { title: "Predictive Inventory", url: "/predictive-inventory", category: "Inventory" },
  { title: "Restock Entry", url: "/restock-entry", category: "Inventory" },
  
  // Catalog
  { title: "Products", url: "/products", category: "Catalog" },
  { title: "Products Enhanced", url: "/products-enhanced", category: "Catalog" },
  { title: "Suppliers", url: "/suppliers", category: "Catalog" },
  { title: "Suppliers Enhanced", url: "/suppliers-enhanced", category: "Catalog" },
  { title: "Supplier Management", url: "/supplier-management", category: "Catalog" },
  
  // Purchasing
  { title: "Purchase Orders", url: "/purchase-orders", category: "Purchasing" },
  
  // Financial
  { title: "Finance Management", url: "/finance", category: "Financial" },
  { title: "Commission Dashboard", url: "/commissions", category: "Financial" },
  { title: "Commission Statements", url: "/commission-statements", category: "Financial" },
  { title: "Cost Analysis", url: "/cost-analysis", category: "Financial" },
  { title: "Product Margins", url: "/product-margins", category: "Financial" },
  { title: "Profit Reports", url: "/profit-reports", category: "Financial" },
  { title: "Machine Finance", url: "/machine-finance", category: "Financial" },
  { title: "Machine ROI", url: "/machine-roi", category: "Financial" },
  { title: "Payment Processors", url: "/payment-processors", category: "Financial" },
  
  // Contracts
  { title: "Contract Management", url: "/contracts", category: "Contracts" },
  { title: "Insurance", url: "/insurance", category: "Contracts" },
  
  // Analytics
  { title: "Reports", url: "/reports", category: "Analytics" },
  { title: "Enhanced Reports", url: "/enhanced-reports", category: "Analytics" },
  { title: "Customer Analytics", url: "/customer-analytics", category: "Analytics" },
  { title: "Pipeline Analytics", url: "/pipeline-analytics", category: "Analytics" },
  
  // Admin
  { title: "Admin Billing", url: "/admin/billing", category: "Admin" },
  { title: "Admin Settings", url: "/admin/settings", category: "Admin" },
  { title: "Admin Users", url: "/admin/users", category: "Admin" },
  { title: "Staff", url: "/staff", category: "Admin" },
  { title: "Staff Enhanced", url: "/staff-enhanced", category: "Admin" },
  
  // Tools
  { title: "Exports", url: "/exports", category: "Tools" },
  { title: "Audit", url: "/audit", category: "Tools" },
  { title: "Deletion Logs", url: "/deletion-logs", category: "Tools" },
  { title: "Health", url: "/health", category: "Tools" },
  { title: "Help Center", url: "/help", category: "Tools" },
  { title: "Changelog", url: "/changelog", category: "Tools" },
  { title: "QA Launcher", url: "/qa-launcher", category: "Tools" },
  { title: "Picklists", url: "/picklists", category: "Tools" },
  { title: "Ops Console", url: "/ops/console", category: "Tools" },
  
  // Account
  { title: "Account", url: "/account", category: "Account" },
];

export function GlobalSearchBar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filteredPages = useMemo(() => {
    if (!search) return [];
    
    return allPages.filter(page =>
      page.title.toLowerCase().includes(search.toLowerCase()) ||
      page.category.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 8); // Limit results
  }, [search]);

  const handleSelect = (url: string) => {
    navigate(url);
    setOpen(false);
    setSearch("");
  };

  // Group results by category
  const groupedResults = useMemo(() => {
    const groups: Record<string, typeof allPages> = {};
    filteredPages.forEach(page => {
      if (!groups[page.category]) {
        groups[page.category] = [];
      }
      groups[page.category].push(page);
    });
    return groups;
  }, [filteredPages]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="w-64 justify-start text-muted-foreground hover:text-foreground hover:bg-accent border-input"
        >
          <Search className="h-4 w-4 mr-2" />
          Search pages...
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-popover border shadow-lg z-50" 
        align="start"
      >
        <Command className="bg-popover">
          <CommandInput 
            placeholder="Search pages..." 
            value={search}
            onValueChange={setSearch}
            className="border-0 bg-transparent"
          />
          <CommandList className="bg-popover">
            {search && filteredPages.length === 0 && (
              <CommandEmpty className="text-muted-foreground py-6 text-center text-sm">
                No pages found.
              </CommandEmpty>
            )}
            {Object.entries(groupedResults).map(([category, pages]) => (
              <CommandGroup key={category} heading={category} className="text-muted-foreground">
                {pages.map((page) => (
                  <CommandItem
                    key={page.url}
                    value={page.title}
                    onSelect={() => handleSelect(page.url)}
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  >
                    {page.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
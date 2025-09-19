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

// All searchable pages with aliases for better search matching
const allPages = [
  // Dashboards
  { title: "Home Dashboard", url: "/", category: "Dashboard", aliases: ["home", "main", "overview", "dashboard"] },
  { title: "Enhanced Dashboard", url: "/enhanced-dashboard", category: "Dashboard", aliases: ["enhanced", "advanced", "mission control"] },
  
  // Sales & Prospects
  { title: "Prospects", url: "/prospects", category: "Sales", aliases: ["prospects", "leads", "pipeline", "sales leads"] },
  { title: "Prospect Dashboard", url: "/prospect-dashboard", category: "Sales", aliases: ["prospect dashboard", "sales pipeline", "lead dashboard"] },
  { title: "Pipeline Analytics", url: "/pipeline-analytics", category: "Analytics", aliases: ["pipeline", "funnel", "conversion", "sales analytics"] },
  { title: "Locations", url: "/locations", category: "Sales", aliases: ["locations", "sites", "venues", "places"] },
  { title: "Locations Enhanced", url: "/locations-enhanced", category: "Sales", aliases: ["enhanced locations", "advanced locations"] },
  { title: "Location Performance", url: "/location-performance", category: "Sales", aliases: ["location performance", "site performance"] },
  { title: "Sales Entry", url: "/sales", category: "Sales", aliases: ["sales", "sales entry", "record sales", "transactions"] },
  { title: "Sales Dashboard", url: "/sales-dashboard", category: "Sales", aliases: ["sales dashboard", "sales overview"] },
  
  // Operations
  { title: "Machines", url: "/machines", category: "Operations", aliases: ["machines", "vending machines", "equipment"] },
  { title: "Machines Enhanced", url: "/machines-enhanced", category: "Operations", aliases: ["enhanced machines", "advanced machines"] },
  { title: "Machine Setup", url: "/machine-setup", category: "Operations", aliases: ["machine setup", "setup", "configuration"] },
  { title: "Route Planning", url: "/routes", category: "Operations", aliases: ["routes", "route planning", "routing"] },
  { title: "Delivery Routes", url: "/delivery-routes", category: "Operations", aliases: ["delivery", "delivery routes", "route delivery"] },
  { title: "Driver Dashboard", url: "/driver", category: "Operations", aliases: ["driver", "driver dashboard", "field"] },
  { title: "Daily Ops", url: "/daily-ops", category: "Operations", aliases: ["daily ops", "daily operations", "operations"] },
  { title: "Business Flow", url: "/business-flow", category: "Operations", aliases: ["business flow", "workflow", "process"] },
  { title: "Cash Collection", url: "/cash-collection", category: "Operations", aliases: ["cash", "cash collection", "collections"] },
  
  // Maintenance
  { title: "Maintenance Scheduler", url: "/maintenance", category: "Maintenance", aliases: ["maintenance", "scheduler", "service"] },
  { title: "Machine Maintenance", url: "/machine-maintenance", category: "Maintenance", aliases: ["machine maintenance", "repairs"] },
  { title: "Maintenance Backlog", url: "/maintenance-backlog", category: "Maintenance", aliases: ["backlog", "maintenance backlog"] },
  { title: "Machine Health Monitor", url: "/machine-health", category: "Maintenance", aliases: ["machine health", "health monitor", "monitoring"] },
  
  // Inventory
  { title: "Inventory", url: "/inventory", category: "Inventory", aliases: ["inventory", "stock", "products"] },
  { title: "Predictive Inventory", url: "/predictive-inventory", category: "Inventory", aliases: ["predictive", "forecasting", "prediction"] },
  { title: "Restock Entry", url: "/restock-entry", category: "Inventory", aliases: ["restock", "restocking", "refill"] },
  { title: "Low Stock Alerts", url: "/alerts/low-stock", category: "Inventory", aliases: ["low stock", "alerts", "stock alerts"] },
  
  // Catalog
  { title: "Products", url: "/products", category: "Catalog", aliases: ["products", "catalog", "items"] },
  { title: "Products Enhanced", url: "/products-enhanced", category: "Catalog", aliases: ["enhanced products", "advanced products"] },
  { title: "Product Catalog", url: "/catalog", category: "Catalog", aliases: ["catalog", "product catalog"] },
  { title: "Suppliers", url: "/suppliers", category: "Catalog", aliases: ["suppliers", "vendors", "partners"] },
  { title: "Suppliers Enhanced", url: "/suppliers-enhanced", category: "Catalog", aliases: ["enhanced suppliers", "advanced suppliers"] },
  { title: "Supplier Management", url: "/supplier-management", category: "Catalog", aliases: ["supplier management", "vendor management"] },
  
  // Purchasing
  { title: "Purchase Orders", url: "/purchase-orders", category: "Purchasing", aliases: ["purchase orders", "po", "orders", "purchasing"] },
  
  // Financial
  { title: "Finance Management", url: "/finance", category: "Financial", aliases: ["finance", "financial", "money", "accounting"] },
  { title: "Commission Dashboard", url: "/commissions", category: "Financial", aliases: ["commissions", "commission dashboard"] },
  { title: "Commission Statements", url: "/commission-statements", category: "Financial", aliases: ["commission statements", "statements"] },
  { title: "Cost Analysis", url: "/cost-analysis", category: "Financial", aliases: ["cost analysis", "costs", "analysis"] },
  { title: "Product Margins", url: "/product-margins", category: "Financial", aliases: ["margins", "product margins", "profitability"] },
  { title: "Profit Reports", url: "/profit-reports", category: "Financial", aliases: ["profit", "profit reports", "earnings"] },
  { title: "Machine Finance", url: "/machine-finance", category: "Financial", aliases: ["machine finance", "equipment finance"] },
  { title: "Machine ROI", url: "/machine-roi", category: "Financial", aliases: ["roi", "return on investment", "machine roi"] },
  { title: "Payment Processors", url: "/payment-processors", category: "Financial", aliases: ["payment", "processors", "payment processing"] },
  { title: "Cash Flow", url: "/finance/cash-flow", category: "Financial", aliases: ["cash flow", "cash", "flow"] },
  
  // Contracts & Insurance
  { title: "Contracts", url: "/contracts", category: "Legal", aliases: ["contracts", "contract", "agreements", "legal"] },
  { title: "Contract Management", url: "/contract-management", category: "Legal", aliases: ["contract management", "manage contracts"] },
  { title: "Insurance", url: "/insurance", category: "Legal", aliases: ["insurance", "coverage", "policies"] },
  
  // Analytics & Reports
  { title: "Reports Hub", url: "/reports", category: "Analytics", aliases: ["reports", "reporting", "analytics"] },
  { title: "Enhanced Reports", url: "/enhanced-reports", category: "Analytics", aliases: ["enhanced reports", "advanced reports"] },
  { title: "Customer Analytics", url: "/customer-analytics", category: "Analytics", aliases: ["customer", "customer analytics"] },
  { title: "Reports Hub", url: "/reports", category: "Analytics", aliases: ["reports hub", "report center"] },
  { title: "Advanced Analytics", url: "/advanced-analytics", category: "Analytics", aliases: ["advanced analytics", "deep analytics"] },
  
  // Customers
  { title: "Customers", url: "/customers", category: "CRM", aliases: ["customers", "clients", "crm"] },
  { title: "Customer Analytics", url: "/customer-analytics", category: "CRM", aliases: ["customer analytics", "customer insights"] },
  { title: "Customer Experience", url: "/customer-experience", category: "CRM", aliases: ["customer experience", "cx", "experience"] },
  { title: "Customer Insights", url: "/customer-insights", category: "CRM", aliases: ["customer insights", "insights"] },
  
  // Admin & Management
  { title: "Admin Settings", url: "/admin/settings", category: "Admin", aliases: ["admin", "settings", "configuration", "setup"] },
  { title: "Admin Users", url: "/admin/users", category: "Admin", aliases: ["users", "user management", "accounts"] },
  { title: "Admin Billing", url: "/admin/billing", category: "Admin", aliases: ["billing", "subscription", "payments"] },
  { title: "Staff", url: "/staff", category: "Admin", aliases: ["staff", "employees", "team"] },
  { title: "Staff Enhanced", url: "/staff-enhanced", category: "Admin", aliases: ["enhanced staff", "advanced staff"] },
  { title: "Staff Performance", url: "/staff-performance", category: "Admin", aliases: ["staff performance", "employee performance"] },
  
  // Tools & Utilities
  { title: "Data Exports", url: "/exports", category: "Tools", aliases: ["exports", "export", "download", "data"] },
  { title: "Audit Trail", url: "/audit", category: "Tools", aliases: ["audit", "audit trail", "logs"] },
  { title: "Deletion Logs", url: "/deletion-logs", category: "Tools", aliases: ["deletion logs", "deleted items"] },
  { title: "System Health", url: "/health", category: "Tools", aliases: ["health", "system health", "status"] },
  { title: "Help Center", url: "/help", category: "Tools", aliases: ["help", "support", "documentation"] },
  { title: "What's New", url: "/changelog", category: "Tools", aliases: ["changelog", "updates", "whats new"] },
  { title: "QA Launcher", url: "/qa-launcher", category: "Tools", aliases: ["qa", "quality assurance", "testing"] },
  { title: "Picklists", url: "/picklists", category: "Tools", aliases: ["picklists", "lists", "options"] },
  { title: "Ops Console", url: "/ops/console", category: "Tools", aliases: ["ops console", "console", "operations console"] },
  { title: "Document Processing", url: "/document-processing", category: "Tools", aliases: ["documents", "processing", "ai"] },
  { title: "Mobile Operations", url: "/mobile-operations", category: "Tools", aliases: ["mobile", "mobile ops"] },
  
  // Account & Profile
  { title: "My Account", url: "/account", category: "Account", aliases: ["account", "profile", "settings"] },
];

export function GlobalSearchBar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Debug: Log the total pages available
  console.log('GlobalSearchBar loaded with', allPages.length, 'pages');
  console.log('Sample contract entries:', allPages.filter(p => p.title.toLowerCase().includes('contract')));

  const filteredPages = useMemo(() => {
    if (!search) return [];
    
    const searchLower = search.toLowerCase().trim();
    console.log('Searching for:', searchLower);
    
    const results = allPages.filter(page => {
      // Check title
      if (page.title.toLowerCase().includes(searchLower)) {
        console.log('Title match:', page.title);
        return true;
      }
      
      // Check category
      if (page.category.toLowerCase().includes(searchLower)) {
        console.log('Category match:', page.title, 'category:', page.category);
        return true;
      }
      
      // Check aliases
      if (page.aliases?.some(alias => alias.toLowerCase().includes(searchLower))) {
        console.log('Alias match:', page.title, 'aliases:', page.aliases);
        return true;
      }
      
      // Check if search matches URL path
      if (page.url.toLowerCase().includes(searchLower)) {
        console.log('URL match:', page.title, 'url:', page.url);
        return true;
      }
      
      return false;
    }).slice(0, 12); // Show more results
    
    console.log('Total results:', results.length, results.map(r => r.title));
    return results;
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
          Search everything...
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-popover border shadow-lg z-50" 
        align="start"
      >
        <Command className="bg-popover">
          <CommandInput 
            placeholder="Search pages, contracts, data..." 
            value={search}
            onValueChange={setSearch}
            className="border-0 bg-transparent"
          />
          <CommandList className="bg-popover">
            {search && filteredPages.length === 0 && (
              <CommandEmpty className="text-muted-foreground py-6 text-center text-sm">
                No matches found. Try "contracts", "machines", "reports"...
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
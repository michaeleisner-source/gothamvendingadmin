import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Users, MapPin, Cog, Package, Truck, ShoppingCart, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const createItems = [
  { title: "New Prospect", url: "/prospects/new", icon: Users },
  { title: "New Location", url: "/locations/new", icon: MapPin },
  { title: "New Machine", url: "/machines/new", icon: Cog },
  { title: "New Product", url: "/products/new", icon: Package },
  { title: "New Supplier", url: "/suppliers", icon: Truck },
  { title: "New Purchase Order", url: "/purchase-orders/new", icon: ShoppingCart },
  { title: "New Contract", url: "/contracts/new", icon: FileText },
];

export function CreateButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="default" 
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-popover border shadow-lg z-50 p-1"
      >
        {createItems.map((item) => (
          <DropdownMenuItem key={item.title} asChild className="rounded-sm">
            <Link 
              to={item.url}
              className="flex items-center w-full px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <item.icon className="h-4 w-4 mr-3 text-muted-foreground" />
              {item.title}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
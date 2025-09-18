import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Users, MapPin, Cog, Package, Truck, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

const createItems = [
  { title: "New Prospect", url: "/prospects/new", icon: Users },
  { title: "New Location", url: "/locations/new", icon: MapPin },
  { title: "New Machine", url: "/machines/new", icon: Cog },
  { title: "New Product", url: "/products/new", icon: Package },
  { title: "New Supplier", url: "/suppliers/new", icon: Truck },
  { title: "New Purchase Order", url: "/purchase-orders/new", icon: ShoppingCart },
];

export function CreateButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-background border shadow-md z-50"
      >
        {createItems.map((item) => (
          <DropdownMenuItem key={item.title} asChild>
            <Link 
              to={item.url}
              className="flex items-center w-full px-3 py-2"
            >
              <item.icon className="h-4 w-4 mr-3" />
              {item.title}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
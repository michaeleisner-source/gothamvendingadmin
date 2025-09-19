import React from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Phone, Mail, Edit, Trash2, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocations } from "@/hooks/useSupabaseData";
import { EnhancedDataTable, DataTableColumn, DataTableAction } from "@/components/enhanced/EnhancedDataTable";
import { StatCard } from "@/components/enhanced/StatCard";
import { HelpTooltip, HelpTooltipProvider } from "@/components/ui/HelpTooltip";

export default function Locations() {
  const { data: locations = [], isLoading, error } = useLocations();

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">Error loading locations: {error.message}</p>
        </div>
      </div>
    );
  }

  // Define table columns
  const columns: DataTableColumn<any>[] = [
    {
      key: "name",
      label: "Location Name",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "location_type",
      label: "Type",
      sortable: true,
    },
    {
      key: "address",
      label: "Address",
      render: (value, row) => (
        <div className="text-sm">
          <div>{row.address_line1}</div>
          <div className="text-muted-foreground">
            {row.city}, {row.state} {row.postal_code}
          </div>
        </div>
      ),
    },
    {
      key: "contact_name",
      label: "Contact",
      render: (value, row) => (
        <div className="text-sm">
          {value && <div className="font-medium">{value}</div>}
          {row.contact_phone && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Phone className="h-3 w-3" />
              {row.contact_phone}
            </div>
          )}
          {row.contact_email && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Mail className="h-3 w-3" />
              {row.contact_email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === "active" 
            ? "bg-green-100 text-green-800" 
            : "bg-yellow-100 text-yellow-800"
        }`}>
          {value || "pending"}
        </span>
      ),
    },
  ];

  // Define table actions
  const actions: DataTableAction<any>[] = [
    {
      label: "View Details",
      onClick: (row) => window.location.href = `/locations/${row.id}`,
      icon: Eye,
    },
    {
      label: "Edit",
      onClick: (row) => console.log("Edit", row),
      icon: Edit,
    },
    {
      label: "Delete",
      onClick: (row) => console.log("Delete", row),
      icon: Trash2,
      variant: "destructive",
    },
  ];

  // Calculate stats
  const activeLocations = locations.filter(loc => loc.status === 'active');
  const pendingLocations = locations.filter(loc => loc.status === 'pending');
  
  const stats = {
    total: locations.length,
    active: activeLocations.length,
    pending: pendingLocations.length,
  };

  return (
    <HelpTooltipProvider>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
            <HelpTooltip content="Manage all your vending machine locations. Track location performance, contact information, and status. Use search to find locations by name, city, state, or contact person." />
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-sm">
              Manage your vending machine locations
            </p>
          </div>
        </div>
        <Link to="/locations/new">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </Link>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Locations"
          value={stats.total}
          icon={MapPin}
        />
        <StatCard
          title="Active Locations"
          value={stats.active}
          description={`${Math.round((stats.active / Math.max(stats.total, 1)) * 100)}% of total`}
        />
        <StatCard
          title="Pending Setup"
          value={stats.pending}
          description="Awaiting installation"
        />
        <StatCard
          title="Avg Revenue"
          value="$1,250"
          description="Per location/month"
        />
      </div>

      {/* Enhanced Data Table */}
      <EnhancedDataTable
        data={locations}
        columns={columns}
        actions={actions}
        searchPlaceholder="Search locations..."
        searchFields={["name", "city", "state", "contact_name"]}
        isLoading={isLoading}
        emptyMessage="No locations found. Add your first location to get started."
      />
    </div>
    </HelpTooltipProvider>
  );
}
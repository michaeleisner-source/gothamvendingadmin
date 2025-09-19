import React from "react";
import { Button } from "@/components/ui/button";
import { Settings, Plus, Monitor, Edit, Trash2, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useMachines } from "@/hooks/useSupabaseData";
import { EnhancedDataTable, DataTableColumn, DataTableAction } from "@/components/enhanced/EnhancedDataTable";
import { StatCard } from "@/components/enhanced/StatCard";
import { HelpTooltip, HelpTooltipProvider } from "@/components/ui/HelpTooltip";

export default function Machines() {
  const { data: machines = [], isLoading, error } = useMachines();

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">Error loading machines: {error.message}</p>
        </div>
      </div>
    );
  }

  // Define table columns
  const columns: DataTableColumn<any>[] = [
    {
      key: "name",
      label: "Machine Name",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-primary" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "location",
      label: "Location",
      render: (value, row) => (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span>{value?.name || "No location"}</span>
        </div>
      ),
    },
    {
      key: "model",
      label: "Model",
      sortable: true,
    },
    {
      key: "serial_number",
      label: "Serial Number",
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === "active" 
            ? "bg-green-100 text-green-800"
            : value === "maintenance"
            ? "bg-yellow-100 text-yellow-800" 
            : "bg-gray-100 text-gray-800"
        }`}>
          {value || "inactive"}
        </span>
      ),
    },
  ];

  // Define table actions
  const actions: DataTableAction<any>[] = [
    {
      label: "Edit",
      onClick: (row) => console.log("Edit machine", row),
      icon: Edit,
    },
    {
      label: "Delete",
      onClick: (row) => console.log("Delete machine", row),
      icon: Trash2,
      variant: "destructive",
    },
  ];

  // Calculate stats
  const stats = {
    total: machines.length,
    active: machines.filter(m => m.status === "active").length,
    maintenance: machines.filter(m => m.status === "maintenance").length,
    inactive: machines.filter(m => m.status === "inactive").length,
  };

  return (
    <HelpTooltipProvider>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Machines</h1>
            <HelpTooltip content="Manage your vending machine fleet. Monitor status, track performance, and manage machine configurations. Use the search to quickly find specific machines by name, model, or serial number." />
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-sm">
              Monitor and manage your vending machines
            </p>
          </div>
        </div>
        <Link to="/machines/new">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Machine
          </Button>
        </Link>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Machines"
          value={stats.total}
          icon={Settings}
        />
        <StatCard
          title="Active Machines"
          value={stats.active}
          description={`${Math.round((stats.active / Math.max(stats.total, 1)) * 100)}% operational`}
        />
        <StatCard
          title="Under Maintenance"
          value={stats.maintenance}
          description="Scheduled service"
        />
        <StatCard
          title="Inactive"
          value={stats.inactive}
          description="Need attention"
        />
      </div>

      {/* Enhanced Data Table */}
      <EnhancedDataTable
        data={machines}
        columns={columns}
        actions={actions}
        searchPlaceholder="Search machines..."
        searchFields={["name", "model", "serial_number"]}
        isLoading={isLoading}
        emptyMessage="No machines found. Add your first machine to get started."
      />
    </div>
    </HelpTooltipProvider>
  );
}
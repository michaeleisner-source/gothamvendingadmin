import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Monitor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocations, useCreateMachine } from "@/hooks/useSupabaseData";

type MachineFormData = {
  name: string;
  location_id: string;
  model: string;
  serial_number: string;
  status: string;
  notes: string;
};

const initialFormData: MachineFormData = {
  name: "",
  location_id: "",
  model: "",
  serial_number: "",
  status: "active",
  notes: "",
};

export default function NewMachine() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<MachineFormData>(initialFormData);
  
  const { data: locations = [], isLoading: locationsLoading } = useLocations();
  const createMachine = useCreateMachine();

  const handleInputChange = (field: keyof MachineFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.location_id) {
      toast({
        title: "Validation Error",
        description: "Please provide a machine name and select a location.",
        variant: "destructive",
      });
      return;
    }

    try {
      const machineData = {
        name: formData.name,
        location_id: formData.location_id,
        model: formData.model || null,
        serial_number: formData.serial_number || null,
        status: formData.status,
        notes: formData.notes || null,
      };

      await createMachine.mutateAsync(machineData);
      navigate("/machines");
    } catch (error: any) {
      // Error handling is done in the mutation
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            to="/machines" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Machines
          </Link>
        </div>
      </div>

      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="h-6 w-6" />
            Add New Machine
          </h1>
          <p className="text-muted-foreground mt-1">
            Add a new vending machine to your fleet
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <h3 className="font-medium text-sm">Basic Information</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Machine Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
                  placeholder="Main Lobby Machine"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Location *
                </label>
                <select
                  value={formData.location_id}
                  onChange={(e) => handleInputChange("location_id", e.target.value)}
                  className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
                  disabled={locationsLoading}
                >
                  <option value="">Select a location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Model
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleInputChange("model", e.target.value)}
                  className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
                  placeholder="VendMax 3000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) => handleInputChange("serial_number", e.target.value)}
                  className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
                  placeholder="VM3000-12345"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <h3 className="font-medium text-sm">Additional Notes</h3>
            
            <div>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
                placeholder="Any additional notes about this machine..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={createMachine.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {createMachine.isPending ? "Adding Machine..." : "Add Machine"}
            </button>
            
            <Link
              to="/machines"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
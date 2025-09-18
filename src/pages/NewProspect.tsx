import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ProspectFormData = {
  name: string;
  company: string;
  contact_name: string;
  email: string;
  phone: string;
  source: string;
  stage: string;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  notes: string;
};

const initialFormData: ProspectFormData = {
  name: "",
  company: "",
  contact_name: "",
  email: "",
  phone: "",
  source: "walk-in",
  stage: "new",
  address_line1: "",
  city: "",
  state: "",
  postal_code: "",
  notes: "",
};

export default function NewProspect() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProspectFormData>(initialFormData);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof ProspectFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name && !formData.company) {
      toast({
        title: "Validation Error",
        description: "Please provide either a business name or company name.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const prospectData = {
        business_name: formData.name || formData.company,
        contact_name: formData.contact_name || null,
        contact_email: formData.email || null,
        contact_phone: formData.phone || null,
        source: formData.source || null,
        status: formData.stage || "new",
        address_line1: formData.address_line1 || null,
        city: formData.city || null,
        state: formData.state || null,
        postal_code: formData.postal_code || null,
        notes: formData.notes || null,
      };

      const { data, error } = await supabase
        .from("leads")
        .insert({
          name: prospectData.business_name,
          company: formData.company || null,
          email: prospectData.contact_email,
          phone: prospectData.contact_phone,
          location_type: 'Office', // Required field
          address: prospectData.address_line1 || '',
          city: prospectData.city || '',
          state: prospectData.state || '',
          zip_code: prospectData.postal_code || '',
          contact_method: 'email', // Required field
          notes: prospectData.notes,
          estimated_foot_traffic: 0,
          status: prospectData.status,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Prospect added successfully!",
      });

      navigate(`/prospects/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add prospect",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            to="/prospects" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Prospects
          </Link>
        </div>
      </div>

      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Add New Prospect
          </h1>
          <p className="text-muted-foreground mt-1">
            Enter prospect information to start tracking in your sales pipeline
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Information */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <h3 className="font-medium text-sm">Business Information</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
                  placeholder="ABC Restaurant"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Company (if different)
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
                  placeholder="Parent company name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Source
              </label>
              <select
                value={formData.source}
                onChange={(e) => handleInputChange("source", e.target.value)}
                className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
              >
                <option value="walk-in">Walk-in</option>
                <option value="referral">Referral</option>
                <option value="web">Website</option>
                <option value="cold-call">Cold Call</option>
                <option value="marketing">Marketing</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <h3 className="font-medium text-sm">Contact Information</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Contact Name
              </label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={(e) => handleInputChange("contact_name", e.target.value)}
                className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
                placeholder="John Smith"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
                  placeholder="john@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <h3 className="font-medium text-sm">Location Information</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Address
              </label>
              <input
                type="text"
                value={formData.address_line1}
                onChange={(e) => handleInputChange("address_line1", e.target.value)}
                className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
                  placeholder="New York"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
                  placeholder="NY"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange("postal_code", e.target.value)}
                  className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
                  placeholder="10001"
                />
              </div>
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
                placeholder="Any additional notes about this prospect..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? "Adding Prospect..." : "Add Prospect"}
            </button>
            
            <Link
              to="/prospects"
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
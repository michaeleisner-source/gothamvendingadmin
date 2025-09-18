import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import { toastError, toastSuccess } from "@/components/useToast";

type Location = {
  id: string;
  name: string;
};

type Prospect = {
  id: string;
  business_name: string;
};

export default function NewContract() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "Vending Services Agreement",
    locationId: "",
    prospectId: "",
    revenueSharePct: "15",
    commissionFlatCents: "",
    termMonths: "12",
    autoRenew: true,
    cancellationNoticeDays: "30",
    status: "draft" as const
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [locationsRes, prospectsRes] = await Promise.all([
        supabase.from("locations").select("id, name").order("name"),
        supabase.from("prospects").select("id, business_name").order("business_name")
      ]);

      if (locationsRes.error) throw locationsRes.error;
      if (prospectsRes.error) throw prospectsRes.error;

      setLocations(locationsRes.data || []);
      setProspects(prospectsRes.data || []);
    } catch (error: any) {
      toastError("Failed to load data: " + error.message);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.locationId) {
      toastError("Please select a location");
      return;
    }

    setLoading(true);
    try {
      // Get current org
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (profileError) {
        // Try to get org from current_org function as fallback
        const { data: orgId, error: orgError } = await supabase.rpc("current_org");
        if (orgError) throw new Error("Could not determine organization");
        
        const selectedLocation = locations.find(l => l.id === formData.locationId);
        const basicHtml = `
          <div class="contract">
            <h1>${formData.title}</h1>
            <p><strong>Location:</strong> ${selectedLocation?.name || "TBD"}</p>
            <p><strong>Revenue Share:</strong> ${formData.revenueSharePct}%</p>
            <p><strong>Term:</strong> ${formData.termMonths} months</p>
            <p><strong>Auto Renew:</strong> ${formData.autoRenew ? "Yes" : "No"}</p>
            <p>This agreement outlines the terms for vending services.</p>
          </div>
        `;

        const contractData = {
          title: formData.title,
          location_id: formData.locationId,
          prospect_id: formData.prospectId || null,
          revenue_share_pct: parseFloat(formData.revenueSharePct) || null,
          commission_flat_cents: formData.commissionFlatCents ? parseInt(formData.commissionFlatCents) * 100 : null,
          term_months: parseInt(formData.termMonths) || 12,
          auto_renew: formData.autoRenew,
          cancellation_notice_days: parseInt(formData.cancellationNoticeDays) || 30,
          status: formData.status,
          body_html: basicHtml,
          org_id: orgId
        };

        const { data, error } = await supabase
          .from("contracts")
          .insert([contractData])
          .select()
          .single();

        if (error) throw error;

        toastSuccess("Contract created successfully");
        navigate(`/contract/${data.id}`);
        return;
      }

      const selectedLocation = locations.find(l => l.id === formData.locationId);
      const basicHtml = `
        <div class="contract">
          <h1>${formData.title}</h1>
          <p><strong>Location:</strong> ${selectedLocation?.name || "TBD"}</p>
          <p><strong>Revenue Share:</strong> ${formData.revenueSharePct}%</p>
          <p><strong>Term:</strong> ${formData.termMonths} months</p>
          <p><strong>Auto Renew:</strong> ${formData.autoRenew ? "Yes" : "No"}</p>
          <p>This agreement outlines the terms for vending services.</p>
        </div>
      `;

      const contractData = {
        title: formData.title,
        location_id: formData.locationId,
        prospect_id: formData.prospectId || null,
        revenue_share_pct: parseFloat(formData.revenueSharePct) || null,
        commission_flat_cents: formData.commissionFlatCents ? parseInt(formData.commissionFlatCents) * 100 : null,
        term_months: parseInt(formData.termMonths) || 12,
        auto_renew: formData.autoRenew,
        cancellation_notice_days: parseInt(formData.cancellationNoticeDays) || 30,
        status: formData.status,
        body_html: basicHtml,
        org_id: profile.org_id
      };

      const { data, error } = await supabase
        .from("contracts")
        .insert([contractData])
        .select()
        .single();

      if (error) throw error;

      toastSuccess("Contract created successfully");
      navigate(`/contract/${data.id}`);
    } catch (error: any) {
      toastError("Failed to create contract: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/contracts")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contracts
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Contract</h1>
          <p className="text-muted-foreground">Create a new vending services agreement</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contract Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Contract Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Select
                  value={formData.locationId}
                  onValueChange={(value) => setFormData({ ...formData, locationId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prospect">Related Prospect (Optional)</Label>
                <Select
                  value={formData.prospectId}
                  onValueChange={(value) => setFormData({ ...formData, prospectId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select prospect" />
                  </SelectTrigger>
                  <SelectContent>
                    {prospects.map((prospect) => (
                      <SelectItem key={prospect.id} value={prospect.id}>
                        {prospect.business_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="revenueShare">Revenue Share (%)</Label>
                <Input
                  id="revenueShare"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.revenueSharePct}
                  onChange={(e) => setFormData({ ...formData, revenueSharePct: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissionFlat">Flat Commission ($)</Label>
                <Input
                  id="commissionFlat"
                  type="number"
                  min="0"
                  value={formData.commissionFlatCents}
                  onChange={(e) => setFormData({ ...formData, commissionFlatCents: e.target.value })}
                  placeholder="Optional flat commission"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="termMonths">Term (Months)</Label>
                <Input
                  id="termMonths"
                  type="number"
                  min="1"
                  value={formData.termMonths}
                  onChange={(e) => setFormData({ ...formData, termMonths: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="noticeDays">Cancellation Notice (Days)</Label>
                <Input
                  id="noticeDays"
                  type="number"
                  min="1"
                  value={formData.cancellationNoticeDays}
                  onChange={(e) => setFormData({ ...formData, cancellationNoticeDays: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoRenew"
                checked={formData.autoRenew}
                onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="autoRenew">Auto-renew contract</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Creating..." : "Create Contract"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/contracts")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
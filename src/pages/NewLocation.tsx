import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LocationFormData {
  name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  traffic_daily_est: string;
  traffic_monthly_est: string;
  location_type_id: string;
}

const NewLocation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [locationTypes, setLocationTypes] = useState<any[]>([]);
  
  const fromProspectId = searchParams.get('from_prospect');
  
  const [formData, setFormData] = useState<LocationFormData>({
    name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    traffic_daily_est: "",
    traffic_monthly_est: "",
    location_type_id: ""
  });

  useEffect(() => {
    fetchLocationTypes();
    if (fromProspectId) {
      loadProspectData();
    }
  }, [fromProspectId]);

  const fetchLocationTypes = async () => {
    const { data, error } = await supabase
      .from("location_types")
      .select("*")
      .order("name");
    
    if (error) {
      console.error("Error fetching location types:", error);
    } else {
      setLocationTypes(data || []);
    }
  };

  const loadProspectData = async () => {
    if (!fromProspectId) return;
    
    try {
      const { data: lead, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", fromProspectId)
        .single();

      if (error) throw error;

      if (lead) {
        setFormData({
          name: lead.name || "",
          address_line1: lead.address || "",
          address_line2: "",
          city: lead.city || "",
          state: lead.state || "",
          postal_code: lead.zip_code || "",
          contact_name: lead.name || "",
          contact_email: lead.email || "",
          contact_phone: lead.phone || "",
          traffic_daily_est: lead.estimated_foot_traffic?.toString() || "",
          traffic_monthly_est: "",
          location_type_id: ""
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load prospect data: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Location name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const locationData: any = {
        name: formData.name.trim(),
        address_line1: formData.address_line1.trim() || null,
        address_line2: formData.address_line2.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        postal_code: formData.postal_code.trim() || null,
        contact_name: formData.contact_name.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        location_type_id: formData.location_type_id || null,
      };

      if (formData.traffic_daily_est) {
        locationData.traffic_daily_est = parseInt(formData.traffic_daily_est);
      }
      if (formData.traffic_monthly_est) {
        locationData.traffic_monthly_est = parseInt(formData.traffic_monthly_est);
      }

      if (fromProspectId) {
        locationData.from_prospect_id = fromProspectId;
      }

      const { data: location, error } = await supabase
        .from("locations")
        .insert(locationData)
        .select()
        .single();

      if (error) throw error;

      // If this came from a lead, update the lead status
      if (fromProspectId) {
        await supabase
          .from("leads")
          .update({ 
            status: "closed"
          })
          .eq("id", fromProspectId);
      }

      toast({
        title: "Success",
        description: "Location created successfully!",
      });

      navigate(`/locations/${location.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to create location: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof LocationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            {fromProspectId ? "Convert Prospect to Location" : "New Location"}
          </h1>
          <p className="text-muted-foreground">
            {fromProspectId 
              ? "Create a new location from prospect data" 
              : "Add a new business location to your network"
            }
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Location Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="e.g., Downtown Office Building"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="location_type">Location Type</Label>
                <Select value={formData.location_type_id} onValueChange={(value) => updateFormData("location_type_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location type" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="address_line1">Address</Label>
              <Input
                id="address_line1"
                value={formData.address_line1}
                onChange={(e) => updateFormData("address_line1", e.target.value)}
                placeholder="Street address"
              />
            </div>

            <div>
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                value={formData.address_line2}
                onChange={(e) => updateFormData("address_line2", e.target.value)}
                placeholder="Suite, unit, etc. (optional)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateFormData("city", e.target.value)}
                  placeholder="City"
                />
              </div>
              
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => updateFormData("state", e.target.value)}
                  placeholder="State"
                />
              </div>
              
              <div>
                <Label htmlFor="postal_code">ZIP Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => updateFormData("postal_code", e.target.value)}
                  placeholder="ZIP code"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="traffic_daily_est">Daily Traffic (Est.)</Label>
                <Input
                  id="traffic_daily_est"
                  type="number"
                  value={formData.traffic_daily_est}
                  onChange={(e) => updateFormData("traffic_daily_est", e.target.value)}
                  placeholder="Estimated daily foot traffic"
                />
              </div>
              
              <div>
                <Label htmlFor="traffic_monthly_est">Monthly Traffic (Est.)</Label>
                <Input
                  id="traffic_monthly_est"
                  type="number"
                  value={formData.traffic_monthly_est}
                  onChange={(e) => updateFormData("traffic_monthly_est", e.target.value)}
                  placeholder="Estimated monthly foot traffic"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => updateFormData("contact_name", e.target.value)}
                  placeholder="Site contact person"
                />
              </div>
              
              <div>
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => updateFormData("contact_email", e.target.value)}
                  placeholder="contact@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => updateFormData("contact_phone", e.target.value)}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading || !formData.name.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                {loading ? "Creating..." : "Create Location"}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default NewLocation;
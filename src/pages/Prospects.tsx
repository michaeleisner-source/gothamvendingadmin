import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

type LocationType = {
  id: string;
  name: string;
};

type Prospect = {
  id: string;
  business_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  location_type_id: string | null;
  traffic_daily_est: number | null;
  traffic_monthly_est: number | null;
  status: string;
  created_at: string;
  location_types?: { name: string } | null;
};

const statusOptions = ["NEW", "CONTACTED", "FOLLOW-UP", "CLOSED", "CONVERTED"];

const Prospects = () => {
  const navigate = useNavigate();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [locationTypes, setLocationTypes] = useState<LocationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [savingType, setSavingType] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    business_name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    location_type_id: "",
    traffic_daily_est: "",
    traffic_monthly_est: "",
    status: "NEW",
  });
  const { toast } = useToast();

  const fetchLocationTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("location_types")
        .select("*")
        .order("name", { ascending: true });
      
      if (error) throw error;
      setLocationTypes(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load location types: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const fetchProspects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("prospects")
        .select(`
          *,
          location_types (
            name
          )
        `)
        .order("business_name", { ascending: true });

      if (error) throw error;
      setProspects(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load prospects: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocationTypes();
    fetchProspects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.business_name.trim()) {
      toast({
        title: "Error", 
        description: "Business name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from("prospects")
        .insert([{
          business_name: formData.business_name.trim(),
          contact_name: formData.contact_name.trim() || null,
          contact_email: formData.contact_email.trim() || null,
          contact_phone: formData.contact_phone.trim() || null,
          address_line1: formData.address_line1.trim() || null,
          address_line2: formData.address_line2.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          postal_code: formData.postal_code.trim() || null,
          location_type_id: formData.location_type_id || null,
          traffic_daily_est: formData.traffic_daily_est ? Number(formData.traffic_daily_est) : null,
          traffic_monthly_est: formData.traffic_monthly_est ? Number(formData.traffic_monthly_est) : null,
          status: formData.status,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Prospect created successfully",
      });

      // Reset form
      setFormData({
        business_name: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        location_type_id: "",
        traffic_daily_est: "",
        traffic_monthly_est: "",
        status: "NEW",
      });

      // Refresh prospects
      fetchProspects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to create prospect: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddLocationType = async () => {
    if (!newTypeName.trim()) {
      toast({
        title: "Error",
        description: "Location type name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingType(true);
      const { error } = await supabase
        .from("location_types")
        .insert([{ name: newTypeName.trim() }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Location type added successfully",
      });

      setNewTypeName("");
      setModalOpen(false);
      fetchLocationTypes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to add location type: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSavingType(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleConvertToLocation = async (prospectId: string) => {
    try {
      setConverting(prospectId);
      
      const { data: newLocationId, error } = await supabase
        .rpc('convert_prospect_to_location', { p_prospect_id: prospectId });

      if (error) throw error;

      if (newLocationId) {
        toast({
          title: "Success",
          description: "Converted to Location",
        });
        
        // Navigate to the new location page
        navigate(`/locations/${newLocationId}`);
      } else {
        throw new Error("No location ID returned from conversion");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to convert prospect: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setConverting(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Prospects</h1>
        
        {/* Create New Prospect Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Prospect</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name *</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    placeholder="Enter business name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="Enter contact name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="Enter contact email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="Enter contact phone"
                  />
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address_line1">Address Line 1</Label>
                    <Input
                      id="address_line1"
                      value={formData.address_line1}
                      onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                      placeholder="Street address"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address_line2">Address Line 2</Label>
                    <Input
                      id="address_line2"
                      value={formData.address_line2}
                      onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                      placeholder="Apartment, suite, etc."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Enter city"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="Enter state"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      placeholder="Enter postal code"
                    />
                  </div>
                </div>
              </div>

              {/* Business Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Business Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location_type">Location Type</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.location_type_id}
                        onValueChange={(value) => setFormData({ ...formData, location_type_id: value })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select location type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {locationTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="sm" className="shrink-0">
                            <Plus className="h-4 w-4" />
                            Type
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white">
                          <DialogHeader>
                            <DialogTitle>Add Location Type</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="type_name">Name</Label>
                              <Input
                                id="type_name"
                                value={newTypeName}
                                onChange={(e) => setNewTypeName(e.target.value)}
                                placeholder="Enter location type name"
                                onKeyDown={(e) => e.key === "Enter" && handleAddLocationType()}
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                                Cancel
                              </Button>
                              <Button 
                                type="button" 
                                onClick={handleAddLocationType} 
                                disabled={savingType}
                              >
                                {savingType ? "Saving..." : "Save"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="traffic_daily_est">Daily Traffic Est</Label>
                    <Input
                      id="traffic_daily_est"
                      type="number"
                      min="0"
                      value={formData.traffic_daily_est}
                      onChange={(e) => setFormData({ ...formData, traffic_daily_est: e.target.value })}
                      placeholder="Enter daily traffic estimate"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="traffic_monthly_est">Monthly Traffic Est</Label>
                    <Input
                      id="traffic_monthly_est"
                      type="number"
                      min="0"
                      value={formData.traffic_monthly_est}
                      onChange={(e) => setFormData({ ...formData, traffic_monthly_est: e.target.value })}
                      placeholder="Enter monthly traffic estimate"
                    />
                  </div>
                </div>
              </div>
              
              <Button type="submit" disabled={saving} className="w-full md:w-auto">
                {saving ? "Creating..." : "Create Prospect"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Prospects Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Prospects</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading prospects...</div>
              </div>
            ) : prospects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No prospects found.</p>
                <p className="text-xs text-muted-foreground mt-1">Create your first prospect using the form above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business Name</TableHead>
                      <TableHead>Contact Name</TableHead>
                      <TableHead>Location Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Daily Est</TableHead>
                      <TableHead>Monthly Est</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prospects.map((prospect) => (
                      <TableRow key={prospect.id}>
                        <TableCell className="font-medium">
                          {prospect.business_name}
                        </TableCell>
                        <TableCell>
                          {prospect.contact_name || "-"}
                        </TableCell>
                        <TableCell>
                          {prospect.location_types?.name || "-"}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            prospect.status === "NEW" 
                              ? "bg-blue-100 text-blue-800"
                              : prospect.status === "CONTACTED"
                              ? "bg-yellow-100 text-yellow-800" 
                              : prospect.status === "FOLLOW-UP"
                              ? "bg-orange-100 text-orange-800"
                              : prospect.status === "CONVERTED"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {prospect.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {prospect.traffic_daily_est ? prospect.traffic_daily_est.toLocaleString() : "-"}
                        </TableCell>
                        <TableCell>
                          {prospect.traffic_monthly_est ? prospect.traffic_monthly_est.toLocaleString() : "-"}
                        </TableCell>
                        <TableCell>
                          {formatDate(prospect.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConvertToLocation(prospect.id)}
                            disabled={prospect.status === 'CONVERTED' || converting === prospect.id}
                          >
                            {converting === prospect.id ? "Converting..." : "Convert to Location"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Prospects;
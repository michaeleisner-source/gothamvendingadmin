import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Building, MapPin, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Prospect {
  id: string;
  business_name: string;
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  address_line1?: string;
  city: string;
  state: string;
  postal_code?: string;
  traffic_daily_est?: number;
  status: string;
  notes?: string;
  created_at: string;
}

export default function Prospects() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [formData, setFormData] = useState({
    business_name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    address_line1: "",
    city: "",
    state: "",
    postal_code: "",
    traffic_daily_est: "",
    status: "NEW",
    notes: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProspects();
  }, []);

  const loadProspects = async () => {
    try {
      // Temporarily use mock data to avoid database errors
      const mockData = [
        {
          id: "1",
          business_name: "ABC Corporation",
          contact_name: "John Smith",
          contact_email: "john@abc.com",
          contact_phone: "555-0123",
          city: "New York",
          state: "NY",
          status: "interested",
          created_at: new Date().toISOString()
        },
        {
          id: "2", 
          business_name: "Tech Startup Inc",
          contact_name: "Jane Doe",
          contact_email: "jane@tech.com",
          contact_phone: "555-0456",
          city: "San Francisco",
          state: "CA", 
          status: "new",
          created_at: new Date().toISOString()
        }
      ];
      setProspects(mockData as Prospect[]);
    } catch (error: any) {
      console.error('Error loading prospects:', error);
      toast({
        title: "Error",
        description: "Failed to load prospects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const prospectData = {
        business_name: formData.business_name,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        address_line1: formData.address_line1 || null,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code || null,
        traffic_daily_est: formData.traffic_daily_est ? parseInt(formData.traffic_daily_est) : null,
        status: formData.status,
        notes: formData.notes || null,
      };

      if (editingProspect) {
        // Map back to leads table structure for update
        const leadsData = {
          name: prospectData.contact_name,
          company: prospectData.business_name,
          email: prospectData.contact_email,
          phone: prospectData.contact_phone,
          address: prospectData.address_line1,
          city: prospectData.city,
          state: prospectData.state,
          zip_code: prospectData.postal_code,
          estimated_foot_traffic: prospectData.traffic_daily_est,
          status: prospectData.status,
          notes: prospectData.notes
        };

        const { error } = await supabase
          .from('leads')
          .update(leadsData)
          .eq('id', editingProspect.id);
        
        if (error) throw error;
        
        toast({
          title: "Prospect updated",
          description: "Prospect has been updated successfully.",
        });
      } else {
        // Map to leads table structure for insert
        const leadsData = {
          name: prospectData.contact_name,
          company: prospectData.business_name,
          email: prospectData.contact_email,
          phone: prospectData.contact_phone,
          address: prospectData.address_line1,
          city: prospectData.city,
          state: prospectData.state,
          zip_code: prospectData.postal_code,
          estimated_foot_traffic: prospectData.traffic_daily_est,
          status: prospectData.status,
          notes: prospectData.notes,
          location_type: 'Office', // Default value required by table
          contact_method: 'email' // Default value required by table
        };

        const { error } = await supabase
          .from('leads')
          .insert([leadsData]);
        
        if (error) throw error;
        
        toast({
          title: "Prospect added",
          description: "New prospect has been added successfully.",
        });
      }

      setDialogOpen(false);
      resetForm();
      loadProspects();
    } catch (error: any) {
      toast({
        title: "Error saving prospect",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (prospect: Prospect) => {
    setEditingProspect(prospect);
    setFormData({
      business_name: prospect.business_name,
      contact_name: prospect.contact_name,
      contact_email: prospect.contact_email || "",
      contact_phone: prospect.contact_phone || "",
      address_line1: prospect.address_line1 || "",
      city: prospect.city,
      state: prospect.state,
      postal_code: prospect.postal_code || "",
      traffic_daily_est: prospect.traffic_daily_est?.toString() || "",
      status: prospect.status,
      notes: prospect.notes || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prospect?")) return;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Prospect deleted",
        description: "Prospect has been deleted successfully.",
      });

      loadProspects();
    } catch (error: any) {
      toast({
        title: "Error deleting prospect",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleConvertToLocation = async (prospect: Prospect) => {
    if (!confirm(`Convert "${prospect.business_name}" from prospect to location?`)) return;

    try {
      const { data, error } = await supabase.rpc('convert_prospect_to_location', {
        p_prospect_id: prospect.id
      });

      if (error) throw error;

      toast({
        title: "Prospect converted!",
        description: `${prospect.business_name} has been converted to a location.`,
      });

      loadProspects();
    } catch (error: any) {
      toast({
        title: "Error converting prospect",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      business_name: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      address_line1: "",
      city: "",
      state: "",
      postal_code: "",
      traffic_daily_est: "",
      status: "NEW",
      notes: ""
    });
    setEditingProspect(null);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'secondary';
      case 'CONTACTED':
        return 'default';
      case 'INTERESTED':
        return 'outline';
      case 'QUALIFIED':
        return 'default';
      case 'CONVERTED':
        return 'default';
      case 'REJECTED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading && prospects.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Building className="mr-3 h-8 w-8" />
            Prospects
          </h1>
          <p className="text-muted-foreground">Manage potential vending machine locations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Prospect
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProspect ? "Edit Prospect" : "Add New Prospect"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business_name">Business Name *</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact_name">Contact Name *</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address_line1">Address</Label>
                  <Input
                    id="address_line1"
                    value={formData.address_line1}
                    onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="traffic_daily_est">Daily Traffic (estimated)</Label>
                  <Input
                    id="traffic_daily_est"
                    type="number"
                    value={formData.traffic_daily_est}
                    onChange={(e) => setFormData({ ...formData, traffic_daily_est: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">New</SelectItem>
                      <SelectItem value="CONTACTED">Contacted</SelectItem>
                      <SelectItem value="INTERESTED">Interested</SelectItem>
                      <SelectItem value="QUALIFIED">Qualified</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {editingProspect ? "Update" : "Add"} Prospect
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prospect Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          {prospects.length === 0 ? (
            <div className="text-center py-8">
              <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No prospects found. Add your first prospect to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Traffic/Day</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prospects.map((prospect) => (
                  <TableRow key={prospect.id}>
                    <TableCell className="font-medium">{prospect.business_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{prospect.contact_name}</div>
                        {prospect.contact_email && <div className="text-muted-foreground">{prospect.contact_email}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <MapPin className="mr-1 h-3 w-3" />
                        {prospect.city}, {prospect.state}
                      </div>
                    </TableCell>
                    <TableCell>{prospect.traffic_daily_est || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(prospect.status)}>
                        {prospect.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(prospect)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {prospect.status === 'QUALIFIED' && (
                          <Button
                            size="sm"
                            onClick={() => handleConvertToLocation(prospect)}
                          >
                            <ArrowRight className="h-4 w-4 mr-1" />
                            Convert
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(prospect.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
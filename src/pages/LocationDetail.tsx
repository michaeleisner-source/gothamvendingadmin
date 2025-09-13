import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Phone, Mail, Users, Building } from "lucide-react";

type Location = {
  id: string;
  name: string;
  location_type_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  traffic_daily_est: number | null;
  traffic_monthly_est: number | null;
  from_prospect_id: string | null;
  created_at: string;
  location_types?: { name: string } | null;
};

type Machine = {
  id: string;
  name: string;
  status: string;
  location_id: string | null;
  created_at: string;
};

const LocationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useState<Location | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [machinesLoading, setMachinesLoading] = useState(true);
  const { toast } = useToast();

  const fetchLocation = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("locations")
        .select(`
          *,
          location_types (
            name
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast({
          title: "Error",
          description: "Location not found",
          variant: "destructive",
        });
        return;
      }
      
      setLocation(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load location: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMachines = async () => {
    if (!id) return;
    
    try {
      setMachinesLoading(true);
      const { data, error } = await supabase
        .from("machines")
        .select("*")
        .eq("location_id", id)
        .order("name", { ascending: true });

      if (error) throw error;
      setMachines(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load machines: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setMachinesLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
    fetchMachines();
  }, [id]);

  const formatAddress = () => {
    if (!location) return null;
    
    const parts = [];
    if (location.address_line1) parts.push(location.address_line1);
    if (location.address_line2) parts.push(location.address_line2);
    
    const cityStateZip = [];
    if (location.city) cityStateZip.push(location.city);
    if (location.state) cityStateZip.push(location.state);
    if (location.postal_code) cityStateZip.push(location.postal_code);
    
    if (cityStateZip.length > 0) {
      parts.push(cityStateZip.join(", "));
    }
    
    return parts.length > 0 ? parts : null;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ONLINE":
        return "bg-green-100 text-green-800";
      case "OFFLINE":
        return "bg-red-100 text-red-800";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center py-8">
          <div className="text-sm text-muted-foreground">Loading location...</div>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Location not found.</p>
          <Link to="/locations" className="text-primary hover:underline mt-2 inline-block">
            Back to Locations
          </Link>
        </div>
      </div>
    );
  }

  const addressParts = formatAddress();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/locations">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{location.name}</h1>
            {location.from_prospect_id && (
              <Badge variant="secondary" className="mt-1">
                Converted from Prospect
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Location Type</Label>
                <p className="text-sm">{location.location_types?.name || "Not specified"}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Daily Traffic</Label>
                <p className="text-sm">{location.traffic_daily_est?.toLocaleString() || "Not specified"}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Monthly Traffic</Label>
                <p className="text-sm">{location.traffic_monthly_est?.toLocaleString() || "Not specified"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Contact Name</Label>
                <p className="text-sm">{location.contact_name || "Not specified"}</p>
              </div>
              
              {location.contact_email && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`mailto:${location.contact_email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {location.contact_email}
                    </a>
                  </div>
                </div>
              )}
              
              {location.contact_phone && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`tel:${location.contact_phone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {location.contact_phone}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Address */}
          {addressParts && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {addressParts.map((part, index) => (
                    <p key={index} className="text-sm">{part}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Machines Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Machines at this Location</CardTitle>
              <Link to={`/machines?assignTo=${location.id}`}>
                <Button variant="outline" size="sm">
                  Assign Machine
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {machinesLoading ? (
              <div className="flex justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading machines...</div>
              </div>
            ) : machines.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No machines assigned to this location.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use "Assign Machine" to add machines to this location.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Machine Name</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {machines.map((machine) => (
                      <TableRow key={machine.id}>
                        <TableCell className="font-medium">
                          {machine.name}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(machine.status)}>
                            {machine.status}
                          </Badge>
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

export default LocationDetail;
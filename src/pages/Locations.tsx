import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

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

const Locations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchLocations = async () => {
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
        .order("name", { ascending: true });

      if (error) throw error;
      setLocations(data || []);
      setFilteredLocations(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load locations: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredLocations(locations);
    } else {
      const filtered = locations.filter((location) =>
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (location.city && location.city.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredLocations(filtered);
    }
  }, [searchTerm, locations]);

  const formatTraffic = (daily: number | null, monthly: number | null) => {
    const dailyStr = daily ? daily.toLocaleString() : "-";
    const monthlyStr = monthly ? monthly.toLocaleString() : "-";
    return `${dailyStr} / ${monthlyStr}`;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold">Locations</h1>
          
          {/* Search Input */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Locations Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              All Locations
              {searchTerm && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({filteredLocations.length} of {locations.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading locations...</div>
              </div>
            ) : filteredLocations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? "No locations found matching your search." : "No locations found."}
                </p>
                {!searchTerm && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Convert prospects to create locations.
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Location Type</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Traffic (Daily/Monthly)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLocations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell>
                          <Link
                            to={`/locations/${location.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {location.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {location.location_types?.name || "-"}
                        </TableCell>
                        <TableCell>
                          {location.city || "-"}
                        </TableCell>
                        <TableCell>
                          {location.state || "-"}
                        </TableCell>
                        <TableCell>
                          {formatTraffic(location.traffic_daily_est, location.traffic_monthly_est)}
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

export default Locations;
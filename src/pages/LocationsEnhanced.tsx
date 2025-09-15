import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, MapPin, Building2, TrendingUp, Users, 
  DollarSign, Target, Activity 
} from "lucide-react";

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

interface LocationMetrics {
  total: number;
  active: number;
  totalTrafficDaily: number;
  totalTrafficMonthly: number;
  avgTrafficDaily: number;
  conversionRate: number;
}

const LocationsEnhanced = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  const [metrics, setMetrics] = useState<LocationMetrics>({
    total: 0,
    active: 0,
    totalTrafficDaily: 0,
    totalTrafficMonthly: 0,
    avgTrafficDaily: 0,
    conversionRate: 12.5
  });

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
      
      const locationsData = data || [];
      setLocations(locationsData);
      setFilteredLocations(locationsData);

      // Calculate metrics
      const total = locationsData.length;
      const active = locationsData.filter(loc => loc.traffic_daily_est && loc.traffic_daily_est > 0).length;
      const totalTrafficDaily = locationsData.reduce((sum, loc) => sum + (loc.traffic_daily_est || 0), 0);
      const totalTrafficMonthly = locationsData.reduce((sum, loc) => sum + (loc.traffic_monthly_est || 0), 0);
      const avgTrafficDaily = total > 0 ? totalTrafficDaily / total : 0;

      setMetrics({
        total,
        active,
        totalTrafficDaily,
        totalTrafficMonthly,
        avgTrafficDaily: Math.round(avgTrafficDaily),
        conversionRate: 12.5 // This could be calculated based on actual sales data
      });
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Location Management</h1>
          <p className="text-muted-foreground">Manage and monitor your business locations</p>
        </div>
        
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Locations</p>
                <p className="text-2xl font-bold">{metrics.total}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Active Locations</p>
                <p className="text-2xl font-bold text-green-800">{metrics.active}</p>
                <p className="text-xs text-green-600">With traffic data</p>
              </div>
              <MapPin className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Traffic</p>
                <p className="text-2xl font-bold">{metrics.totalTrafficDaily.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total across all locations</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Daily Traffic</p>
                <p className="text-2xl font-bold">{metrics.avgTrafficDaily}</p>
                <p className="text-xs text-blue-600">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  {metrics.conversionRate}% conversion
                </p>
              </div>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Location Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {metrics.total > 0 ? Math.round((metrics.active / metrics.total) * 100) : 0}%
              </div>
              <p className="text-sm text-muted-foreground">Active Rate</p>
              <p className="text-xs text-green-600">Locations with traffic data</p>
            </div>
            
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {(metrics.totalTrafficMonthly / 1000).toFixed(1)}K
              </div>
              <p className="text-sm text-muted-foreground">Monthly Traffic</p>
              <p className="text-xs text-blue-600">Total footfall potential</p>
            </div>
            
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-600">{metrics.conversionRate}%</div>
              <p className="text-sm text-muted-foreground">Est. Conversion</p>
              <p className="text-xs text-purple-600">Traffic to sales rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
          {filteredLocations.length === 0 ? (
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
  );
};

export default LocationsEnhanced;
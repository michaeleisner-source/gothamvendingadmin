import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Plus, MapPin, TrendingUp, DollarSign, Search, Eye } from "lucide-react";
import { useLocations } from "@/hooks/useSupabaseData";

export default function Locations() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: locations = [], isLoading, error } = useLocations();

  const filteredLocations = locations.filter(location =>
    location.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.address_line1?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeLocations = locations.filter(loc => loc.status === 'active');
  const pendingLocations = locations.filter(loc => loc.status === 'pending');

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Locations</h1>
        <p className="text-destructive">Error loading locations: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Location Management</h1>
          <p className="text-muted-foreground">Manage your vending machine locations</p>
        </div>
        <Button asChild className="flex items-center gap-2">
          <Link to="/locations/new">
            <Plus className="h-4 w-4" />
            Add Location
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length}</div>
            <p className="text-xs text-muted-foreground">All locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLocations.length}</div>
            <p className="text-xs text-muted-foreground">Operating locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <MapPin className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingLocations.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting setup</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,250</div>
            <p className="text-xs text-muted-foreground">Per location/month</p>
          </CardContent>
        </Card>
      </div>

      {/* Locations List */}
      <Card>
        <CardHeader>
          <CardTitle>Location Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button variant="outline">Map View</Button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading locations...</p>
              </div>
            ) : filteredLocations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? "No locations match your search." : "No locations found. Add your first location to get started."}
                </p>
                {!searchTerm && (
                  <Button asChild className="mt-4">
                    <Link to="/locations/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Location
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Location</th>
                      <th className="text-left py-2">Address</th>
                      <th className="text-left py-2">Contact</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLocations.map((location) => (
                      <tr key={location.id} className="border-b">
                        <td className="py-2 font-medium">{location.name}</td>
                        <td className="py-2">
                          {location.address_line1 && (
                            <div>
                              {location.address_line1}
                              {location.city && location.state && (
                                <div className="text-xs text-muted-foreground">
                                  {location.city}, {location.state} {location.postal_code}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-2">
                          <div>
                            <div className="font-medium">{location.contact_name || 'N/A'}</div>
                            {location.contact_email && (
                              <div className="text-xs text-muted-foreground">{location.contact_email}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            location.status === 'active' 
                              ? 'bg-success/10 text-success' 
                              : location.status === 'pending'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {location.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="py-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/locations/${location.id}`}>
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
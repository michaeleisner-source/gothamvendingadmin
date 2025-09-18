import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, MapPin, TrendingUp, DollarSign } from "lucide-react";

export default function Locations() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Location Management</h1>
          <p className="text-muted-foreground">Manage your vending machine locations</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <Link to="/locations/new">Add Location</Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">Locations with machines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,450</div>
            <p className="text-xs text-muted-foreground">Monthly revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15%</div>
            <p className="text-xs text-muted-foreground">Revenue share</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <MapPin className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Locations to setup</p>
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
              <input 
                type="text" 
                placeholder="Search locations..." 
                className="px-3 py-2 border rounded-md w-64"
              />
              <Button variant="outline">Map View</Button>
            </div>
            
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Location</th>
                    <th className="text-left py-2">Address</th>
                    <th className="text-left py-2">Machines</th>
                    <th className="text-left py-2">Monthly Revenue</th>
                    <th className="text-left py-2">Commission</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Corporate Plaza</td>
                    <td className="py-2">123 Business Blvd</td>
                    <td className="py-2">3</td>
                    <td className="py-2">$2,450</td>
                    <td className="py-2">15%</td>
                    <td className="py-2"><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span></td>
                    <td className="py-2">
                      <Button variant="outline" size="sm">View</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">University Center</td>
                    <td className="py-2">456 College Ave</td>
                    <td className="py-2">2</td>
                    <td className="py-2">$1,890</td>
                    <td className="py-2">12%</td>
                    <td className="py-2"><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span></td>
                    <td className="py-2">
                      <Button variant="outline" size="sm">View</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Hospital Main</td>
                    <td className="py-2">789 Health St</td>
                    <td className="py-2">1</td>
                    <td className="py-2">$750</td>
                    <td className="py-2">10%</td>
                    <td className="py-2"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Maintenance</span></td>
                    <td className="py-2">
                      <Button variant="outline" size="sm">Service</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Shopping Mall</td>
                    <td className="py-2">321 Retail Row</td>
                    <td className="py-2">4</td>
                    <td className="py-2">$3,200</td>
                    <td className="py-2">18%</td>
                    <td className="py-2"><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span></td>
                    <td className="py-2">
                      <Button variant="outline" size="sm">View</Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
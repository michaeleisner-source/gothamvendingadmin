import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Truck, MapPin, Clock } from "lucide-react";

export default function Routes() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Route Management</h1>
          <p className="text-muted-foreground">Plan and optimize delivery routes</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Route
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">Delivery routes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations Covered</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">Total stops</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Route Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2h</div>
            <p className="text-xs text-muted-foreground">Per route</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <Truck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">92%</div>
            <p className="text-xs text-muted-foreground">Route optimization</p>
          </CardContent>
        </Card>
      </div>

      {/* Routes List */}
      <Card>
        <CardHeader>
          <CardTitle>Route Planning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <input 
                type="text" 
                placeholder="Search routes..." 
                className="px-3 py-2 border rounded-md w-64"
              />
              <div className="flex gap-2">
                <Button variant="outline">Optimize All</Button>
                <Button variant="outline">Schedule</Button>
              </div>
            </div>
            
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Route Name</th>
                    <th className="text-left py-2">Driver</th>
                    <th className="text-left py-2">Stops</th>
                    <th className="text-left py-2">Est. Time</th>
                    <th className="text-left py-2">Distance</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Downtown Route A</td>
                    <td className="py-2">John Smith</td>
                    <td className="py-2">5</td>
                    <td className="py-2">3.5h</td>
                    <td className="py-2">45 miles</td>
                    <td className="py-2"><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span></td>
                    <td className="py-2">
                      <Button variant="outline" size="sm">Edit</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">University District</td>
                    <td className="py-2">Sarah Johnson</td>
                    <td className="py-2">3</td>
                    <td className="py-2">2.5h</td>
                    <td className="py-2">32 miles</td>
                    <td className="py-2"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Scheduled</span></td>
                    <td className="py-2">
                      <Button variant="outline" size="sm">Start</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Medical Complex</td>
                    <td className="py-2">Mike Wilson</td>
                    <td className="py-2">4</td>
                    <td className="py-2">4.0h</td>
                    <td className="py-2">38 miles</td>
                    <td className="py-2"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">In Progress</span></td>
                    <td className="py-2">
                      <Button variant="outline" size="sm">Track</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Shopping Centers</td>
                    <td className="py-2">Lisa Chen</td>
                    <td className="py-2">6</td>
                    <td className="py-2">5.2h</td>
                    <td className="py-2">67 miles</td>
                    <td className="py-2"><span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">Completed</span></td>
                    <td className="py-2">
                      <Button variant="outline" size="sm">Report</Button>
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
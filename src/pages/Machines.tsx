import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Settings, AlertCircle, TrendingUp } from "lucide-react";

export default function Machines() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Machine Management</h1>
          <p className="text-muted-foreground">Monitor and manage your vending machines</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <Link to="/machine-setup">Add Machine</Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Machines</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Active machines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">22</div>
            <p className="text-xs text-muted-foreground">Machines online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">2</div>
            <p className="text-xs text-muted-foreground">Offline machines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">Uptime this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Machines List */}
      <Card>
        <CardHeader>
          <CardTitle>Machine List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <input 
                type="text" 
                placeholder="Search machines..." 
                className="px-3 py-2 border rounded-md w-64"
              />
              <div className="flex gap-2">
                <Button variant="outline">Filter</Button>
                <Button variant="outline">Export</Button>
              </div>
            </div>
            
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Machine ID</th>
                    <th className="text-left py-2">Location</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Last Contact</th>
                    <th className="text-left py-2">Revenue (30d)</th>
                    <th className="text-left py-2">Stock Level</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">VM-001</td>
                    <td className="py-2">Corporate Plaza</td>
                    <td className="py-2"><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Online</span></td>
                    <td className="py-2">2 min ago</td>
                    <td className="py-2">$1,250</td>
                    <td className="py-2">75%</td>
                    <td className="py-2">
                      <Button variant="outline" size="sm">Manage</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">VM-002</td>
                    <td className="py-2">Hospital Main</td>
                    <td className="py-2"><span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Offline</span></td>
                    <td className="py-2">2 hours ago</td>
                    <td className="py-2">$890</td>
                    <td className="py-2">45%</td>
                    <td className="py-2">
                      <Button variant="outline" size="sm">Service</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">VM-003</td>
                    <td className="py-2">University Center</td>
                    <td className="py-2"><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Online</span></td>
                    <td className="py-2">5 min ago</td>
                    <td className="py-2">$1,450</td>
                    <td className="py-2">92%</td>
                    <td className="py-2">
                      <Button variant="outline" size="sm">Manage</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">VM-004</td>
                    <td className="py-2">Shopping Mall A</td>
                    <td className="py-2"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Maintenance</span></td>
                    <td className="py-2">1 day ago</td>
                    <td className="py-2">$2,100</td>
                    <td className="py-2">20%</td>
                    <td className="py-2">
                      <Button variant="outline" size="sm">Service</Button>
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
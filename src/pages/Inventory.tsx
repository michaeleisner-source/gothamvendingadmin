import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Package, AlertTriangle, TrendingDown } from "lucide-react";

export default function Inventory() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Track stock levels and manage restocking</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <Link to="/restock-entry">Start Restock</Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Product varieties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">12</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">4</div>
            <p className="text-xs text-muted-foreground">Empty slots</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Stock Level</CardTitle>
            <Package className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">78%</div>
            <p className="text-xs text-muted-foreground">Across all machines</p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <input 
                type="text" 
                placeholder="Search products..." 
                className="px-3 py-2 border rounded-md w-64"
              />
              <Button variant="outline">Export</Button>
            </div>
            
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Product</th>
                    <th className="text-left py-2">Machine</th>
                    <th className="text-left py-2">Current Stock</th>
                    <th className="text-left py-2">Reorder Point</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Coca-Cola Classic</td>
                    <td className="py-2">VM-001 Corporate</td>
                    <td className="py-2">8</td>
                    <td className="py-2">12</td>
                    <td className="py-2"><span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Low Stock</span></td>
                    <td className="py-2">
                      <Button variant="outline" size="sm">Restock</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Pepsi</td>
                    <td className="py-2">VM-002 Hospital</td>
                    <td className="py-2">0</td>
                    <td className="py-2">10</td>
                    <td className="py-2"><span className="px-2 py-1 bg-red-600 text-white rounded text-xs">Out of Stock</span></td>
                    <td className="py-2">
                      <Button variant="outline" size="sm">Urgent Restock</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Snickers Bar</td>
                    <td className="py-2">VM-003 Office</td>
                    <td className="py-2">25</td>
                    <td className="py-2">15</td>
                    <td className="py-2"><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">In Stock</span></td>
                    <td className="py-2">
                      <Button variant="outline" size="sm">View</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Dasani Water</td>
                    <td className="py-2">VM-004 University</td>
                    <td className="py-2">5</td>
                    <td className="py-2">8</td>
                    <td className="py-2"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Low Stock</span></td>
                    <td className="py-2">
                      <Button variant="outline" size="sm">Restock</Button>
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
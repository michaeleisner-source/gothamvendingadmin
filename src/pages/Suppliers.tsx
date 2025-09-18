import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Package, TrendingUp } from "lucide-react";

export default function Suppliers() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supplier Management</h1>
          <p className="text-muted-foreground">Manage supplier relationships and product sourcing</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Verified suppliers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Sourced</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Product varieties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,450</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Supplier</CardTitle>
            <Building2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45%</div>
            <p className="text-xs text-muted-foreground">Of total orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers List */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <input 
                type="text" 
                placeholder="Search suppliers..." 
                className="px-3 py-2 border rounded-md w-64"
              />
              <Button variant="outline">Contact All</Button>
            </div>
            
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Supplier</th>
                    <th className="text-left py-2">Contact</th>
                    <th className="text-left py-2">Products</th>
                    <th className="text-left py-2">Monthly Orders</th>
                    <th className="text-left py-2">Payment Terms</th>
                    <th className="text-left py-2">Rating</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Coca-Cola Company</td>
                    <td className="py-2">sales@cocacola.com</td>
                    <td className="py-2">45</td>
                    <td className="py-2">$5,600</td>
                    <td className="py-2">Net 30</td>
                    <td className="py-2">★★★★★</td>
                    <td className="py-2">
                      <Button variant="outline" size="sm">Contact</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">PepsiCo</td>
                    <td className="py-2">orders@pepsi.com</td>
                    <td className="py-2">38</td>
                    <td className="py-2">$4,200</td>
                    <td className="py-2">Net 45</td>
                    <td className="py-2">★★★★☆</td>
                    <td className="py-2">
                      <Button variant="outline" size="sm">Contact</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Mars Snackfood</td>
                    <td className="py-2">supply@mars.com</td>
                    <td className="py-2">22</td>
                    <td className="py-2">$2,100</td>
                    <td className="py-2">Net 30</td>
                    <td className="py-2">★★★★★</td>
                    <td className="py-2">
                      <Button variant="outline" size="sm">Contact</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Frito-Lay</td>
                    <td className="py-2">vending@fritolay.com</td>
                    <td className="py-2">31</td>
                    <td className="py-2">$3,800</td>
                    <td className="py-2">Net 30</td>
                    <td className="py-2">★★★★☆</td>
                    <td className="py-2">
                      <Button variant="outline" size="sm">Contact</Button>
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
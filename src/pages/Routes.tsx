import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Truck, MapPin, Clock, Zap, BarChart3 } from "lucide-react";
import { SmartRouteOptimizer } from "@/components/routes/SmartRouteOptimizer";
import { RouteEfficiencyTracker } from "@/components/routes/RouteEfficiencyTracker";
import { useInventoryAnalytics } from "@/hooks/useInventoryAnalytics";

export default function Routes() {
  const { data: inventoryData } = useInventoryAnalytics();
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Smart Route Management</h1>
          <p className="text-muted-foreground">
            AI-powered route optimization based on inventory levels and real-time data
          </p>
          {inventoryData && inventoryData.criticalItems.length > 0 && (
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
              ⚠️ {inventoryData.criticalItems.length} locations need urgent restocking
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Auto-Optimize
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Route
          </Button>
        </div>
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
            <p className="text-xs text-muted-foreground">
              {inventoryData?.criticalItems.length || 0} urgent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations Covered</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">
              {inventoryData?.lowStockCount || 0} need restock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Route Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2h</div>
            <p className="text-xs text-green-600">-15% optimized</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Efficiency</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">94%</div>
            <p className="text-xs text-muted-foreground">Smart routing</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="optimizer" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="optimizer" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Smart Optimizer
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Active Routes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="optimizer">
          <SmartRouteOptimizer />
        </TabsContent>

        <TabsContent value="analytics">
          <RouteEfficiencyTracker />
        </TabsContent>

        <TabsContent value="routes">
          <Card>
            <CardHeader>
              <CardTitle>Current Routes</CardTitle>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
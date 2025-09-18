import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Brain, Zap, Target, Calendar, Download } from "lucide-react";
import { useVendingData } from "@/hooks/useVendingData";

export function PredictiveAnalytics() {
  const vendingData = useVendingData();
  const revenue = vendingData.data?.sales.reduce((total, sale) => total + (sale.qty * sale.unit_price_cents), 0) || 0;

  // Mock predictive data
  const revenueForecast = [
    { month: "Jan", actual: 45000, predicted: null, lower: null, upper: null },
    { month: "Feb", actual: 52000, predicted: null, lower: null, upper: null },
    { month: "Mar", actual: 48000, predicted: null, lower: null, upper: null },
    { month: "Apr", actual: 61000, predicted: null, lower: null, upper: null },
    { month: "May", actual: null, predicted: 58000, lower: 52000, upper: 64000 },
    { month: "Jun", actual: null, predicted: 62000, lower: 56000, upper: 68000 },
    { month: "Jul", actual: null, predicted: 65000, lower: 59000, upper: 71000 },
    { month: "Aug", actual: null, predicted: 67000, lower: 61000, upper: 73000 }
  ];

  const demandPrediction = [
    { product: "Coca Cola", current: 120, predicted: 135, confidence: 89 },
    { product: "Snickers", current: 85, predicted: 92, confidence: 84 },
    { product: "Doritos", current: 76, predicted: 68, confidence: 91 },
    { product: "Red Bull", current: 45, predicted: 52, confidence: 78 },
    { product: "Gatorade", current: 38, predicted: 44, confidence: 82 }
  ];

  const riskAssessment = [
    { name: "Low Risk", value: 65, color: "#10b981" },
    { name: "Medium Risk", value: 25, color: "#f59e0b" },
    { name: "High Risk", value: 10, color: "#ef4444" }
  ];

  const maintenancePredictions = [
    {
      machine: "VM-001",
      location: "Downtown Mall",
      prediction: "Needs service in 12 days",
      confidence: 87,
      issue: "Coin mechanism wear",
      priority: "medium" as const
    },
    {
      machine: "VM-015", 
      location: "Airport Terminal",
      prediction: "Needs service in 6 days",
      confidence: 92,
      issue: "Refrigeration system",
      priority: "high" as const
    },
    {
      machine: "VM-008",
      location: "University Campus",
      prediction: "Needs service in 25 days",
      confidence: 78,
      issue: "Bill acceptor",
      priority: "low" as const
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Predictive Analytics
          </CardTitle>
          <CardDescription>
            AI-powered insights and forecasting for strategic decision making
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="revenue" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="revenue">Revenue Forecast</TabsTrigger>
              <TabsTrigger value="demand">Demand Prediction</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="revenue" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Revenue Forecasting</h3>
                  <p className="text-sm text-muted-foreground">
                    Projected revenue based on historical trends and seasonal patterns
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Forecast
                </Button>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueForecast}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        value ? `$${Number(value).toLocaleString()}` : null,
                        name === 'actual' ? 'Actual' : name === 'predicted' ? 'Predicted' : name
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="lower" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={1}
                      strokeDasharray="2 2"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="upper" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={1}
                      strokeDasharray="2 2"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">+12.4%</div>
                  <div className="text-sm text-muted-foreground">Projected Growth</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">$487K</div>
                  <div className="text-sm text-muted-foreground">6-Month Forecast</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">87%</div>
                  <div className="text-sm text-muted-foreground">Confidence Level</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="demand" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Product Demand Forecasting</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Predicted demand changes for top-selling products
                </p>
              </div>
              <div className="space-y-3">
                {demandPrediction.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.product}</div>
                      <div className="text-sm text-muted-foreground">
                        Current: {item.current} units/week
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{item.predicted} units</div>
                      <div className={`text-sm ${
                        item.predicted > item.current ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.predicted > item.current ? '+' : ''}{item.predicted - item.current} ({
                          Math.round(((item.predicted - item.current) / item.current) * 100)
                        }%)
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-4">
                      {item.confidence}% confidence
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Predictive Maintenance</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  AI-predicted maintenance needs based on usage patterns and sensor data
                </p>
              </div>
              <div className="space-y-3">
                {maintenancePredictions.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.machine}</div>
                      <div className="text-sm text-muted-foreground">{item.location}</div>
                      <div className="text-sm mt-1">{item.issue}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{item.prediction}</div>
                      <Badge variant="secondary">
                        {item.confidence}% confidence
                      </Badge>
                    </div>
                    <Badge 
                      variant={
                        item.priority === "high" ? "destructive" : 
                        item.priority === "medium" ? "secondary" : "outline"
                      }
                      className="ml-4"
                    >
                      {item.priority} priority
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="risk" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Business Risk Analysis</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Risk distribution across locations and machines
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskAssessment}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {riskAssessment.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-medium">High Risk Factors</span>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 2 machines with declining performance</li>
                      <li>• Location contract renewal due</li>
                      <li>• Supply chain disruption risk</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="font-medium">Medium Risk Factors</span>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Seasonal demand fluctuation</li>
                      <li>• New competitor in area</li>
                      <li>• Price sensitivity analysis needed</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
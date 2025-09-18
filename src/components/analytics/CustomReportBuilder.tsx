import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { BarChart, LineChart, PieChart, Calendar as CalendarIcon, Download, Share, Save, Play } from "lucide-react";
import { format } from "date-fns";

export function CustomReportBuilder() {
  const [reportName, setReportName] = useState("");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const [visualizationType, setVisualizationType] = useState("table");

  const availableMetrics = [
    { id: "revenue", name: "Revenue", category: "Financial" },
    { id: "profit", name: "Profit", category: "Financial" },
    { id: "cost", name: "Cost", category: "Financial" },
    { id: "sales_volume", name: "Sales Volume", category: "Sales" },
    { id: "transactions", name: "Transactions", category: "Sales" },
    { id: "avg_transaction", name: "Avg Transaction Value", category: "Sales" },
    { id: "machine_uptime", name: "Machine Uptime", category: "Operations" },
    { id: "inventory_turns", name: "Inventory Turnover", category: "Inventory" },
    { id: "stockouts", name: "Stockouts", category: "Inventory" },
    { id: "customer_satisfaction", name: "Customer Satisfaction", category: "Customer" }
  ];

  const availableDimensions = [
    { id: "date", name: "Date" },
    { id: "location", name: "Location" },
    { id: "machine", name: "Machine" },
    { id: "product", name: "Product" },
    { id: "category", name: "Product Category" },
    { id: "payment_type", name: "Payment Type" },
    { id: "time_of_day", name: "Time of Day" },
    { id: "day_of_week", name: "Day of Week" }
  ];

  const filterOptions = {
    location: ["Downtown Mall", "Airport Terminal", "University Campus", "Office Complex"],
    machine: ["VM-001", "VM-003", "VM-007", "VM-012", "VM-015"],
    category: ["Beverages", "Snacks", "Healthy Options", "Energy Drinks"],
    payment_type: ["Cash", "Credit Card", "Mobile Payment"]
  };

  const savedReports = [
    { name: "Weekly Sales Summary", lastRun: "2024-01-15", status: "scheduled" },
    { name: "Machine Performance Dashboard", lastRun: "2024-01-14", status: "active" },
    { name: "Inventory Analysis", lastRun: "2024-01-13", status: "draft" },
    { name: "Location Comparison", lastRun: "2024-01-12", status: "active" }
  ];

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const handleDimensionToggle = (dimensionId: string) => {
    setSelectedDimensions(prev => 
      prev.includes(dimensionId) 
        ? prev.filter(id => id !== dimensionId)
        : [...prev, dimensionId]
    );
  };

  const metricsByCategory = availableMetrics.reduce((acc, metric) => {
    if (!acc[metric.category]) acc[metric.category] = [];
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, typeof availableMetrics>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Custom Report Builder
          </CardTitle>
          <CardDescription>
            Create custom reports and dashboards tailored to your business needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="builder" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="builder">Report Builder</TabsTrigger>
              <TabsTrigger value="saved">Saved Reports</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="builder" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Report Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Report Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="reportName">Report Name</Label>
                          <Input
                            id="reportName"
                            placeholder="Enter report name"
                            value={reportName}
                            onChange={(e) => setReportName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Visualization Type</Label>
                          <Select value={visualizationType} onValueChange={setVisualizationType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="table">Table</SelectItem>
                              <SelectItem value="bar">Bar Chart</SelectItem>
                              <SelectItem value="line">Line Chart</SelectItem>
                              <SelectItem value="pie">Pie Chart</SelectItem>
                              <SelectItem value="dashboard">Dashboard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Date Range</Label>
                        <div className="flex gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="flex-1">
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                {dateRange.from ? format(dateRange.from, "PPP") : "Start date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={dateRange.from}
                                onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                              />
                            </PopoverContent>
                          </Popover>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="flex-1">
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                {dateRange.to ? format(dateRange.to, "PPP") : "End date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={dateRange.to}
                                onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Metrics Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Select Metrics</CardTitle>
                      <CardDescription>Choose the metrics you want to include in your report</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(metricsByCategory).map(([category, metrics]) => (
                          <div key={category}>
                            <h4 className="font-medium mb-2">{category}</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {metrics.map((metric) => (
                                <div key={metric.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={metric.id}
                                    checked={selectedMetrics.includes(metric.id)}
                                    onCheckedChange={() => handleMetricToggle(metric.id)}
                                  />
                                  <Label htmlFor={metric.id} className="text-sm">
                                    {metric.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dimensions Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Select Dimensions</CardTitle>
                      <CardDescription>Choose how you want to group and analyze your data</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {availableDimensions.map((dimension) => (
                          <div key={dimension.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={dimension.id}
                              checked={selectedDimensions.includes(dimension.id)}
                              onCheckedChange={() => handleDimensionToggle(dimension.id)}
                            />
                            <Label htmlFor={dimension.id} className="text-sm">
                              {dimension.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Filters */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Filters</CardTitle>
                      <CardDescription>Apply filters to focus on specific data</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(filterOptions).map(([key, options]) => (
                          <div key={key}>
                            <Label className="capitalize">{key.replace('_', ' ')}</Label>
                            <Select 
                              value={selectedFilters[key] || ""} 
                              onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, [key]: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={`Select ${key.replace('_', ' ')}`} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">All</SelectItem>
                                {options.map((option) => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Preview Panel */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Report Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Selected Metrics:</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedMetrics.length > 0 ? (
                              selectedMetrics.map(metricId => {
                                const metric = availableMetrics.find(m => m.id === metricId);
                                return (
                                  <Badge key={metricId} variant="secondary" className="text-xs">
                                    {metric?.name}
                                  </Badge>
                                );
                              })
                            ) : (
                              <span className="text-xs text-muted-foreground">No metrics selected</span>
                            )}
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-sm font-medium">Dimensions:</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedDimensions.length > 0 ? (
                              selectedDimensions.map(dimensionId => {
                                const dimension = availableDimensions.find(d => d.id === dimensionId);
                                return (
                                  <Badge key={dimensionId} variant="outline" className="text-xs">
                                    {dimension?.name}
                                  </Badge>
                                );
                              })
                            ) : (
                              <span className="text-xs text-muted-foreground">No dimensions selected</span>
                            )}
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-sm font-medium">Active Filters:</Label>
                          <div className="space-y-1 mt-1">
                            {Object.entries(selectedFilters).filter(([_, value]) => value).length > 0 ? (
                              Object.entries(selectedFilters)
                                .filter(([_, value]) => value)
                                .map(([key, value]) => (
                                  <div key={key} className="text-xs text-muted-foreground">
                                    {key.replace('_', ' ')}: {value}
                                  </div>
                                ))
                            ) : (
                              <span className="text-xs text-muted-foreground">No filters applied</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <Button className="w-full" disabled={selectedMetrics.length === 0}>
                          <Play className="h-4 w-4 mr-2" />
                          Run Report
                        </Button>
                        <Button variant="outline" className="w-full" disabled={!reportName}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Report
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="saved" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Saved Reports</h3>
                <Button variant="outline" size="sm">
                  <Share className="h-4 w-4 mr-2" />
                  Share All
                </Button>
              </div>
              <div className="space-y-3">
                {savedReports.map((report, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{report.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Last run: {report.lastRun}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              report.status === "active" ? "default" : 
                              report.status === "scheduled" ? "secondary" : "outline"
                            }
                          >
                            {report.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            Run
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <BarChart className="h-8 w-8 text-blue-600 mt-1" />
                      <div>
                        <h4 className="font-semibold">Sales Performance</h4>
                        <p className="text-sm text-muted-foreground">
                          Revenue, transactions, and growth metrics by location and time period
                        </p>
                        <div className="flex gap-1 mt-2">
                          <Badge variant="outline" className="text-xs">Revenue</Badge>
                          <Badge variant="outline" className="text-xs">Growth</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <LineChart className="h-8 w-8 text-green-600 mt-1" />
                      <div>
                        <h4 className="font-semibold">Operational Dashboard</h4>
                        <p className="text-sm text-muted-foreground">
                          Machine uptime, maintenance alerts, and operational efficiency
                        </p>
                        <div className="flex gap-1 mt-2">
                          <Badge variant="outline" className="text-xs">Uptime</Badge>
                          <Badge variant="outline" className="text-xs">Alerts</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <PieChart className="h-8 w-8 text-purple-600 mt-1" />
                      <div>
                        <h4 className="font-semibold">Inventory Analysis</h4>
                        <p className="text-sm text-muted-foreground">
                          Stock levels, turnover rates, and product performance
                        </p>
                        <div className="flex gap-1 mt-2">
                          <Badge variant="outline" className="text-xs">Stock</Badge>
                          <Badge variant="outline" className="text-xs">Turnover</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <BarChart className="h-8 w-8 text-orange-600 mt-1" />
                      <div>
                        <h4 className="font-semibold">Financial Summary</h4>
                        <p className="text-sm text-muted-foreground">
                          P&L, cash flow, and profitability analysis by various dimensions
                        </p>
                        <div className="flex gap-1 mt-2">
                          <Badge variant="outline" className="text-xs">P&L</Badge>
                          <Badge variant="outline" className="text-xs">Cash Flow</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
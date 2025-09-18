import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Star,
  Clock,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

// Demo analytics data
const customerMetrics = {
  overview: {
    totalCustomers: 24,
    activeCustomers: 22,
    avgSatisfaction: 4.5,
    totalRevenue: 89400,
    revenueGrowth: 12.5,
    churnRate: 3.2,
    avgLifetime: 18.5
  },
  revenueByCustomer: [
    { name: "Manhattan Tech Hub", revenue: 4250, satisfaction: 4.8, machines: 4 },
    { name: "Brooklyn Hospital", revenue: 6800, satisfaction: 4.6, machines: 6 },
    { name: "Queens University", revenue: 8900, satisfaction: 4.4, machines: 8 },
    { name: "Jersey Logistics", revenue: 2100, satisfaction: 4.2, machines: 3 },
    { name: "Bronx Medical Center", revenue: 5400, satisfaction: 4.7, machines: 5 },
    { name: "Staten Island Mall", revenue: 7200, satisfaction: 4.3, machines: 7 }
  ],
  satisfactionTrend: [
    { month: "Aug", score: 4.2 },
    { month: "Sep", score: 4.3 },
    { month: "Oct", score: 4.4 },
    { month: "Nov", score: 4.5 },
    { month: "Dec", score: 4.6 },
    { month: "Jan", score: 4.5 }
  ],
  customerSegments: [
    { name: "Healthcare", value: 35, count: 8 },
    { name: "Office Buildings", value: 25, count: 6 },
    { name: "Educational", value: 20, count: 5 },
    { name: "Retail", value: 15, count: 3 },
    { name: "Industrial", value: 5, count: 2 }
  ],
  retentionMetrics: [
    { segment: "Healthcare", retention: 95, satisfaction: 4.6, avgRevenue: 5800 },
    { segment: "Office Buildings", retention: 88, satisfaction: 4.4, avgRevenue: 4200 },
    { segment: "Educational", retention: 92, satisfaction: 4.3, avgRevenue: 6500 },
    { segment: "Retail", retention: 85, satisfaction: 4.1, avgRevenue: 3800 },
    { segment: "Industrial", retention: 78, satisfaction: 4.0, avgRevenue: 3200 }
  ]
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function CustomerInsights() {
  const [timeRange, setTimeRange] = useState("6months");
  const metrics = customerMetrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Customer Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Insights into customer behavior, satisfaction, and performance
          </p>
        </div>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button>Export Report</Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{metrics.overview.totalCustomers}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8% this month
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">${metrics.overview.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{metrics.overview.revenueGrowth}% vs last month
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Satisfaction</p>
                <p className="text-2xl font-bold">{metrics.overview.avgSatisfaction}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <Star className="h-3 w-3 mr-1" />
                  +0.1 vs last month
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Churn Rate</p>
                <p className="text-2xl font-bold">{metrics.overview.churnRate}%</p>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  +0.5% vs last month
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="satisfaction">Satisfaction Trends</TabsTrigger>
          <TabsTrigger value="segments">Customer Segments</TabsTrigger>
          <TabsTrigger value="retention">Retention Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={metrics.revenueByCustomer}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? `$${value}` : value,
                      name === 'revenue' ? 'Monthly Revenue' : 'Machines'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="satisfaction" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Satisfaction Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.satisfactionTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[3.5, 5]} />
                  <Tooltip formatter={(value) => [`${value}`, 'Satisfaction Score']} />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#8884d8" 
                    strokeWidth={3}
                    dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.revenueByCustomer.slice(0, 3).map((customer, index) => (
              <Card key={customer.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">{customer.name}</h3>
                    <Badge 
                      variant={customer.satisfaction >= 4.5 ? "default" : customer.satisfaction >= 4.0 ? "secondary" : "destructive"}
                    >
                      ★ {customer.satisfaction}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{customer.machines} machines</p>
                  <p className="text-sm font-medium">${customer.revenue}/month</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.customerSegments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name}: ${(Number(percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {metrics.customerSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.customerSegments.map((segment, index) => (
                    <div key={segment.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="font-medium">{segment.name}</p>
                          <p className="text-sm text-muted-foreground">{segment.count} customers</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{segment.value}%</p>
                        <p className="text-sm text-muted-foreground">of total</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retention by Segment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.retentionMetrics.map((segment) => (
                  <div key={segment.segment} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{segment.segment}</h3>
                      <Badge 
                        variant={segment.retention >= 90 ? "default" : segment.retention >= 80 ? "secondary" : "destructive"}
                      >
                        {segment.retention}% retention
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Avg Revenue</p>
                        <p className="font-medium">${segment.avgRevenue}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Satisfaction</p>
                        <p className="font-medium flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          {segment.satisfaction}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium flex items-center">
                          {segment.retention >= 90 ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                          )}
                          {segment.retention >= 90 ? 'Excellent' : segment.retention >= 80 ? 'Good' : 'Needs Attention'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
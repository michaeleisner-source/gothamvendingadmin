import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Activity,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart as RechartsPieChart, Cell } from 'recharts';

export function MachinePerformanceDashboard() {
  // Mock performance data
  const performanceData = [
    { month: 'Jan', revenue: 1200, uptime: 98.5, sales: 145 },
    { month: 'Feb', revenue: 1350, uptime: 97.2, sales: 162 },
    { month: 'Mar', revenue: 1180, uptime: 99.1, sales: 138 },
    { month: 'Apr', revenue: 1420, uptime: 96.8, sales: 171 },
    { month: 'May', revenue: 1290, uptime: 98.9, sales: 155 },
    { month: 'Jun', revenue: 1380, uptime: 97.5, sales: 166 }
  ];

  const topMachines = [
    { id: 'VM-001', location: 'Downtown Office', revenue: 1420, uptime: 99.1, efficiency: 95 },
    { id: 'VM-005', location: 'Airport Terminal', revenue: 1380, uptime: 98.7, efficiency: 92 },
    { id: 'VM-003', location: 'University Campus', revenue: 1290, uptime: 97.5, efficiency: 88 },
    { id: 'VM-002', location: 'Hospital Lobby', revenue: 1180, uptime: 96.8, efficiency: 85 }
  ];

  const issueDistribution = [
    { name: 'Mechanical', value: 35, color: '#8884d8' },
    { name: 'Electrical', value: 25, color: '#82ca9d' },
    { name: 'Software', value: 20, color: '#ffc658' },
    { name: 'Supply', value: 20, color: '#ff7c7c' }
  ];

  const kpis = [
    {
      title: 'Total Revenue',
      value: '$8,240',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Average Uptime',
      value: '98.1%',
      change: '+1.2%',
      trend: 'up',
      icon: Activity,
      color: 'text-blue-600'
    },
    {
      title: 'Energy Efficiency',
      value: '87.5%',
      change: '-2.1%',
      trend: 'down',
      icon: Zap,
      color: 'text-orange-600'
    },
    {
      title: 'Avg Response Time',
      value: '2.3 hrs',
      change: '-15.3%',
      trend: 'up',
      icon: Clock,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="flex items-center p-6">
              <kpi.icon className={`h-8 w-8 ${kpi.color}`} />
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <div className={`flex items-center text-sm ${
                    kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {kpi.trend === 'up' ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                    {kpi.change}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance Trends</TabsTrigger>
          <TabsTrigger value="rankings">Machine Rankings</TabsTrigger>
          <TabsTrigger value="issues">Issue Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Revenue Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Uptime Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="uptime" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rankings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Machines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topMachines.map((machine, index) => (
                  <div key={machine.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{machine.id}</div>
                        <div className="text-sm text-muted-foreground">{machine.location}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Revenue</div>
                        <div className="font-medium">${machine.revenue}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Uptime</div>
                        <div className="font-medium">{machine.uptime}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Efficiency</div>
                        <Badge variant={machine.efficiency > 90 ? 'default' : 'secondary'}>
                          {machine.efficiency}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Issue Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <RechartsPieChart data={issueDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                      {issueDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </RechartsPieChart>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {issueDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <div className="font-medium">Cooling System Failure</div>
                        <div className="text-sm text-muted-foreground">VM-003 • 2 hours ago</div>
                      </div>
                    </div>
                    <Badge variant="destructive">Critical</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <div className="font-medium">Coin Mechanism Slow</div>
                        <div className="text-sm text-muted-foreground">VM-002 • 4 hours ago</div>
                      </div>
                    </div>
                    <Badge variant="secondary">Warning</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">Display Brightness Fixed</div>
                        <div className="text-sm text-muted-foreground">VM-001 • 6 hours ago</div>
                      </div>
                    </div>
                    <Badge variant="outline">Resolved</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { DateRangePicker } from '@/components/ui/date-range-picker';
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Calendar, 
  MapPin, 
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Area, AreaChart, PieChart, Pie, Cell } from 'recharts';

interface ForecastData {
  date: string;
  actual?: number;
  predicted: number;
  confidence: number;
  factors: string[];
}

interface ProductForecast {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  predictedDemand: number;
  recommendedOrder: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  stockoutRisk: 'low' | 'medium' | 'high';
  seasonality: string;
}

const mockForecastData: ForecastData[] = [
  { date: '2024-01-01', actual: 120, predicted: 125, confidence: 92, factors: ['Weather', 'Holiday'] },
  { date: '2024-01-02', actual: 140, predicted: 138, confidence: 89, factors: ['Traffic'] },
  { date: '2024-01-03', actual: 110, predicted: 115, confidence: 94, factors: ['Day of Week'] },
  { date: '2024-01-04', predicted: 130, confidence: 87, factors: ['Weather', 'Event'] },
  { date: '2024-01-05', predicted: 145, confidence: 91, factors: ['Traffic', 'Promotion'] },
  { date: '2024-01-06', predicted: 125, confidence: 88, factors: ['Weekend'] },
  { date: '2024-01-07', predicted: 135, confidence: 90, factors: ['Weather'] }
];

const mockProductForecasts: ProductForecast[] = [
  {
    id: '1',
    name: 'Coca-Cola 20oz',
    category: 'Beverages',
    currentStock: 45,
    predictedDemand: 120,
    recommendedOrder: 85,
    confidence: 94,
    trend: 'up',
    stockoutRisk: 'high',
    seasonality: 'Summer Peak'
  },
  {
    id: '2',
    name: 'Snickers Bar',
    category: 'Snacks',
    currentStock: 78,
    predictedDemand: 65,
    recommendedOrder: 0,
    confidence: 89,
    trend: 'stable',
    stockoutRisk: 'low',
    seasonality: 'Consistent'
  },
  {
    id: '3',
    name: 'Red Bull Energy',
    category: 'Energy Drinks',
    currentStock: 25,
    predictedDemand: 45,
    recommendedOrder: 30,
    confidence: 87,
    trend: 'up',
    stockoutRisk: 'medium',
    seasonality: 'Morning Rush'
  }
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function DemandForecastingDashboard() {
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [forecastHorizon, setForecastHorizon] = useState('7');
  const [selectedProduct, setSelectedProduct] = useState('all');

  const accuracyMetrics = {
    overall: 91,
    lastWeek: 94,
    trend: '+3%'
  };

  const demandInsights = [
    {
      title: 'Peak Hours Identified',
      description: 'Lunch rush (12-2pm) shows 40% higher demand',
      icon: Clock,
      type: 'info'
    },
    {
      title: 'Weather Impact',
      description: 'Cold drinks demand drops 25% when temp < 60°F',
      icon: AlertTriangle,
      type: 'warning'
    },
    {
      title: 'Seasonal Trend',
      description: 'Energy drinks peak during exam season',
      icon: TrendingUp,
      type: 'success'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <BarChart3 className="h-4 w-4 text-blue-600" />;
    }
  };

  const getRiskBadge = (risk: string) => {
    const variants = {
      low: 'default',
      medium: 'secondary',
      high: 'destructive'
    } as const;
    return <Badge variant={variants[risk as keyof typeof variants]}>{risk.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Demand Forecasting</h2>
          <p className="text-muted-foreground">
            Machine learning-powered predictions for optimal inventory management
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="office">Office Building A</SelectItem>
              <SelectItem value="university">State University</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={forecastHorizon} onValueChange={setForecastHorizon}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Forecast Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="14">14 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button>
            <Brain className="h-4 w-4 mr-2" />
            Retrain Model
          </Button>
        </div>
      </div>

      {/* Accuracy Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accuracyMetrics.overall}%</div>
            <p className="text-xs text-muted-foreground">Overall prediction accuracy</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accuracyMetrics.lastWeek}%</div>
            <p className="text-xs text-green-600">+{accuracyMetrics.trend} from previous</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predictions Made</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="forecast" className="space-y-6">
        <TabsList>
          <TabsTrigger value="forecast">Demand Forecast</TabsTrigger>
          <TabsTrigger value="products">Product Analysis</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="optimization">Inventory Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Demand Prediction Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockForecastData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="actual" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="predicted" stackId="2" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Confidence Intervals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockForecastData.slice(-3).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{item.date}</span>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="font-medium">{item.predicted} units</div>
                          <div className="text-xs text-muted-foreground">{item.confidence}% confidence</div>
                        </div>
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${item.confidence}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Influencing Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Weather', 'Traffic', 'Events', 'Seasonality', 'Promotions'].map((factor, index) => (
                    <div key={factor} className="flex items-center justify-between">
                      <span>{factor}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${Math.random() * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">
                          {Math.floor(Math.random() * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Demand Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockProductForecasts.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{product.name}</h4>
                          {getTrendIcon(product.trend)}
                          {getRiskBadge(product.stockoutRisk)}
                        </div>
                        <p className="text-sm text-muted-foreground">{product.category} • {product.seasonality}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Confidence</div>
                        <div className="font-semibold">{product.confidence}%</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Current Stock</div>
                        <div className="font-medium">{product.currentStock} units</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Predicted Demand</div>
                        <div className="font-medium">{product.predictedDemand} units</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Recommended Order</div>
                        <div className="font-medium">{product.recommendedOrder} units</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Days to Stockout</div>
                        <div className="font-medium">
                          {product.currentStock > 0 ? Math.ceil(product.currentStock / (product.predictedDemand / 7)) : 0} days
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demandInsights.map((insight, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <insight.icon className={`h-5 w-5 mt-0.5 ${
                      insight.type === 'success' ? 'text-green-600' :
                      insight.type === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                    <div className="space-y-1">
                      <h4 className="font-semibold">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Seasonal Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockForecastData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Automated Reorder Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockProductForecasts
                    .filter(p => p.recommendedOrder > 0)
                    .map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">Order {product.recommendedOrder} units</div>
                      </div>
                      <Button size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Create PO
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-6 border rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-green-600">$1,247</div>
                    <div className="text-sm text-muted-foreground">Potential monthly savings</div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Reduced waste</span>
                      <span className="text-green-600">$420</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Optimized ordering</span>
                      <span className="text-green-600">$327</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prevented stockouts</span>
                      <span className="text-green-600">$500</span>
                    </div>
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
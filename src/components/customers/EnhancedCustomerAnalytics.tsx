import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users, TrendingUp, Clock, ShoppingCart, 
  CreditCard, MapPin, Calendar, Target,
  Zap, Heart, Star, Award
} from 'lucide-react';

export const EnhancedCustomerAnalytics = () => {
  const customerMetrics = [
    { label: 'Total Customers', value: '8,247', change: '+15%', icon: Users },
    { label: 'Active This Month', value: '3,891', change: '+8%', icon: TrendingUp },
    { label: 'Avg. Purchase Value', value: '$4.75', change: '+12%', icon: ShoppingCart },
    { label: 'Customer Lifetime Value', value: '$187', change: '+18%', icon: CreditCard }
  ];

  const customerSegments = [
    {
      name: 'Frequent Users',
      count: 1247,
      percentage: 38,
      avgSpend: '$8.50',
      color: 'bg-green-100 border-green-200 text-green-800',
      description: '5+ purchases per month'
    },
    {
      name: 'Regular Users',
      count: 1834,
      percentage: 42,
      avgSpend: '$5.25',
      color: 'bg-blue-100 border-blue-200 text-blue-800',
      description: '2-4 purchases per month'
    },
    {
      name: 'Occasional Users',
      count: 892,
      percentage: 20,
      avgSpend: '$3.75',
      color: 'bg-yellow-100 border-yellow-200 text-yellow-800',
      description: '1 purchase per month'
    }
  ];

  const locationAnalytics = [
    { location: 'Downtown Office Complex', customers: 347, revenue: '$4,200', satisfaction: 4.5 },
    { location: 'University Campus', customers: 521, revenue: '$3,800', satisfaction: 4.2 },
    { location: 'Hospital Lobby', customers: 298, revenue: '$3,600', satisfaction: 4.7 },
    { location: 'Factory Break Room', customers: 189, revenue: '$2,100', satisfaction: 3.8 },
    { location: 'Shopping Mall', customers: 445, revenue: '$5,200', satisfaction: 4.3 }
  ];

  const purchasePatterns = [
    { time: '6AM-9AM', percentage: 25, peak: 'Morning Rush' },
    { time: '9AM-12PM', percentage: 15, peak: 'Mid-Morning' },
    { time: '12PM-2PM', percentage: 35, peak: 'Lunch Peak' },
    { time: '2PM-5PM', percentage: 20, peak: 'Afternoon' },
    { time: '5PM-10PM', percentage: 5, peak: 'Evening' }
  ];

  const topProducts = [
    { name: 'Coca-Cola Classic', purchases: 1247, revenue: '$1,871', satisfaction: 4.6 },
    { name: 'Lay\'s Classic Chips', purchases: 892, revenue: '$1,338', satisfaction: 4.3 },
    { name: 'Snickers Bar', purchases: 743, revenue: '$1,114', satisfaction: 4.5 },
    { name: 'Dasani Water', purchases: 658, revenue: '$987', satisfaction: 4.2 },
    { name: 'Doritos Nacho', purchases: 567, revenue: '$850', satisfaction: 4.4 }
  ];

  const getSatisfactionStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Customer Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {customerMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <Badge variant="secondary" className="text-xs">
                    {metric.change}
                  </Badge>
                </div>
                <metric.icon className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="segments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="segments">Customer Segments</TabsTrigger>
          <TabsTrigger value="behavior">Purchase Behavior</TabsTrigger>
          <TabsTrigger value="locations">Location Analysis</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {customerSegments.map((segment) => (
              <Card key={segment.name} className={segment.color}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span>{segment.name}</span>
                    <Badge variant="outline" className="bg-white">
                      {segment.percentage}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {segment.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Customers:</span>
                    <span className="font-semibold">{segment.count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Avg. Spend:</span>
                    <span className="font-semibold">{segment.avgSpend}</span>
                  </div>
                  <Progress value={segment.percentage} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Purchase Patterns by Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {purchasePatterns.map((pattern) => (
                  <div key={pattern.time} className="flex items-center gap-4">
                    <div className="w-20 text-sm font-medium">{pattern.time}</div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{pattern.peak}</span>
                        <span className="text-sm font-medium">{pattern.percentage}%</span>
                      </div>
                      <Progress value={pattern.percentage} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {locationAnalytics.map((location) => (
                  <div key={location.location} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{location.location}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {location.customers} customers
                        </span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {location.revenue}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {getSatisfactionStars(location.satisfaction)}
                      <span className="ml-1 text-sm font-medium">{location.satisfaction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Top Performing Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                      <span className="text-sm font-bold text-primary">#{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{product.name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{product.purchases} purchases</span>
                        <span>{product.revenue} revenue</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {getSatisfactionStars(product.satisfaction)}
                      <span className="ml-1 text-sm font-medium">{product.satisfaction}</span>
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
};
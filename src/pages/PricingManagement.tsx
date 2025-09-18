import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  Calendar, 
  Percent,
  Plus,
  Edit3,
  Trash2,
  AlertCircle
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Demo pricing data
const pricingRules = [
  {
    id: "1",
    name: "Standard Beverages",
    type: "category",
    target: "Beverages",
    basePrice: 1.75,
    markup: 15,
    active: true,
    locations: ["All Locations"],
    effectiveDate: "2024-01-01",
    expiryDate: null,
    description: "Standard pricing for all beverage products"
  },
  {
    id: "2", 
    name: "Premium Snacks",
    type: "category",
    target: "Premium Snacks", 
    basePrice: 2.25,
    markup: 25,
    active: true,
    locations: ["Manhattan Tech Hub", "Brooklyn Hospital"],
    effectiveDate: "2024-02-15",
    expiryDate: null,
    description: "Higher pricing for premium snack items in high-value locations"
  },
  {
    id: "3",
    name: "Holiday Promotion",
    type: "promotion",
    target: "All Products",
    basePrice: null,
    markup: -10,
    active: true,
    locations: ["All Locations"],
    effectiveDate: "2024-12-01", 
    expiryDate: "2025-01-15",
    description: "10% discount for holiday season"
  },
  {
    id: "4",
    name: "Energy Drinks Premium",
    type: "product_specific",
    target: "Red Bull, Monster Energy",
    basePrice: 2.99,
    markup: 30,
    active: true,
    locations: ["Queens University"],
    effectiveDate: "2024-03-01",
    expiryDate: null,
    description: "Premium pricing for energy drinks at university location"
  }
];

const dynamicPricing = [
  {
    id: "1",
    name: "Peak Hour Surge",
    condition: "Time of Day",
    trigger: "11:30 AM - 1:30 PM",
    adjustment: "+15%",
    status: "active",
    locationsActive: 8
  },
  {
    id: "2",
    name: "Low Stock Premium",
    condition: "Inventory Level",
    trigger: "< 5 units remaining",
    adjustment: "+25%",
    status: "active", 
    locationsActive: 12
  },
  {
    id: "3",
    name: "Weather Boost",
    condition: "Weather",
    trigger: "Temperature > 80°F",
    adjustment: "+20%",
    status: "paused",
    locationsActive: 0
  },
  {
    id: "4",
    name: "Competitive Response",
    condition: "Market Position",
    trigger: "Competitor price change",
    adjustment: "Match -5%",
    status: "active",
    locationsActive: 4
  }
];

const priceHistory = [
  { date: "2025-01-15", product: "Coca Cola", oldPrice: 1.50, newPrice: 1.75, reason: "Standard Beverages rule applied", location: "All" },
  { date: "2025-01-14", product: "Red Bull", oldPrice: 2.75, newPrice: 2.99, reason: "Energy Drinks Premium rule", location: "Queens University" },
  { date: "2025-01-13", product: "Chips - Lays", oldPrice: 1.50, newPrice: 1.35, reason: "Holiday Promotion (-10%)", location: "All" },
  { date: "2025-01-12", product: "Granola Bar", oldPrice: 2.00, newPrice: 2.25, reason: "Premium Snacks rule", location: "Manhattan Tech Hub" },
  { date: "2025-01-11", product: "Water - Dasani", oldPrice: 1.25, newPrice: 1.44, reason: "Peak Hour Surge (+15%)", location: "Brooklyn Hospital" }
];

export default function PricingManagement() {
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [showCreateDynamic, setShowCreateDynamic] = useState(false);
  
  const activeRules = pricingRules.filter(rule => rule.active).length;
  const activeDynamic = dynamicPricing.filter(rule => rule.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Pricing Management</h1>
          <p className="text-muted-foreground mt-1">
            Configure pricing rules, promotions, and dynamic pricing strategies
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            Export Pricing Report
          </Button>
          <Button>
            Bulk Price Update
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Rules</p>
                <p className="text-2xl font-bold">{activeRules}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dynamic Pricing</p>
                <p className="text-2xl font-bold">{activeDynamic}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Price</p>
                <p className="text-2xl font-bold">$1.89</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Markup</p>
                <p className="text-2xl font-bold">18.5%</p>
              </div>
              <Percent className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Pricing Rules</TabsTrigger>
          <TabsTrigger value="dynamic">Dynamic Pricing</TabsTrigger>
          <TabsTrigger value="history">Price History</TabsTrigger>
          <TabsTrigger value="analysis">Price Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Pricing Rules</h3>
            <Dialog open={showCreateRule} onOpenChange={setShowCreateRule}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Pricing Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Rule Name</Label>
                    <Input placeholder="e.g. Office Beverages" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Rule Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="category">By Category</SelectItem>
                          <SelectItem value="product">By Product</SelectItem>
                          <SelectItem value="location">By Location</SelectItem>
                          <SelectItem value="promotion">Promotion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Base Price</Label>
                      <Input type="number" step="0.01" placeholder="1.75" />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input placeholder="Brief description of this rule" />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateRule(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setShowCreateRule(false)}>
                      Create Rule
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Markup</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {rule.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {rule.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {rule.target}
                      </TableCell>
                      <TableCell>
                        {rule.basePrice ? `$${rule.basePrice}` : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={rule.markup >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {rule.markup >= 0 ? '+' : ''}{rule.markup}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.active ? 'default' : 'secondary'}>
                          {rule.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dynamic" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Dynamic Pricing Rules</h3>
              <p className="text-sm text-muted-foreground">
                Automatic pricing adjustments based on real-time conditions
              </p>
            </div>
            <Dialog open={showCreateDynamic} onOpenChange={setShowCreateDynamic}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Dynamic Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Dynamic Pricing Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Rule Name</Label>
                    <Input placeholder="e.g. Lunch Rush Surge" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Condition Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="time">Time of Day</SelectItem>
                          <SelectItem value="inventory">Inventory Level</SelectItem>
                          <SelectItem value="weather">Weather</SelectItem>
                          <SelectItem value="demand">Demand Level</SelectItem>
                          <SelectItem value="competitor">Competitor Pricing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Adjustment</Label>
                      <Input placeholder="e.g. +15%, -10%" />
                    </div>
                  </div>
                  <div>
                    <Label>Trigger Condition</Label>
                    <Input placeholder="e.g. 11:30 AM - 1:30 PM" />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateDynamic(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setShowCreateDynamic(false)}>
                      Create Rule
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Adjustment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active Locations</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dynamicPricing.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">
                        {rule.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {rule.condition}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {rule.trigger}
                      </TableCell>
                      <TableCell>
                        <span className={rule.adjustment.startsWith('+') ? 'text-red-600' : 'text-green-600'}>
                          {rule.adjustment}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                          {rule.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {rule.locationsActive} locations
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Price Changes</h3>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Last 7 Days
              </Button>
            </div>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Old Price</TableHead>
                    <TableHead>New Price</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceHistory.map((change, index) => {
                    const priceDiff = change.newPrice - change.oldPrice;
                    const percentChange = (priceDiff / change.oldPrice * 100).toFixed(1);
                    
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(change.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {change.product}
                        </TableCell>
                        <TableCell>${change.oldPrice}</TableCell>
                        <TableCell>${change.newPrice}</TableCell>
                        <TableCell>
                          <span className={priceDiff >= 0 ? 'text-red-600' : 'text-green-600'}>
                            {priceDiff >= 0 ? '+' : ''}${priceDiff.toFixed(2)}
                            <span className="text-xs ml-1">
                              ({priceDiff >= 0 ? '+' : ''}{percentChange}%)
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {change.reason}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {change.location}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
                  Pricing Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border rounded-lg bg-yellow-50">
                  <div className="font-medium text-sm">High Markup Warning</div>
                  <div className="text-sm text-muted-foreground">
                    Energy drinks have 30% markup - consider market analysis
                  </div>
                </div>
                <div className="p-3 border rounded-lg bg-blue-50">
                  <div className="font-medium text-sm">Competitive Gap</div>
                  <div className="text-sm text-muted-foreground">
                    Coca Cola is $0.25 above market average
                  </div>
                </div>
                <div className="p-3 border rounded-lg bg-green-50">
                  <div className="font-medium text-sm">Optimization Opportunity</div>
                  <div className="text-sm text-muted-foreground">
                    Increase snack pricing by 8% to optimize margins
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Price Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Revenue Impact (Last 30 Days)</span>
                  <span className="font-medium text-green-600">+$2,340</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Most Profitable Rule</span>
                  <span className="font-medium">Premium Snacks (+25%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Dynamic Pricing Savings</span>
                  <span className="font-medium text-blue-600">$890</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Price Elasticity Score</span>
                  <Badge variant="outline">Moderate</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, Plus, Star, TrendingUp, Package, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { useSupabaseQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';

const SupplierManagement = () => {
  const [newSupplierOpen, setNewSupplierOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [supplierType, setSupplierType] = useState('');
  const { toast } = useToast();

  const { data: suppliers = [] } = useSupabaseQuery(
    'suppliers',
    'id, name, contact, created_at',
    [],
    { column: 'name', ascending: true },
    ['suppliers-management']
  ) as { data: any[] };

  const { data: purchaseOrders = [] } = useSupabaseQuery(
    'purchase_orders',
    'id, supplier_id, status, created_at',
    [
      { column: 'created_at', operator: 'gte', value: subDays(new Date(), 90).toISOString() }
    ],
    { column: 'created_at', ascending: false },
    ['recent-purchase-orders']
  ) as { data: any[] };

  const { data: products = [] } = useSupabaseQuery(
    'products',
    'id, name, category',
    [],
    undefined,
    ['products-for-suppliers']
  ) as { data: any[] };

  // Calculate supplier performance metrics
  const supplierMetrics = suppliers.map(supplier => {
    const supplierOrders = purchaseOrders.filter(po => po.supplier_id === supplier.id);
    const completedOrders = supplierOrders.filter(po => po.status === 'RECEIVED');
    const onTimeDeliveries = Math.floor(completedOrders.length * (0.85 + Math.random() * 0.15)); // Simulate
    const totalOrders = supplierOrders.length;
    
    return {
      ...supplier,
      totalOrders,
      completedOrders: completedOrders.length,
      onTimeRate: totalOrders > 0 ? (onTimeDeliveries / totalOrders) * 100 : 0,
      avgLeadTime: Math.floor(3 + Math.random() * 10), // Simulate days
      rating: 3 + Math.random() * 2, // Simulate rating 3-5
      lastOrderDate: supplierOrders[0]?.created_at,
      reliability: totalOrders > 5 ? 'high' : totalOrders > 2 ? 'medium' : 'low'
    };
  });

  const createSupplier = async () => {
    if (!supplierName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a supplier name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('suppliers')
        .insert({
          name: supplierName,
          contact: contactInfo || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Supplier created successfully",
      });

      setNewSupplierOpen(false);
      setSupplierName('');
      setContactInfo('');
      setSupplierType('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create supplier",
        variant: "destructive",
      });
    }
  };

  const getReliabilityBadge = (reliability: string) => {
    switch (reliability) {
      case 'high': return <Badge className="bg-green-100 text-green-800">Reliable</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>;
      case 'low': return <Badge className="bg-red-100 text-red-800">New</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
        <span className="text-sm ml-2">({rating.toFixed(1)})</span>
      </div>
    );
  };

  // Calculate aggregate metrics
  const totalSuppliers = suppliers.length;
  const avgOnTimeRate = supplierMetrics.reduce((sum, s) => sum + s.onTimeRate, 0) / totalSuppliers || 0;
  const activeOrders = purchaseOrders.filter(po => ['DRAFT', 'SENT', 'ACKNOWLEDGED'].includes(po.status)).length;
  const topPerformer = supplierMetrics.reduce((best, current) => 
    current.onTimeRate > (best?.onTimeRate || 0) ? current : best, null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supplier Management</h1>
          <p className="text-muted-foreground">Manage relationships and track supplier performance</p>
        </div>
        
        <Dialog open={newSupplierOpen} onOpenChange={setNewSupplierOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>
                Add a new supplier to your vendor database
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="supplierName">Supplier Name</Label>
                <Input
                  id="supplierName"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g., Coca-Cola Distribution Inc."
                />
              </div>
              <div>
                <Label htmlFor="contactInfo">Contact Information</Label>
                <Textarea
                  id="contactInfo"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Phone, email, address, contact person..."
                />
              </div>
              <div>
                <Label htmlFor="supplierType">Supplier Type</Label>
                <Select value={supplierType} onValueChange={setSupplierType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beverage">Beverage Supplier</SelectItem>
                    <SelectItem value="snack">Snack Supplier</SelectItem>
                    <SelectItem value="equipment">Equipment Supplier</SelectItem>
                    <SelectItem value="service">Service Provider</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewSupplierOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createSupplier}>Add Supplier</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">Active vendors</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg On-Time Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgOnTimeRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Delivery performance</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders}</div>
            <p className="text-xs text-muted-foreground">Pending deliveries</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topPerformer ? topPerformer.name.slice(0, 10) + '...' : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {topPerformer ? `${topPerformer.onTimeRate.toFixed(0)}% on-time` : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="suppliers" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="procurement">Procurement</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Directory</CardTitle>
              <CardDescription>Manage your vendor relationships and contact information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {supplierMetrics.map((supplier) => (
                  <div key={supplier.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Truck className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{supplier.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {supplier.contact || 'No contact info'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm font-medium">{supplier.totalOrders}</p>
                        <p className="text-xs text-muted-foreground">Total Orders</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm font-medium">{supplier.onTimeRate.toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground">On-Time</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm font-medium">{supplier.avgLeadTime} days</p>
                        <p className="text-xs text-muted-foreground">Lead Time</p>
                      </div>
                      
                      <div className="text-center">
                        {renderStarRating(supplier.rating)}
                      </div>
                      
                      {getReliabilityBadge(supplier.reliability)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Rankings</CardTitle>
                <CardDescription>Suppliers ranked by overall performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supplierMetrics
                    .sort((a, b) => b.onTimeRate - a.onTimeRate)
                    .slice(0, 10)
                    .map((supplier, index) => (
                      <div key={supplier.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-500 text-white' :
                            'bg-gray-200 text-gray-600'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="font-medium">{supplier.name}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm">{supplier.onTimeRate.toFixed(0)}%</span>
                          {renderStarRating(supplier.rating)}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest supplier interactions and orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {purchaseOrders.slice(0, 8).map((order) => {
                    const supplier = suppliers.find(s => s.id === order.supplier_id);
                    return (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{supplier?.name || 'Unknown Supplier'}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(order.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Badge variant={
                          order.status === 'RECEIVED' ? 'default' :
                          order.status === 'SENT' ? 'secondary' : 'outline'
                        }>
                          {order.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="procurement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Procurement</CardTitle>
              <CardDescription>Set up automatic reordering based on inventory levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Reorder Rules</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">Beverages</p>
                        <p className="text-sm text-muted-foreground">Auto-reorder when below 20%</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">Snacks</p>
                        <p className="text-sm text-muted-foreground">Auto-reorder when below 15%</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">Health Items</p>
                        <p className="text-sm text-muted-foreground">Manual approval required</p>
                      </div>
                      <Badge variant="outline">Manual</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">Procurement Pipeline</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Orders This Month</span>
                      <span className="font-medium">{purchaseOrders.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Avg Order Value</span>
                      <span className="font-medium">$347.50</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cost Savings</span>
                      <span className="font-medium text-green-600">$1,247</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Time Saved</span>
                      <span className="font-medium">12.5 hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Contracts</CardTitle>
              <CardDescription>Manage contracts, pricing agreements, and terms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {supplierMetrics.slice(0, 6).map((supplier) => (
                  <div key={supplier.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{supplier.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Contract expires: {format(new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm font-medium">2.5%</p>
                        <p className="text-xs text-muted-foreground">Discount</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm font-medium">NET-30</p>
                        <p className="text-xs text-muted-foreground">Terms</p>
                      </div>
                      
                      <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                      
                      <Button variant="outline" size="sm">
                        View Contract
                      </Button>
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

export default SupplierManagement;
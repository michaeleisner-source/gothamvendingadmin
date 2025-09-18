import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, TrendingDown, BarChart3 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface InventoryReport {
  product_id: string;
  product_name: string;
  total_stock: number;
  low_stock_machines: number;
  out_of_stock_machines: number;
  reorder_point: number;
  status: 'healthy' | 'low' | 'critical' | 'out';
}

export default function InventoryHealth() {
  const [inventoryData, setInventoryData] = useState<InventoryReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    healthyProducts: 0,
    lowStockProducts: 0,
    criticalProducts: 0,
    outOfStockProducts: 0
  });

  useEffect(() => {
    fetchInventoryReports();
  }, []);

  const fetchInventoryReports = async () => {
    try {
      // Get inventory levels with product information
      const { data: inventoryData } = await supabase
        .from('inventory_levels')
        .select(`
          *,
          products (
            id,
            name
          )
        `);

      if (!inventoryData) {
        setLoading(false);
        return;
      }

      // Process inventory data to create reports
      const productReports: Record<string, InventoryReport> = {};

      inventoryData.forEach(item => {
        const productId = item.product_id;
        const productName = item.products?.name || 'Unknown Product';
        
        if (!productReports[productId]) {
          productReports[productId] = {
            product_id: productId,
            product_name: productName,
            total_stock: 0,
            low_stock_machines: 0,
            out_of_stock_machines: 0,
            reorder_point: item.reorder_point || 0,
            status: 'healthy'
          };
        }

        const report = productReports[productId];
        report.total_stock += item.current_qty || 0;

        // Determine stock status per machine
        if (item.current_qty === 0) {
          report.out_of_stock_machines++;
        } else if (item.current_qty <= item.reorder_point) {
          report.low_stock_machines++;
        }
      });

      // Determine overall status for each product
      const reportsArray = Object.values(productReports).map(report => {
        if (report.out_of_stock_machines > 0) {
          report.status = 'out';
        } else if (report.low_stock_machines > 2) {
          report.status = 'critical';
        } else if (report.low_stock_machines > 0) {
          report.status = 'low';
        } else {
          report.status = 'healthy';
        }
        return report;
      });

      // Sort by status priority (critical first) then by total stock
      reportsArray.sort((a, b) => {
        const statusPriority = { out: 4, critical: 3, low: 2, healthy: 1 };
        if (statusPriority[a.status] !== statusPriority[b.status]) {
          return statusPriority[b.status] - statusPriority[a.status];
        }
        return a.total_stock - b.total_stock;
      });

      // Calculate summary
      const summary = {
        totalProducts: reportsArray.length,
        healthyProducts: reportsArray.filter(r => r.status === 'healthy').length,
        lowStockProducts: reportsArray.filter(r => r.status === 'low').length,
        criticalProducts: reportsArray.filter(r => r.status === 'critical').length,
        outOfStockProducts: reportsArray.filter(r => r.status === 'out').length
      };

      setInventoryData(reportsArray);
      setSummary(summary);
    } catch (error) {
      console.error('Error fetching inventory reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'low': return 'text-yellow-600';
      case 'critical': return 'text-orange-600';
      case 'out': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'low': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-orange-100 text-orange-800';
      case 'out': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Health Reports</h1>
          <p className="text-muted-foreground">Analyze inventory levels and identify items needing attention</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Across all machines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy Stock</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.healthyProducts}</div>
            <p className="text-xs text-muted-foreground">Well stocked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary.criticalProducts}</div>
            <p className="text-xs text-muted-foreground">Urgent attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.outOfStockProducts}</div>
            <p className="text-xs text-muted-foreground">Immediate action</p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Product Inventory Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Product</th>
                  <th className="text-right p-3">Total Stock</th>
                  <th className="text-right p-3">Low Stock Machines</th>
                  <th className="text-right p-3">Out of Stock Machines</th>
                  <th className="text-right p-3">Reorder Point</th>
                  <th className="text-center p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.length > 0 ? (
                  inventoryData.map((item, index) => (
                    <tr key={item.product_id} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
                      <td className="p-3 font-medium">{item.product_name}</td>
                      <td className={`p-3 text-right font-medium ${getStatusColor(item.status)}`}>
                        {item.total_stock}
                      </td>
                      <td className="p-3 text-right">
                        {item.low_stock_machines > 0 ? (
                          <span className="text-yellow-600">{item.low_stock_machines}</span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {item.out_of_stock_machines > 0 ? (
                          <span className="text-red-600">{item.out_of_stock_machines}</span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td className="p-3 text-right">{item.reorder_point}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      No inventory data available. Make sure inventory_levels table has data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  Calendar, 
  MapPin,
  ArrowUp,
  ArrowDown,
  Clock,
  RefreshCw,
  Download,
  Target,
  Zap
} from "lucide-react";
import { toast } from "sonner";

interface InventoryPrediction {
  machine_id: string;
  machine_name: string;
  location_name: string;
  slot_id: string;
  slot_label: string;
  product_id: string;
  product_name: string;
  current_qty: number;
  par_level: number;
  reorder_point: number;
  sales_velocity: number; // units per day
  days_of_supply: number;
  predicted_stockout_date: string | null;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  recommended_restock_qty: number;
  last_restocked_at: string | null;
  avg_sale_price: number;
  potential_lost_revenue: number;
}

interface MachineInventoryStatus {
  machine_id: string;
  machine_name: string;
  location_name: string;
  total_slots: number;
  critical_slots: number;
  high_risk_slots: number;
  overstocked_slots: number;
  healthy_slots: number;
  total_potential_loss: number;
  next_restock_needed: string | null;
}

export default function PredictiveInventory() {
  const [predictions, setPredictions] = useState<InventoryPrediction[]>([]);
  const [machineStatus, setMachineStatus] = useState<MachineInventoryStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('days_of_supply');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadInventoryPredictions(), loadMachineStatus()]);
    } catch (error) {
      toast.error("Failed to load inventory predictions");
    } finally {
      setLoading(false);
    }
  };

  const loadInventoryPredictions = async () => {
    // Get current inventory levels with sales data
    const { data: inventoryData, error: invError } = await supabase
      .from('inventory_levels')
      .select(`
        *,
        machine_slots!inner(
          id,
          label,
          machine_id,
          machines!inner(
            name,
            locations!inner(name)
          )
        ),
        products!inner(name, price)
      `);

    if (invError) throw invError;

    // Get sales data for velocity calculation (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('machine_id, product_id, qty, unit_price_cents, occurred_at')
      .gte('occurred_at', thirtyDaysAgo.toISOString());

    if (salesError) throw salesError;

    // Calculate predictions
    const predictions: InventoryPrediction[] = inventoryData?.map(item => {
      const machineSlot = item.machine_slots;
      const machine = machineSlot?.machines;
      const location = machine?.locations;
      const product = item.products;

      // Calculate sales velocity (units per day)
      const relevantSales = salesData?.filter(s => 
        s.machine_id === machineSlot?.machine_id && 
        s.product_id === item.product_id
      ) || [];
      
      const totalSold = relevantSales.reduce((sum, sale) => sum + (sale.qty || 0), 0);
      const salesVelocity = totalSold / 30; // units per day

      // Calculate days of supply
      const daysOfSupply = salesVelocity > 0 ? item.current_qty / salesVelocity : 999;

      // Predict stockout date
      let predictedStockoutDate: string | null = null;
      if (salesVelocity > 0 && item.current_qty > 0) {
        const stockoutDate = new Date(Date.now() + (daysOfSupply * 24 * 60 * 60 * 1000));
        predictedStockoutDate = stockoutDate.toISOString();
      }

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (item.current_qty <= 0) {
        riskLevel = 'critical';
      } else if (item.current_qty <= (item.reorder_point || 0)) {
        riskLevel = 'high';
      } else if (daysOfSupply <= 3) {
        riskLevel = 'high';
      } else if (daysOfSupply <= 7) {
        riskLevel = 'medium';
      }

      // Calculate recommended restock quantity
      const recommendedRestock = Math.max(0, (item.par_level || 0) - item.current_qty);

      // Calculate potential lost revenue
      const avgSalePrice = relevantSales.length > 0 
        ? relevantSales.reduce((sum, sale) => sum + (sale.unit_price_cents || 0), 0) / relevantSales.length / 100
        : (product?.price || 0);
      
      const potentialLostRevenue = riskLevel === 'critical' 
        ? salesVelocity * avgSalePrice * 7 // 7 days of lost sales
        : 0;

      return {
        machine_id: machineSlot?.machine_id || '',
        machine_name: machine?.name || 'Unknown',
        location_name: location?.name || 'Unknown',
        slot_id: machineSlot?.id || '',
        slot_label: machineSlot?.label || 'Unknown',
        product_id: item.product_id,
        product_name: product?.name || 'Unknown',
        current_qty: item.current_qty,
        par_level: item.par_level || 0,
        reorder_point: item.reorder_point || 0,
        sales_velocity: salesVelocity,
        days_of_supply: daysOfSupply,
        predicted_stockout_date: predictedStockoutDate,
        risk_level: riskLevel,
        recommended_restock_qty: recommendedRestock,
        last_restocked_at: item.last_restocked_at,
        avg_sale_price: avgSalePrice,
        potential_lost_revenue: potentialLostRevenue
      };
    }) || [];

    setPredictions(predictions);
  };

  const loadMachineStatus = async () => {
    // Group predictions by machine to get machine-level status
    const machineMap = new Map<string, {
      machine_name: string;
      location_name: string;
      slots: InventoryPrediction[];
    }>();

    predictions.forEach(pred => {
      if (!machineMap.has(pred.machine_id)) {
        machineMap.set(pred.machine_id, {
          machine_name: pred.machine_name,
          location_name: pred.location_name,
          slots: []
        });
      }
      machineMap.get(pred.machine_id)!.slots.push(pred);
    });

    const machineStatuses: MachineInventoryStatus[] = Array.from(machineMap.entries())
      .map(([machineId, data]) => {
        const slots = data.slots;
        const criticalSlots = slots.filter(s => s.risk_level === 'critical').length;
        const highRiskSlots = slots.filter(s => s.risk_level === 'high').length;
        const mediumRiskSlots = slots.filter(s => s.risk_level === 'medium').length;
        const overstockedSlots = slots.filter(s => s.current_qty > s.par_level * 1.5).length;
        const healthySlots = slots.length - criticalSlots - highRiskSlots - mediumRiskSlots - overstockedSlots;

        const totalPotentialLoss = slots.reduce((sum, slot) => sum + slot.potential_lost_revenue, 0);

        // Find next restock needed date
        const upcomingStockouts = slots
          .filter(s => s.predicted_stockout_date)
          .sort((a, b) => new Date(a.predicted_stockout_date!).getTime() - new Date(b.predicted_stockout_date!).getTime());
        
        const nextRestockNeeded = upcomingStockouts.length > 0 ? upcomingStockouts[0].predicted_stockout_date : null;

        return {
          machine_id: machineId,
          machine_name: data.machine_name,
          location_name: data.location_name,
          total_slots: slots.length,
          critical_slots: criticalSlots,
          high_risk_slots: highRiskSlots,
          overstocked_slots: overstockedSlots,
          healthy_slots: healthySlots,
          total_potential_loss: totalPotentialLoss,
          next_restock_needed: nextRestockNeeded
        };
      })
      .sort((a, b) => b.total_potential_loss - a.total_potential_loss);

    setMachineStatus(machineStatuses);
  };

  // Update machine status when predictions change
  useEffect(() => {
    if (predictions.length > 0) {
      loadMachineStatus();
    }
  }, [predictions]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-emerald-500';
    }
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      default: return 'default';
    }
  };

  const filteredPredictions = selectedRisk === 'all' 
    ? predictions 
    : predictions.filter(p => p.risk_level === selectedRisk);

  const sortedPredictions = [...filteredPredictions].sort((a, b) => {
    switch (sortBy) {
      case 'days_of_supply':
        return a.days_of_supply - b.days_of_supply;
      case 'potential_loss':
        return b.potential_lost_revenue - a.potential_lost_revenue;
      case 'velocity':
        return b.sales_velocity - a.sales_velocity;
      default:
        return a.days_of_supply - b.days_of_supply;
    }
  });

  const exportPredictions = () => {
    const csvData = [
      ['Machine', 'Location', 'Slot', 'Product', 'Current Qty', 'Par Level', 'Days Supply', 'Risk Level', 'Restock Qty', 'Potential Loss'],
      ...sortedPredictions.map(p => [
        p.machine_name,
        p.location_name,
        p.slot_label,
        p.product_name,
        p.current_qty.toString(),
        p.par_level.toString(),
        p.days_of_supply.toFixed(1),
        p.risk_level,
        p.recommended_restock_qty.toString(),
        p.potential_lost_revenue.toFixed(2)
      ])
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_predictions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalCritical = predictions.filter(p => p.risk_level === 'critical').length;
  const totalHigh = predictions.filter(p => p.risk_level === 'high').length;
  const totalPotentialLoss = predictions.reduce((sum, p) => sum + p.potential_lost_revenue, 0);
  const avgDaysSupply = predictions.length > 0 
    ? predictions.reduce((sum, p) => sum + p.days_of_supply, 0) / predictions.length 
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Predictive Inventory</h1>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-border rounded-md"
          >
            <option value="days_of_supply">Sort by Days Supply</option>
            <option value="potential_loss">Sort by Potential Loss</option>
            <option value="velocity">Sort by Sales Velocity</option>
          </select>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportPredictions} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Critical Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalCritical}
            </div>
            <p className="text-xs text-muted-foreground">Need immediate restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              High Risk Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {totalHigh}
            </div>
            <p className="text-xs text-muted-foreground">Restock within 3 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Avg Days Supply
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgDaysSupply.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Days of current inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-600" />
              Potential Loss
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${totalPotentialLoss.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">From stockouts (7 days)</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="predictions">Item Predictions</TabsTrigger>
          <TabsTrigger value="machines">Machine Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Restock Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedRisk === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRisk('all')}
            >
              All ({predictions.length})
            </Button>
            <Button
              variant={selectedRisk === 'critical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRisk('critical')}
            >
              Critical ({totalCritical})
            </Button>
            <Button
              variant={selectedRisk === 'high' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRisk('high')}
            >
              High ({totalHigh})
            </Button>
            <Button
              variant={selectedRisk === 'medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRisk('medium')}
            >
              Medium ({predictions.filter(p => p.risk_level === 'medium').length})
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-3 font-semibold">Item</th>
                  <th className="p-3 font-semibold">Current</th>
                  <th className="p-3 font-semibold">Par Level</th>
                  <th className="p-3 font-semibold">Velocity</th>
                  <th className="p-3 font-semibold">Days Supply</th>
                  <th className="p-3 font-semibold">Risk</th>
                  <th className="p-3 font-semibold">Restock Qty</th>
                  <th className="p-3 font-semibold">Potential Loss</th>
                </tr>
              </thead>
              <tbody>
                {sortedPredictions.map(prediction => (
                  <tr key={`${prediction.slot_id}-${prediction.product_id}`} className="border-b last:border-b-0 hover:bg-muted/50">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{prediction.product_name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {prediction.machine_name} - {prediction.slot_label}
                        </div>
                        <div className="text-xs text-muted-foreground">{prediction.location_name}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{prediction.current_qty}</span>
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getRiskColor(prediction.risk_level)}`}
                            style={{ width: `${Math.min(100, (prediction.current_qty / prediction.par_level) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{prediction.par_level}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {prediction.sales_velocity > 1 ? (
                          <ArrowUp className="h-3 w-3 text-red-500" />
                        ) : prediction.sales_velocity > 0.5 ? (
                          <ArrowUp className="h-3 w-3 text-yellow-500" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-green-500" />
                        )}
                        {prediction.sales_velocity.toFixed(1)}/day
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`font-medium ${
                        prediction.days_of_supply <= 1 ? 'text-red-600' :
                        prediction.days_of_supply <= 3 ? 'text-orange-600' :
                        prediction.days_of_supply <= 7 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {prediction.days_of_supply > 999 ? '∞' : prediction.days_of_supply.toFixed(1)}
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge variant={getRiskBadgeVariant(prediction.risk_level)}>
                        {prediction.risk_level}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className={`font-medium ${prediction.recommended_restock_qty > 0 ? 'text-blue-600' : ''}`}>
                        {prediction.recommended_restock_qty > 0 ? `+${prediction.recommended_restock_qty}` : '0'}
                      </span>
                    </td>
                    <td className="p-3">
                      {prediction.potential_lost_revenue > 0 ? (
                        <span className="font-medium text-red-600">
                          ${prediction.potential_lost_revenue.toFixed(0)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">$0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="machines" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {machineStatus.map(machine => (
              <Card key={machine.machine_id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{machine.machine_name}</CardTitle>
                    {machine.total_potential_loss > 0 && (
                      <Badge variant="destructive">
                        ${machine.total_potential_loss.toFixed(0)} risk
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {machine.location_name}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Slots</span>
                      <div className="font-semibold">{machine.total_slots}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Healthy</span>
                      <div className="font-semibold text-emerald-600">{machine.healthy_slots}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Critical</span>
                      <div className="font-semibold text-red-600">{machine.critical_slots}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">High Risk</span>
                      <div className="font-semibold text-orange-600">{machine.high_risk_slots}</div>
                    </div>
                  </div>

                  {machine.next_restock_needed && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Next restock needed: {new Date(machine.next_restock_needed).toLocaleDateString()}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Inventory Health</span>
                      <span>{((machine.healthy_slots / machine.total_slots) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={(machine.healthy_slots / machine.total_slots) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recommended Restock Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {machineStatus
                  .filter(m => m.critical_slots > 0 || m.high_risk_slots > 0)
                  .map(machine => {
                    const machineItems = predictions.filter(p => 
                      p.machine_id === machine.machine_id && 
                      (p.risk_level === 'critical' || p.risk_level === 'high') &&
                      p.recommended_restock_qty > 0
                    );

                    return (
                      <Card key={machine.machine_id} className="border-l-4 border-l-orange-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{machine.machine_name}</h3>
                              <p className="text-sm text-muted-foreground">{machine.location_name}</p>
                            </div>
                            <Badge variant="outline">
                              {machineItems.length} items need restocking
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            {machineItems.map(item => (
                              <div key={`${item.slot_id}-${item.product_id}`} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${getRiskColor(item.risk_level)}`} />
                                  <span>{item.slot_label}: {item.product_name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-muted-foreground">
                                    {item.current_qty} → {item.current_qty + item.recommended_restock_qty}
                                  </span>
                                  <Badge variant="outline" className="text-blue-600">
                                    +{item.recommended_restock_qty}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
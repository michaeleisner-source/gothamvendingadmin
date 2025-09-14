import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, DollarSign, Package, AlertTriangle } from 'lucide-react';
import ProfitReports from './ProfitReports';
import CostAnalysis from './CostAnalysis';
import ReportsROI from './ReportsROI';
import SalesSummary7d from './reports/SalesSummary';
import { supabase } from '@/integrations/supabase/client';

const EnhancedReports = () => {
  const [silentMachines, setSilentMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSilentMachines();
  }, []);

  const loadSilentMachines = async () => {
    try {
      const { data, error } = await supabase.rpc('rpc_machine_silence_alerts', { _hours: 48 });
      if (error) throw error;
      setSilentMachines(data || []);
    } catch (error) {
      console.error('Error loading silent machines:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Business Reports</h1>
      </div>

      <Tabs defaultValue="profit" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profit" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Profit Reports
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Cost Analysis
          </TabsTrigger>
          <TabsTrigger value="roi" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            ROI Analysis
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Sales Summary
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Machine Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profit">
          <ProfitReports />
        </TabsContent>

        <TabsContent value="costs">
          <CostAnalysis />
        </TabsContent>

        <TabsContent value="roi">
          <ReportsROI />
        </TabsContent>

        <TabsContent value="sales">
          <SalesSummary7d />
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Silent Machine Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse">Loading machine health data...</div>
                </div>
              ) : silentMachines.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-green-600 mb-2">
                    <BarChart3 className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-lg font-medium">All Machines Active!</p>
                  <p className="text-muted-foreground">No silent machine alerts at this time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    Machines with no sales in the last 48+ hours:
                  </div>
                  <div className="grid gap-4">
                    {silentMachines.map((machine: any, index: number) => (
                      <Card key={index} className="border-destructive/20 bg-destructive/5">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{machine.machine_name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Last sale: {machine.last_sale_at 
                                  ? new Date(machine.last_sale_at).toLocaleDateString() 
                                  : 'No sales recorded'
                                }
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-destructive">
                                {Math.round(machine.hours_since_last_sale)}h silent
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedReports;
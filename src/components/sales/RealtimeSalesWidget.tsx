import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Clock,
  Zap,
  Bell
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Sale {
  id: string;
  product_name: string;
  unit_price_cents: number;
  qty: number;
  total_amount: number;
  occurred_at: string;
  machine_id: string;
}

interface RealtimeSalesWidgetProps {
  className?: string;
}

export function RealtimeSalesWidget({ className }: RealtimeSalesWidgetProps) {
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [todaysStats, setTodaysStats] = useState({
    revenue: 0,
    transactions: 0,
    items: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
    
    // Set up real-time subscription for new sales
    const salesChannel = supabase
      .channel('sales-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales'
        },
        (payload) => {
          const newSale = payload.new as Sale;
          handleNewSale(newSale);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(salesChannel);
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      // Get recent sales
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(10);

      if (salesError) throw salesError;

      setRecentSales(salesData || []);

      // Calculate today's stats
      const today = new Date().toISOString().split('T')[0];
      const todaySales = (salesData || []).filter(sale => 
        sale.occurred_at?.startsWith(today)
      );

      const todayRevenue = todaySales.reduce((sum, sale) => 
        sum + (sale.total_amount || 0), 0
      );
      
      const todayItems = todaySales.reduce((sum, sale) => 
        sum + (sale.qty || sale.quantity_sold || 0), 0
      );

      setTodaysStats({
        revenue: todayRevenue,
        transactions: todaySales.length,
        items: todayItems
      });

    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSale = (newSale: Sale) => {
    // Add to recent sales
    setRecentSales(prev => [newSale, ...prev.slice(0, 9)]);
    
    // Update today's stats if it's from today
    const today = new Date().toISOString().split('T')[0];
    if (newSale.occurred_at?.startsWith(today)) {
      setTodaysStats(prev => ({
        revenue: prev.revenue + (newSale.total_amount || 0),
        transactions: prev.transactions + 1,
        items: prev.items + (newSale.qty || 1)
      }));

      // Show notification
      toast({
        title: "🎉 New Sale!",
        description: `${newSale.product_name} - $${(newSale.total_amount || 0).toFixed(2)}`,
      });
    }
  };

  const formatPrice = (amount: number) => `$${amount.toFixed(2)}`;
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Live Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-500" />
            Live Sales
          </div>
          <Badge variant="secondary" className="animate-pulse">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            LIVE
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="flex items-center justify-center mb-1">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-lg font-bold text-green-600">
              {formatPrice(todaysStats.revenue)}
            </div>
            <div className="text-xs text-muted-foreground">Today</div>
          </div>
          
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="flex items-center justify-center mb-1">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-blue-600">
              {todaysStats.transactions}
            </div>
            <div className="text-xs text-muted-foreground">Sales</div>
          </div>
          
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-lg font-bold text-purple-600">
              {todaysStats.items}
            </div>
            <div className="text-xs text-muted-foreground">Items</div>
          </div>
        </div>

        <Separator />

        {/* Recent Sales */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Recent Sales
          </h4>
          
          {recentSales.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <ShoppingCart className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No sales yet today</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentSales.map((sale) => (
                <div 
                  key={sale.id} 
                  className="flex items-center justify-between p-2 bg-muted/30 rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {sale.product_name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(sale.occurred_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">
                      {formatPrice(sale.total_amount || 0)}
                    </p>
                    {sale.qty > 1 && (
                      <p className="text-xs text-muted-foreground">
                        {sale.qty} items
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
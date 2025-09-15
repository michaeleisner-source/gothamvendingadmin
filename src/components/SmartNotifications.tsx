import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, Clock, TrendingDown, Zap, 
  PackageX, DollarSign, MapPin, X 
} from 'lucide-react';
import { useVendingData } from '@/hooks/useVendingData';

type NotificationType = 'critical' | 'warning' | 'info' | 'success';

interface SmartNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  action?: {
    label: string;
    handler: () => void;
  };
  dismissible: boolean;
  timestamp: Date;
}

export function SmartNotifications() {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const { useMachineHealth, useInventoryWithAlerts, useRestockSuggestions } = useVendingData();
  
  const { data: machineHealth } = useMachineHealth();
  const { data: inventoryAlerts } = useInventoryWithAlerts();
  const { data: restockSuggestions } = useRestockSuggestions();

  useEffect(() => {
    const newNotifications: SmartNotification[] = [];

    // Critical machine alerts
    if (machineHealth) {
      const silentMachines = machineHealth.filter((m: any) => 
        m.since_last_sale && m.since_last_sale > '2 days'
      );
      
      if (silentMachines.length > 0) {
        newNotifications.push({
          id: 'silent-machines',
          type: 'critical',
          title: `${silentMachines.length} Silent Machines Detected`,
          message: 'Machines haven\'t recorded sales in 48+ hours',
          action: {
            label: 'View Details',
            handler: () => window.location.href = '/reports'
          },
          dismissible: false,
          timestamp: new Date()
        });
      }
    }

    // Out of stock alerts
    if (inventoryAlerts) {
      const outOfStock = inventoryAlerts.filter((i: any) => i.current_qty === 0);
      
      if (outOfStock.length > 0) {
        newNotifications.push({
          id: 'out-of-stock',
          type: 'critical',
          title: `${outOfStock.length} Machines Out of Stock`,
          message: 'Immediate restocking required for revenue recovery',
          action: {
            label: 'Auto-Restock',
            handler: () => handleAutoRestock(outOfStock)
          },
          dismissible: false,
          timestamp: new Date()
        });
      }

      // High-risk low stock
      const highRisk = inventoryAlerts.filter((i: any) => 
        i.risk_score >= 80 && i.current_qty > 0
      );
      
      if (highRisk.length > 0) {
        newNotifications.push({
          id: 'high-risk-stock',
          type: 'warning',
          title: `${highRisk.length} High-Risk Stock Items`,
          message: 'Items likely to run out within 24 hours',
          action: {
            label: 'Plan Restock',
            handler: () => window.location.href = '/inventory'
          },
          dismissible: true,
          timestamp: new Date()
        });
      }
    }

    // Revenue opportunity alerts
    if (restockSuggestions && restockSuggestions.length > 0) {
      const totalValue = restockSuggestions.reduce((sum: number, s: any) => sum + s.total_value, 0);
      
      newNotifications.push({
        id: 'revenue-opportunity',
        type: 'info',
        title: `$${totalValue.toFixed(0)} Revenue Opportunity`,
        message: `${restockSuggestions.length} machines ready for optimized restocking`,
        action: {
          label: 'View Routes',
          handler: () => window.location.href = '/delivery-routes'
        },
        dismissible: true,
        timestamp: new Date()
      });
    }

    setNotifications(newNotifications);
  }, [machineHealth, inventoryAlerts, restockSuggestions]);

  const handleAutoRestock = (items: any[]) => {
    // Group by machine and trigger auto-restock
    const byMachine = items.reduce((acc: any, item) => {
      if (!acc[item.machine_id]) acc[item.machine_id] = [];
      acc[item.machine_id].push(item);
      return acc;
    }, {});

    console.log('Auto-restock triggered for:', byMachine);
    // Implementation would use the useAutoRestock hook
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'warning': return <Clock className="w-4 h-4" />;
      case 'info': return <TrendingDown className="w-4 h-4" />;
      case 'success': return <Zap className="w-4 h-4" />;
    }
  };

  const getColorClasses = (type: NotificationType) => {
    switch (type) {
      case 'critical': return 'border-red-200 bg-red-50 text-red-800';
      case 'warning': return 'border-orange-200 bg-orange-50 text-orange-800';
      case 'info': return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'success': return 'border-green-200 bg-green-50 text-green-800';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {notifications.map(notification => (
        <Card key={notification.id} className={`${getColorClasses(notification.type)} shadow-lg`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {getIcon(notification.type)}
                <div className="flex-1">
                  <div className="font-medium text-sm">{notification.title}</div>
                  <div className="text-xs mt-1 opacity-90">{notification.message}</div>
                  {notification.action && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2 h-7 text-xs"
                      onClick={notification.action.handler}
                    >
                      {notification.action.label}
                    </Button>
                  )}
                </div>
              </div>
              {notification.dismissible && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-black/10"
                  onClick={() => dismissNotification(notification.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default SmartNotifications;
import React, { useEffect, useState } from 'react';
import { PushNotifications as CapacitorPushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PushNotifications() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [token, setToken] = useState<string>('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    initializePushNotifications();
  }, []);

  const initializePushNotifications = async () => {
    try {
      // Request permission
      const permission = await CapacitorPushNotifications.requestPermissions();
      
      if (permission.receive === 'granted') {
        await CapacitorPushNotifications.register();
        setIsEnabled(true);
      }

      // Register listeners
      CapacitorPushNotifications.addListener('registration', (token: Token) => {
        setToken(token.value);
        toast({
          title: "Push Notifications Enabled",
          description: "You'll receive important updates"
        });
      });

      CapacitorPushNotifications.addListener('registrationError', (error: any) => {
        console.error('Push notification registration error:', error);
        toast({
          title: "Notification Setup Failed",
          description: "Unable to enable push notifications",
          variant: "destructive"
        });
      });

      CapacitorPushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        setNotifications(prev => [notification, ...prev.slice(0, 9)]);
        toast({
          title: notification.title || "New Notification",
          description: notification.body
        });
      });

      CapacitorPushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        console.log('Push notification action performed:', notification);
      });

    } catch (error) {
      console.error('Push notification initialization error:', error);
    }
  };

  const sendTestNotification = async () => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Test Notification',
            body: 'This is a test local notification from your vending app!',
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) }
          }
        ]
      });

      toast({
        title: "Test Notification Sent",
        description: "Check your notification panel"
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Notification Error",
        description: "Failed to send test notification",
        variant: "destructive"
      });
    }
  };

  const sendInventoryAlert = async () => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Low Stock Alert',
            body: 'Machine #VM001 - Coca Cola is running low (2 remaining)',
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) }
          }
        ]
      });
    } catch (error) {
      console.error('Error sending inventory alert:', error);
    }
  };

  const sendMaintenanceAlert = async () => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Maintenance Required',
            body: 'Machine #VM003 requires scheduled maintenance',
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) }
          }
        ]
      });
    } catch (error) {
      console.error('Error sending maintenance alert:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          Push Notifications
          <Badge variant={isEnabled ? "default" : "secondary"}>
            {isEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <Button 
            onClick={sendTestNotification}
            disabled={!isEnabled}
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Send Test Notification
          </Button>
          
          <Button 
            onClick={sendInventoryAlert}
            disabled={!isEnabled}
            variant="outline"
            className="flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            Test Low Stock Alert
          </Button>

          <Button 
            onClick={sendMaintenanceAlert}
            disabled={!isEnabled}
            variant="outline"
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Test Maintenance Alert
          </Button>
        </div>

        {token && (
          <div className="mt-4 p-2 bg-muted rounded text-xs">
            <strong>Device Token:</strong> {token.substring(0, 20)}...
          </div>
        )}

        {notifications.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Recent Notifications</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {notifications.map((notif, index) => (
                <div key={index} className="p-2 bg-muted/50 rounded text-sm">
                  <div className="font-medium">{notif.title}</div>
                  <div className="text-muted-foreground">{notif.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
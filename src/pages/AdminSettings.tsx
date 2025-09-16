import React, { useState, useEffect } from 'react';
import { Settings, Building2, DollarSign, Clock, MapPin, Save, Bell, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Header } from '@/components/ui/Header';
import { useToast } from '@/hooks/use-toast';

interface OrganizationSettings {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website: string;
  timezone: string;
  currency: string;
  tax_rate: number;
  default_margin_target: number;
  fiscal_year_start: string;
}

interface NotificationSettings {
  email_alerts: boolean;
  sms_alerts: boolean;
  low_inventory_threshold: number;
  machine_offline_minutes: number;
  daily_reports: boolean;
  weekly_reports: boolean;
  monthly_reports: boolean;
}

const AdminSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings>({
    name: 'Gotham Vending Co.',
    address: '123 Gotham Ave',
    city: 'Gotham',
    state: 'NY',
    zip: '12345',
    phone: '(555) 123-4567',
    email: 'contact@gothamvending.com',
    website: 'gothamvending.com',
    timezone: 'America/New_York',
    currency: 'USD',
    tax_rate: 8.25,
    default_margin_target: 50,
    fiscal_year_start: 'January'
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_alerts: true,
    sms_alerts: false,
    low_inventory_threshold: 3,
    machine_offline_minutes: 60,
    daily_reports: true,
    weekly_reports: true,
    monthly_reports: false
  });

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const handleSaveOrgSettings = async () => {
    setSaving(true);
    try {
      // TODO: Implement Supabase save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings saved",
        description: "Organization settings have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "Failed to save organization settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      // TODO: Implement Supabase save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Notifications updated",
        description: "Notification preferences have been saved",
      });
    } catch (error) {
      toast({
        title: "Error saving notifications",
        description: "Failed to save notification settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-6"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Header 
        title="Organization Settings" 
        subtitle="Configure your organization's preferences and operational parameters" 
      />

      <Tabs defaultValue="organization" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={orgSettings.name}
                    onChange={(e) => setOrgSettings({...orgSettings, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={orgSettings.timezone} 
                    onValueChange={(value) => setOrgSettings({...orgSettings, timezone: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={orgSettings.address}
                  onChange={(e) => setOrgSettings({...orgSettings, address: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={orgSettings.city}
                    onChange={(e) => setOrgSettings({...orgSettings, city: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={orgSettings.state}
                    onChange={(e) => setOrgSettings({...orgSettings, state: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={orgSettings.zip}
                    onChange={(e) => setOrgSettings({...orgSettings, zip: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={orgSettings.phone}
                    onChange={(e) => setOrgSettings({...orgSettings, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={orgSettings.email}
                    onChange={(e) => setOrgSettings({...orgSettings, email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={orgSettings.website}
                  onChange={(e) => setOrgSettings({...orgSettings, website: e.target.value})}
                />
              </div>

              <Button onClick={handleSaveOrgSettings} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Organization Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={orgSettings.currency} 
                    onValueChange={(value) => setOrgSettings({...orgSettings, currency: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    value={orgSettings.tax_rate}
                    onChange={(e) => setOrgSettings({...orgSettings, tax_rate: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="marginTarget">Default Margin Target (%)</Label>
                  <Input
                    id="marginTarget"
                    type="number"
                    value={orgSettings.default_margin_target}
                    onChange={(e) => setOrgSettings({...orgSettings, default_margin_target: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="fiscalYear">Fiscal Year Start</Label>
                  <Select 
                    value={orgSettings.fiscal_year_start} 
                    onValueChange={(value) => setOrgSettings({...orgSettings, fiscal_year_start: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="January">January</SelectItem>
                      <SelectItem value="April">April</SelectItem>
                      <SelectItem value="July">July</SelectItem>
                      <SelectItem value="October">October</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSaveOrgSettings} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Financial Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Alerts</Label>
                    <p className="text-sm text-muted-foreground">Receive alerts via email</p>
                  </div>
                  <Switch
                    checked={notifications.email_alerts}
                    onCheckedChange={(checked) => setNotifications({...notifications, email_alerts: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Alerts</Label>
                    <p className="text-sm text-muted-foreground">Receive alerts via SMS</p>
                  </div>
                  <Switch
                    checked={notifications.sms_alerts}
                    onCheckedChange={(checked) => setNotifications({...notifications, sms_alerts: checked})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lowInventory">Low Inventory Threshold</Label>
                  <Input
                    id="lowInventory"
                    type="number"
                    value={notifications.low_inventory_threshold}
                    onChange={(e) => setNotifications({...notifications, low_inventory_threshold: parseInt(e.target.value)})}
                  />
                  <p className="text-sm text-muted-foreground mt-1">Alert when inventory falls below this level</p>
                </div>
                <div>
                  <Label htmlFor="offlineTime">Machine Offline Alert (minutes)</Label>
                  <Input
                    id="offlineTime"
                    type="number"
                    value={notifications.machine_offline_minutes}
                    onChange={(e) => setNotifications({...notifications, machine_offline_minutes: parseInt(e.target.value)})}
                  />
                  <p className="text-sm text-muted-foreground mt-1">Alert when machine is offline for this duration</p>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Report Delivery</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="dailyReports"
                      checked={notifications.daily_reports}
                      onCheckedChange={(checked) => setNotifications({...notifications, daily_reports: checked})}
                    />
                    <Label htmlFor="dailyReports">Daily Reports</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="weeklyReports"
                      checked={notifications.weekly_reports}
                      onCheckedChange={(checked) => setNotifications({...notifications, weekly_reports: checked})}
                    />
                    <Label htmlFor="weeklyReports">Weekly Reports</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="monthlyReports"
                      checked={notifications.monthly_reports}
                      onCheckedChange={(checked) => setNotifications({...notifications, monthly_reports: checked})}
                    />
                    <Label htmlFor="monthlyReports">Monthly Reports</Label>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveNotifications} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Notification Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add an extra layer of security to your account by requiring a second form of authentication.
                </p>
                <Button variant="outline">
                  Configure 2FA
                </Button>
              </div>

              <div className="p-4 border rounded-lg bg-muted/50">
                <h3 className="font-medium mb-2">API Keys</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage API keys for integrations and third-party applications.
                </p>
                <Button variant="outline">
                  Manage API Keys
                </Button>
              </div>

              <div className="p-4 border rounded-lg bg-muted/50">
                <h3 className="font-medium mb-2">Session Management</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  View and manage active sessions across all devices.
                </p>
                <Button variant="outline">
                  View Active Sessions
                </Button>
              </div>

              <div className="p-4 border rounded-lg bg-muted/50">
                <h3 className="font-medium mb-2">Data Export</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Export your organization's data for backup or migration purposes.
                </p>
                <Button variant="outline">
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
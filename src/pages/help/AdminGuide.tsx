import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Settings, DollarSign, Database, AlertTriangle } from 'lucide-react';

export default function AdminGuide() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Administrator Guide</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Adding New Users</h3>
            <ol className="space-y-1 text-sm text-muted-foreground">
              <li>1. Go to <strong>Admin → Staff Management</strong></li>
              <li>2. Click <strong>Add New User</strong></li>
              <li>3. Enter user details and assign role</li>
              <li>4. Set permissions based on responsibilities</li>
              <li>5. Send login credentials securely</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">User Roles & Permissions</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="p-3 rounded-lg bg-muted">
                <h4 className="font-medium">Owner</h4>
                <p className="text-sm text-muted-foreground">Full system access</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <h4 className="font-medium">Manager</h4>
                <p className="text-sm text-muted-foreground">All operations except billing</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <h4 className="font-medium">Operator</h4>
                <p className="text-sm text-muted-foreground">Daily operations and reporting</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <h4 className="font-medium">Viewer</h4>
                <p className="text-sm text-muted-foreground">Read-only access to reports</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Organization Settings</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Company information and branding</li>
              <li>• Default commission structures</li>
              <li>• Alert thresholds and notifications</li>
              <li>• Integration settings</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Machine Setup Process</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li><strong>1. Add New Machine:</strong></li>
              <li className="ml-4">• Enter machine details and location</li>
              <li className="ml-4">• Configure slot layout and capacity</li>
              <li className="ml-4">• Set pricing and commission rates</li>
              <li className="ml-4">• Test connectivity and telemetry</li>
              <li><strong>2. Machine Templates:</strong></li>
              <li className="ml-4">• Create templates for common configurations</li>
              <li className="ml-4">• Standardize slot layouts across machines</li>
              <li className="ml-4">• Set default pricing strategies</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Administration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Commission Management</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Set location-specific rates</li>
              <li>• Configure tier structures</li>
              <li>• Manage payment schedules</li>
              <li>• Generate statements</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Reporting Controls</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Configure automated reports</li>
              <li>• Set up dashboard metrics</li>
              <li>• Manage data retention</li>
              <li>• Export capabilities</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Security & Backups
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Data Security</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Regular password updates</li>
              <li>• Two-factor authentication setup</li>
              <li>• User access auditing</li>
              <li>• Session management</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Backup Procedures</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Daily automated backups</li>
              <li>• Weekly full system backup</li>
              <li>• Monthly archive creation</li>
              <li>• Disaster recovery testing</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Common Issues</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Machine Offline:</span>
                <span className="text-muted-foreground ml-2">Check network connectivity</span>
              </div>
              <div>
                <span className="font-medium">Inventory Discrepancies:</span>
                <span className="text-muted-foreground ml-2">Verify restocking entries</span>
              </div>
              <div>
                <span className="font-medium">Commission Errors:</span>
                <span className="text-muted-foreground ml-2">Review rate configurations</span>
              </div>
              <div>
                <span className="font-medium">Report Issues:</span>
                <span className="text-muted-foreground ml-2">Check date ranges and filters</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">System Maintenance</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Database optimization monthly</li>
              <li>• Cache clearing procedures</li>
              <li>• Performance monitoring</li>
              <li>• Update scheduling</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
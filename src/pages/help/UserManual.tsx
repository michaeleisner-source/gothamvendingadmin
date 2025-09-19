import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, BarChart3, MapPin, Package, DollarSign, Settings, FileText } from 'lucide-react';

const sections = [
  {
    id: 'overview',
    title: 'System Overview',
    icon: BookOpen,
    content: `This vending machine management system helps you track locations, machines, inventory, sales, and finances across your entire operation.`
  },
  {
    id: 'modules',
    title: 'Main Modules',
    icon: Settings,
    content: `The system is organized into key modules for different aspects of your business.`
  },
  {
    id: 'navigation',
    title: 'Navigation',
    icon: MapPin,
    content: `Use the sidebar to access different modules. The search bar helps find specific locations, machines, or products quickly.`
  }
];

const modules = [
  { name: 'Dashboard', icon: BarChart3, description: 'Real-time overview of your business performance and key metrics' },
  { name: 'Prospects', icon: Users, description: 'Manage potential locations and track your sales pipeline' },
  { name: 'Locations', icon: MapPin, description: 'Active vending sites with contact and performance information' },
  { name: 'Machines', icon: Settings, description: 'Equipment tracking, health monitoring, and maintenance' },
  { name: 'Inventory', icon: Package, description: 'Stock management, alerts, and restocking workflows' },
  { name: 'Products', icon: Package, description: 'Product catalog, pricing, and profitability analysis' },
  { name: 'Sales', icon: DollarSign, description: 'Transaction recording, analysis, and revenue tracking' },
  { name: 'Reports', icon: BarChart3, description: 'Business intelligence, analytics, and custom reports' },
  { name: 'Contracts', icon: FileText, description: 'Legal agreements, document management, and signatures' },
  { name: 'Finance', icon: DollarSign, description: 'Revenue tracking, costs analysis, and commission management' }
];

export default function UserManual() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Complete User Manual</h1>
      </div>

      <div className="grid gap-6">
        {sections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <section.icon className="h-5 w-5" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{section.content}</p>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {modules.map((module) => (
                <div key={module.name} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <module.icon className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">{module.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Help</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium">Help Center</h4>
                <p className="text-sm text-muted-foreground">Use the Help Center for detailed guides and step-by-step instructions.</p>
              </div>
              <div>
                <h4 className="font-medium">Admin Section</h4>
                <p className="text-sm text-muted-foreground">Check the Admin section for advanced features and system configuration.</p>
              </div>
              <div>
                <h4 className="font-medium">Support</h4>
                <p className="text-sm text-muted-foreground">Contact support for technical issues or questions not covered in documentation.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import React from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  DollarSign,
  Users,
  Star,
  Calendar,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

// Demo customer detail data  
const customerDetails = {
  "1": {
    id: "1",
    name: "Manhattan Tech Hub",
    contactName: "Sarah Johnson",
    email: "sarah@techub.com", 
    phone: "(555) 123-4567",
    address: "123 Tech Ave, Manhattan, NY 10001",
    type: "Office Building",
    contractStart: "2024-03-15",
    contractEnd: "2025-03-14",
    totalMachines: 4,
    monthlyRevenue: 4250,
    avgTransactionValue: 3.75,
    satisfaction: 4.8,
    status: "active",
    lastContact: "2025-01-15",
    notes: "High-value client with consistent performance. Interested in adding 2 more machines in Q2.",
    machines: [
      { id: "M001", location: "Main Lobby", revenue: 1200, uptime: 98.5 },
      { id: "M002", location: "2nd Floor Break Room", revenue: 950, uptime: 99.2 },
      { id: "M003", location: "5th Floor Lounge", revenue: 1100, uptime: 97.8 },
      { id: "M004", location: "Cafeteria", revenue: 1000, uptime: 99.0 }
    ],
    recentActivity: [
      { date: "2025-01-15", type: "contact", description: "Quarterly review meeting scheduled" },
      { date: "2025-01-10", type: "service", description: "Machine M003 restocked - all slots full" },
      { date: "2025-01-08", type: "payment", description: "Monthly commission payment processed - $850" },
      { date: "2025-01-05", type: "alert", description: "Machine M001 low stock alert resolved" }
    ]
  }
};

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const customer = customerDetails[id as keyof typeof customerDetails];

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Customer Not Found</h2>
          <p className="text-muted-foreground mb-4">The customer you're looking for doesn't exist.</p>
          <Link to="/customers">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Customers
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/customers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <p className="text-muted-foreground">Customer Details & Performance</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">Edit Customer</Button>
          <Button>Schedule Meeting</Button>
        </div>
      </div>

      {/* Status & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Badge 
              variant={customer.status === 'active' ? 'default' : 'secondary'} 
              className="mb-2"
            >
              {customer.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <p className="text-sm text-muted-foreground">Account Status</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">${customer.monthlyRevenue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{customer.totalMachines}</p>
              <p className="text-sm text-muted-foreground">Active Machines</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-500 mr-1" />
                <p className="text-2xl font-bold">{customer.satisfaction}</p>
              </div>
              <p className="text-sm text-muted-foreground">Satisfaction</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">${customer.avgTransactionValue}</p>
              <p className="text-sm text-muted-foreground">Avg Transaction</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="machines">Machines</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="contract">Contract Info</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{customer.contactName}</p>
                    <p className="text-sm text-muted-foreground">Primary Contact</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{customer.email}</p>
                    <p className="text-sm text-muted-foreground">Email Address</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{customer.phone}</p>
                    <p className="text-sm text-muted-foreground">Phone Number</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{customer.address}</p>
                    <p className="text-sm text-muted-foreground">Business Address</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{customer.type}</p>
                    <p className="text-sm text-muted-foreground">Location Type</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes & Communication */}
            <Card>
              <CardHeader>
                <CardTitle>Account Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{customer.notes}</p>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Last Contact: {new Date(customer.lastContact).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="machines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Machine Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customer.machines.map((machine) => (
                  <div key={machine.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{machine.id}</p>
                        <p className="text-sm text-muted-foreground">{machine.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="font-medium">${machine.revenue}</p>
                        <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center">
                          {machine.uptime > 98 ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                          )}
                          <p className="font-medium">{machine.uptime}%</p>
                        </div>
                        <p className="text-sm text-muted-foreground">Uptime</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customer.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-4 pb-4 border-b last:border-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {activity.type === 'contact' && <Users className="h-4 w-4 text-primary" />}
                      {activity.type === 'service' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-green-600" />}
                      {activity.type === 'alert' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contract" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Contract Start Date</p>
                    <p className="font-medium">{new Date(customer.contractStart).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contract End Date</p>
                    <p className="font-medium">{new Date(customer.contractEnd).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Contract Status</p>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Renewal Date</p>
                    <p className="font-medium text-orange-600">
                      {Math.ceil((new Date(customer.contractEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
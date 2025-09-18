import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  TrendingUp,
  Users,
  Star
} from "lucide-react";
import { Link } from "react-router-dom";

// Demo customer data
const customers = [
  {
    id: "1",
    name: "Manhattan Tech Hub",
    contactName: "Sarah Johnson",
    email: "sarah@techub.com",
    phone: "(555) 123-4567",
    address: "123 Tech Ave, Manhattan, NY 10001",
    type: "Office Building",
    totalMachines: 4,
    monthlyRevenue: 4250,
    avgTransactionValue: 3.75,
    satisfaction: 4.8,
    status: "active",
    lastContact: "2025-01-15"
  },
  {
    id: "2", 
    name: "Brooklyn Hospital",
    contactName: "Dr. Michael Chen",
    email: "m.chen@brooklynhealth.org",
    phone: "(555) 234-5678",
    address: "456 Health Blvd, Brooklyn, NY 11201",
    type: "Healthcare",
    totalMachines: 6,
    monthlyRevenue: 6800,
    avgTransactionValue: 4.25,
    satisfaction: 4.6,
    status: "active",
    lastContact: "2025-01-12"
  },
  {
    id: "3",
    name: "Queens University",
    contactName: "Lisa Rodriguez", 
    email: "l.rodriguez@quc.edu",
    phone: "(555) 345-6789",
    address: "789 Campus Dr, Queens, NY 11367",
    type: "Educational",
    totalMachines: 8,
    monthlyRevenue: 8900,
    avgTransactionValue: 2.85,
    satisfaction: 4.4,
    status: "active",
    lastContact: "2025-01-10"
  },
  {
    id: "4",
    name: "Jersey Logistics Center",
    contactName: "Mark Thompson",
    email: "mark@jerseylogistics.com", 
    phone: "(555) 456-7890",
    address: "321 Industrial Way, Jersey City, NJ 07302",
    type: "Warehouse",
    totalMachines: 3,
    monthlyRevenue: 2100,
    avgTransactionValue: 3.50,
    satisfaction: 4.2,
    status: "pending_renewal",
    lastContact: "2025-01-08"
  }
];

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = customers.reduce((sum, c) => sum + c.monthlyRevenue, 0);
  const avgSatisfaction = customers.reduce((sum, c) => sum + c.satisfaction, 0) / customers.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage customer relationships and track performance metrics
          </p>
        </div>
        <Button>
          <Users className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Satisfaction</p>
                <p className="text-2xl font-bold">{avgSatisfaction.toFixed(1)}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Machines</p>
                <p className="text-2xl font-bold">{customers.reduce((sum, c) => sum + c.totalMachines, 0)}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by name, contact, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Machines</TableHead>
                <TableHead>Monthly Revenue</TableHead>
                <TableHead>Satisfaction</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {customer.address.split(',')[0]}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{customer.contactName}</div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {customer.email}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {customer.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{customer.type}</Badge>
                  </TableCell>
                  <TableCell>{customer.totalMachines}</TableCell>
                  <TableCell>${customer.monthlyRevenue.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      {customer.satisfaction}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={customer.status === 'active' ? 'default' : 'secondary'}
                    >
                      {customer.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link to={`/customers/${customer.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
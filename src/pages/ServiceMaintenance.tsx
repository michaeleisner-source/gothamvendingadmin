import React, { useState, useEffect } from 'react';
import { Wrench, Calendar, AlertTriangle, CheckCircle, Clock, Plus, Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Header } from '@/components/ui/Header';
import { useToast } from '@/hooks/use-toast';

interface ServiceRecord {
  id: string;
  machine_id: string;
  machine_name: string;
  location_name: string;
  service_type: 'maintenance' | 'repair' | 'installation' | 'inspection';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_date: string;
  completed_date?: string;
  technician: string;
  description: string;
  parts_cost: number;
  labor_hours: number;
  notes?: string;
}

interface MaintenancePlan {
  id: string;
  machine_id: string;
  machine_name: string;
  location_name: string;
  maintenance_type: string;
  frequency_days: number;
  last_service: string;
  next_due: string;
  is_overdue: boolean;
}

const ServiceMaintenance = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [maintenancePlans, setMaintenancePlans] = useState<MaintenancePlan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    // Mock data - replace with actual Supabase queries
    const mockServiceRecords: ServiceRecord[] = [
      {
        id: '1',
        machine_id: 'machine_1',
        machine_name: 'Snack Machine A1',
        location_name: 'Office Building Main',
        service_type: 'repair',
        status: 'scheduled',
        priority: 'high',
        scheduled_date: '2024-03-20T10:00:00Z',
        technician: 'John Smith',
        description: 'Bill acceptor jamming frequently',
        parts_cost: 125.50,
        labor_hours: 2,
        notes: 'Customer reports bills getting stuck'
      },
      {
        id: '2',
        machine_id: 'machine_2',
        machine_name: 'Beverage Machine B2',
        location_name: 'Hospital Cafeteria',
        service_type: 'maintenance',
        status: 'completed',
        priority: 'medium',
        scheduled_date: '2024-03-15T14:00:00Z',
        completed_date: '2024-03-15T16:30:00Z',
        technician: 'Sarah Johnson',
        description: 'Quarterly maintenance check',
        parts_cost: 45.00,
        labor_hours: 2.5,
        notes: 'Replaced filters, cleaned interior'
      },
      {
        id: '3',
        machine_id: 'machine_3',
        machine_name: 'Combo Machine C1',
        location_name: 'University Student Center',
        service_type: 'repair',
        status: 'in_progress',
        priority: 'urgent',
        scheduled_date: '2024-03-18T09:00:00Z',
        technician: 'Mike Davis',
        description: 'Compressor not working - no cooling',
        parts_cost: 350.00,
        labor_hours: 4,
        notes: 'Diagnosed compressor failure, ordering replacement part'
      }
    ];

    const mockMaintenancePlans: MaintenancePlan[] = [
      {
        id: '1',
        machine_id: 'machine_1',
        machine_name: 'Snack Machine A1',
        location_name: 'Office Building Main',
        maintenance_type: 'Deep Clean & Filter Change',
        frequency_days: 90,
        last_service: '2024-01-15',
        next_due: '2024-04-15',
        is_overdue: false
      },
      {
        id: '2',
        machine_id: 'machine_4',
        machine_name: 'Beverage Machine B4',
        location_name: 'Mall Food Court',
        maintenance_type: 'Quarterly Inspection',
        frequency_days: 90,
        last_service: '2023-12-10',
        next_due: '2024-03-10',
        is_overdue: true
      }
    ];

    setTimeout(() => {
      setServiceRecords(mockServiceRecords);
      setMaintenancePlans(mockMaintenancePlans);
      setLoading(false);
    }, 1000);
  }, []);

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      case 'cancelled': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredServiceRecords = serviceRecords.filter(record => {
    const matchesSearch = record.machine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.technician.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || record.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const overdueMaintenancePlans = maintenancePlans.filter(plan => plan.is_overdue);

  const handleScheduleService = () => {
    toast({
      title: "Schedule Service",
      description: "Service scheduling feature coming soon",
    });
  };

  const handleCreateMaintenancePlan = () => {
    toast({
      title: "Create Maintenance Plan",
      description: "Maintenance plan creation feature coming soon",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Header 
          title="Service & Maintenance" 
          subtitle="Track service logs, schedule maintenance, and manage repair requests" 
        />
        <Button onClick={handleScheduleService}>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Service
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{serviceRecords.filter(r => r.status === 'scheduled').length}</div>
                <div className="text-xs text-muted-foreground">Scheduled</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{serviceRecords.filter(r => r.status === 'in_progress').length}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{serviceRecords.filter(r => r.status === 'completed').length}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{overdueMaintenancePlans.length}</div>
                <div className="text-xs text-muted-foreground">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="service-requests" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="service-requests">Service Requests</TabsTrigger>
          <TabsTrigger value="maintenance-plans">Maintenance Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="service-requests">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Service Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative flex-1 min-w-64">
                  <Input
                    placeholder="Search by machine, location, or technician..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Service Records Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Machine</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServiceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{record.machine_name}</div>
                          <div className="text-sm text-muted-foreground">{record.location_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {record.service_type.charAt(0).toUpperCase() + record.service_type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(record.status)}
                          <Badge className={getStatusBadgeColor(record.status)}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityBadgeColor(record.priority)}>
                          {record.priority.charAt(0).toUpperCase() + record.priority.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.technician}</TableCell>
                      <TableCell>
                        {new Date(record.scheduled_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>${record.parts_cost.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">{record.labor_hours}h labor</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredServiceRecords.length === 0 && (
                <div className="text-center py-8">
                  <Wrench className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No service requests found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'Schedule your first service request to get started'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance-plans">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Maintenance Plans
                </CardTitle>
                <Button onClick={handleCreateMaintenancePlan}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Plan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Machine</TableHead>
                    <TableHead>Maintenance Type</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Last Service</TableHead>
                    <TableHead>Next Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenancePlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{plan.machine_name}</div>
                          <div className="text-sm text-muted-foreground">{plan.location_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{plan.maintenance_type}</TableCell>
                      <TableCell>Every {plan.frequency_days} days</TableCell>
                      <TableCell>
                        {new Date(plan.last_service).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(plan.next_due).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {plan.is_overdue ? (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Overdue
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            On Track
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {maintenancePlans.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No maintenance plans</h3>
                  <p className="text-muted-foreground">Create maintenance plans to schedule regular service</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceMaintenance;
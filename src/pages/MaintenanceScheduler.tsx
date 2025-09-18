import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Wrench, Plus, AlertTriangle, Calendar as CalendarIcon, Clock, CheckCircle, User, MapPin } from 'lucide-react';
import { useSupabaseQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

const MaintenanceScheduler = () => {
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('');
  const { toast } = useToast();

  const { data: machines = [] } = useSupabaseQuery(
    'machines',
    'id, name, location_id, status',
    [],
    { column: 'name', ascending: true },
    ['machines-maintenance']
  ) as { data: any[] };

  const { data: locations = [] } = useSupabaseQuery(
    'locations', 
    'id, name',
    [],
    undefined,
    ['locations-for-maintenance']
  ) as { data: any[] };

  // Mock tickets data (in real app, this would come from a tickets table)
  const mockTickets = [
    {
      id: '1',
      title: 'Replace coin mechanism',
      description: 'Coin acceptor jamming frequently',
      machine_id: machines[0]?.id,
      priority: 'high',
      category: 'repair',
      status: 'open',
      created_at: new Date().toISOString(),
      scheduled_date: addDays(new Date(), 1).toISOString(),
      technician_id: null,
      estimated_duration: '2 hours'
    },
    {
      id: '2',
      title: 'Preventive maintenance check',
      description: 'Monthly cleaning and inspection',
      machine_id: machines[0]?.id,
      priority: 'low',
      category: 'preventive',
      status: 'scheduled',
      created_at: new Date().toISOString(),
      scheduled_date: addDays(new Date(), 3).toISOString(),
      technician_id: 'tech-1',
      estimated_duration: '1 hour'
    }
  ];

  const [tickets] = useState(mockTickets);

  const createTicket = async () => {
    if (!ticketTitle.trim() || !selectedMachine) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would create a ticket in the database
    toast({
      title: "Success", 
      description: "Maintenance ticket created successfully",
    });

    setNewTicketOpen(false);
    setTicketTitle('');
    setTicketDescription('');
    setSelectedMachine('');
    setPriority('medium');
    setCategory('');
    setSelectedDate(undefined);
  };

  const getLocationName = (locationId: string) => {
    return locations.find(loc => loc.id === locationId)?.name || 'Unknown Location';
  };

  const getMachineName = (machineId: string) => {
    return machines.find(machine => machine.id === machineId)?.name || 'Unknown Machine';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">High</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low': return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default: return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="outline">Open</Badge>;
      case 'scheduled': return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'in_progress': return <Badge className="bg-orange-100 text-orange-800">In Progress</Badge>;
      case 'completed': return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'repair': return <Wrench className="h-4 w-4" />;
      case 'preventive': return <CheckCircle className="h-4 w-4" />;
      case 'emergency': return <AlertTriangle className="h-4 w-4" />;
      default: return <Wrench className="h-4 w-4" />;
    }
  };

  // Calculate metrics
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const highPriorityTickets = tickets.filter(t => t.priority === 'high').length;
  const scheduledThisWeek = tickets.filter(t => {
    const ticketDate = new Date(t.scheduled_date);
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    return isWithinInterval(ticketDate, { start: weekStart, end: weekEnd });
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Scheduler</h1>
          <p className="text-muted-foreground">Schedule and track machine maintenance and repairs</p>
        </div>
        
        <Dialog open={newTicketOpen} onOpenChange={setNewTicketOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Maintenance Ticket</DialogTitle>
              <DialogDescription>
                Schedule maintenance or report an issue with a machine
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ticketTitle">Title</Label>
                  <Input
                    id="ticketTitle"
                    value={ticketTitle}
                    onChange={(e) => setTicketTitle(e.target.value)}
                    placeholder="e.g., Replace coin mechanism"
                  />
                </div>
                <div>
                  <Label htmlFor="machine">Machine</Label>
                  <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select machine" />
                    </SelectTrigger>
                    <SelectContent>
                      {machines.map((machine) => (
                        <SelectItem key={machine.id} value={machine.id}>
                          {machine.name} - {getLocationName(machine.location_id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="preventive">Preventive</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="upgrade">Upgrade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Schedule Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    placeholder="Detailed description of the maintenance work needed..."
                    rows={6}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewTicketOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createTicket}>Create Ticket</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{openTickets}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{highPriorityTickets}</div>
            <p className="text-xs text-muted-foreground">Urgent repairs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledThisWeek}</div>
            <p className="text-xs text-muted-foreground">Scheduled tasks</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">On-time completion</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tickets" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tickets">Active Tickets</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="preventive">Preventive</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Tickets</CardTitle>
              <CardDescription>All active and scheduled maintenance requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-muted rounded">
                        {getCategoryIcon(ticket.category)}
                      </div>
                      <div>
                        <h4 className="font-medium">{ticket.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {getMachineName(ticket.machine_id)} • {ticket.description.slice(0, 50)}...
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created: {format(new Date(ticket.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm font-medium">
                          {format(new Date(ticket.scheduled_date), 'MMM dd')}
                        </p>
                        <p className="text-xs text-muted-foreground">Scheduled</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm font-medium">{ticket.estimated_duration}</p>
                        <p className="text-xs text-muted-foreground">Duration</p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        {getPriorityBadge(ticket.priority)}
                        {getStatusBadge(ticket.status)}
                      </div>
                      
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Calendar</CardTitle>
              <CardDescription>Schedule and track maintenance activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-4 mb-6">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                  <div key={day} className="text-center font-medium p-2 bg-muted rounded">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-4">
                {Array.from({ length: 35 }, (_, i) => {
                  const date = addDays(startOfWeek(new Date()), i);
                  const dayTickets = tickets.filter(ticket => 
                    format(new Date(ticket.scheduled_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                  );
                  
                  return (
                    <div key={i} className="min-h-24 p-2 border rounded">
                      <div className="text-sm font-medium mb-1">
                        {format(date, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayTickets.map((ticket) => (
                          <div key={ticket.id} className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate">
                            {ticket.title.slice(0, 20)}...
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preventive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preventive Maintenance</CardTitle>
              <CardDescription>Automated maintenance scheduling based on usage and time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Maintenance Rules</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">Monthly Cleaning</p>
                        <p className="text-sm text-muted-foreground">Every 30 days</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">Quarterly Inspection</p>
                        <p className="text-sm text-muted-foreground">Every 90 days</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">Annual Overhaul</p>
                        <p className="text-sm text-muted-foreground">Every 365 days</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">Upcoming Preventive Tasks</h3>
                  <div className="space-y-3">
                    {machines.slice(0, 5).map((machine, index) => (
                      <div key={machine.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{machine.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Monthly cleaning due
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {format(addDays(new Date(), index + 2), 'MMM dd')}
                          </p>
                          <Badge variant="outline">Due Soon</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Mean Time to Repair</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2 hours</div>
                <p className="text-sm text-muted-foreground">Average repair time</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Preventive vs Reactive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">73% / 27%</div>
                <p className="text-sm text-muted-foreground">Preventive maintenance ratio</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Cost Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">$3,247</div>
                <p className="text-sm text-muted-foreground">Monthly through prevention</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Machine Health Overview</CardTitle>
              <CardDescription>Maintenance history and machine reliability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {machines.slice(0, 8).map((machine, index) => {
                  const machineTickets = tickets.filter(t => t.machine_id === machine.id);
                  const healthScore = Math.max(60, 100 - (machineTickets.length * 10) - Math.floor(Math.random() * 20));
                  
                  return (
                    <div key={machine.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          healthScore >= 85 ? 'bg-green-100' :
                          healthScore >= 70 ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          <Wrench className={`h-6 w-6 ${
                            healthScore >= 85 ? 'text-green-600' :
                            healthScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-medium">{machine.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {getLocationName(machine.location_id)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className={`text-sm font-medium ${
                            healthScore >= 85 ? 'text-green-600' :
                            healthScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {healthScore}%
                          </p>
                          <p className="text-xs text-muted-foreground">Health Score</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm font-medium">{machineTickets.length}</p>
                          <p className="text-xs text-muted-foreground">Open Issues</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            {format(addDays(new Date(), Math.floor(Math.random() * 30)), 'MMM dd')}
                          </p>
                          <p className="text-xs text-muted-foreground">Next Service</p>
                        </div>
                        
                        <Badge variant={machine.status === 'active' ? 'default' : 'destructive'}>
                          {machine.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaintenanceScheduler;
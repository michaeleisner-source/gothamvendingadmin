import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Clock, User, CheckCircle, Navigation, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeliveryRoute {
  id: string;
  name: string;
  driver_id?: string;
  route_day?: string;
  start_time?: string;
  estimated_duration?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  staff?: { full_name: string };
  route_stops?: RouteStop[];
}

interface RouteStop {
  id: string;
  route_id: string;
  machine_id: string;
  stop_order: number;
  estimated_arrival?: string;
  actual_arrival?: string;
  service_type: string;
  completed: boolean;
  notes?: string;
  machines: { name: string };
}

interface Machine {
  id: string;
  name: string;
}

interface Staff {
  id: string;
  full_name: string;
}

const DeliveryRoutes = () => {
  const { toast } = useToast();
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDay, setFilterDay] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRoute, setNewRoute] = useState({
    name: '',
    driver_id: '',
    route_day: '',
    start_time: '',
    estimated_duration: '',
    selectedMachines: [] as string[]
  });

  const days = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  const serviceTypes = [
    { value: 'restock', label: 'Restock' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'collection', label: 'Cash Collection' },
    { value: 'inspection', label: 'Inspection' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [routesRes, machinesRes, staffRes] = await Promise.all([
        supabase
          .from('delivery_routes')
          .select(`
            *,
            staff!delivery_routes_driver_id_fkey(full_name),
            route_stops(
              *,
              machines!route_stops_machine_id_fkey(name)
            )
          `)
          .order('created_at', { ascending: false }),
        supabase.from('machines').select('id, name').order('name'),
        supabase.from('staff').select('id, full_name').eq('active', true).order('full_name')
      ]);

      if (routesRes.error) throw routesRes.error;
      if (machinesRes.error) throw machinesRes.error;
      if (staffRes.error) throw staffRes.error;

      setRoutes((routesRes.data || []).map((route: any) => ({
        ...route,
        estimated_duration: route.estimated_duration || null
      })));
      setMachines(machinesRes.data || []);
      setStaff(staffRes.data || []);
    } catch (error) {
      toast({
        title: "Error loading data",
        description: error instanceof Error ? error.message : "Failed to load routes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createRoute = async () => {
    if (!newRoute.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a route name",
        variant: "destructive"
      });
      return;
    }

    if (newRoute.selectedMachines.length === 0) {
      toast({
        title: "Machines required",
        description: "Please select at least one machine for the route",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create the route
      const routeData: any = {
        name: newRoute.name,
        driver_id: newRoute.driver_id || null,
        route_day: newRoute.route_day || null,
        start_time: newRoute.start_time || null,
        estimated_duration: newRoute.estimated_duration ? `${newRoute.estimated_duration} hours` : null
      };

      const { data: route, error: routeError } = await supabase
        .from('delivery_routes')
        .insert([routeData])
        .select()
        .single();

      if (routeError) throw routeError;

      // Create route stops - org_id will be set by trigger
      const stopsData = newRoute.selectedMachines.map((machineId, index) => ({
        route_id: route.id,
        machine_id: machineId,
        stop_order: index + 1,
        service_type: 'restock' as const
      }));

      const { error: stopsError } = await supabase
        .from('route_stops')
        .insert(stopsData as any);

      if (stopsError) throw stopsError;

      toast({
        title: "Route created",
        description: "New delivery route has been created successfully"
      });

      setNewRoute({
        name: '',
        driver_id: '',
        route_day: '',
        start_time: '',
        estimated_duration: '',
        selectedMachines: []
      });
      setShowCreateDialog(false);
      loadData();
    } catch (error) {
      toast({
        title: "Error creating route",
        description: error instanceof Error ? error.message : "Failed to create route",
        variant: "destructive"
      });
    }
  };

  const updateRouteStatus = async (routeId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('delivery_routes')
        .update({ status })
        .eq('id', routeId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Route status changed to ${status}`
      });

      loadData();
    } catch (error) {
      toast({
        title: "Error updating status",
        description: error instanceof Error ? error.message : "Failed to update route",
        variant: "destructive"
      });
    }
  };

  const toggleMachineSelection = (machineId: string) => {
    setNewRoute(prev => ({
      ...prev,
      selectedMachines: prev.selectedMachines.includes(machineId)
        ? prev.selectedMachines.filter(id => id !== machineId)
        : [...prev.selectedMachines, machineId]
    }));
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      planned: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.planned;
  };

  const filteredRoutes = routes.filter(route => {
    const statusMatch = filterStatus === 'all' || route.status === filterStatus;
    const dayMatch = filterDay === 'all' || route.route_day === filterDay;
    return statusMatch && dayMatch;
  });

  const routeStats = {
    total: routes.length,
    planned: routes.filter(r => r.status === 'planned').length,
    inProgress: routes.filter(r => r.status === 'in_progress').length,
    completed: routes.filter(r => r.status === 'completed').length
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Delivery Routes</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Route
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Route</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Route Name</Label>
                  <Input
                    id="name"
                    value={newRoute.name}
                    onChange={(e) => setNewRoute(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Downtown Route A"
                  />
                </div>
                <div>
                  <Label htmlFor="driver">Driver</Label>
                  <Select 
                    value={newRoute.driver_id} 
                    onValueChange={(value) => setNewRoute(prev => ({ ...prev, driver_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map(person => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="day">Route Day</Label>
                  <Select 
                    value={newRoute.route_day} 
                    onValueChange={(value) => setNewRoute(prev => ({ ...prev, route_day: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map(day => (
                        <SelectItem key={day} value={day}>
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newRoute.start_time}
                    onChange={(e) => setNewRoute(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Input
                    id="duration"
                    type="number"
                    step="0.5"
                    value={newRoute.estimated_duration}
                    onChange={(e) => setNewRoute(prev => ({ ...prev, estimated_duration: e.target.value }))}
                    placeholder="e.g., 4"
                  />
                </div>
              </div>

              <div>
                <Label>Select Machines for Route</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto mt-2 border rounded-md p-3">
                  {machines.map(machine => (
                    <div key={machine.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={machine.id}
                        checked={newRoute.selectedMachines.includes(machine.id)}
                        onCheckedChange={() => toggleMachineSelection(machine.id)}
                      />
                      <Label
                        htmlFor={machine.id}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {machine.name}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {newRoute.selectedMachines.length} machines
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createRoute}>Create Route</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Routes</p>
                <p className="text-2xl font-semibold">{routeStats.total}</p>
              </div>
              <Navigation className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Planned</p>
                <p className="text-2xl font-semibold text-gray-600">{routeStats.planned}</p>
              </div>
              <Calendar className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-semibold text-blue-600">{routeStats.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-semibold text-green-600">{routeStats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Label>Status:</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label>Day:</Label>
              <Select value={filterDay} onValueChange={setFilterDay}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  {days.map(day => (
                    <SelectItem key={day} value={day}>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Routes List */}
      <div className="space-y-4">
        {filteredRoutes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Navigation className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No routes found</h3>
              <p className="text-muted-foreground mb-4">
                {routes.length === 0 
                  ? "No delivery routes have been created yet. Create your first route to get started."
                  : "No routes match the current filters. Try adjusting your filter criteria."
                }
              </p>
              {routes.length === 0 && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Route
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredRoutes.map((route) => (
            <Card key={route.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{route.name}</h3>
                      <Badge className={getStatusBadge(route.status)}>
                        {route.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                      {route.staff && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{route.staff.full_name}</span>
                        </div>
                      )}
                      {route.route_day && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{route.route_day.charAt(0).toUpperCase() + route.route_day.slice(1)}</span>
                        </div>
                      )}
                      {route.start_time && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{route.start_time}</span>
                        </div>
                      )}
                      {route.route_stops && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{route.route_stops.length} stops</span>
                        </div>
                      )}
                    </div>

                    {route.route_stops && route.route_stops.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-2">Route Stops:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {route.route_stops
                            .sort((a, b) => a.stop_order - b.stop_order)
                            .map((stop) => (
                              <div
                                key={stop.id}
                                className="flex items-center gap-2 text-xs p-2 bg-muted rounded"
                              >
                                <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                                  {stop.stop_order}
                                </div>
                                <span className="flex-1">{stop.machines.name}</span>
                                {stop.completed && (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {route.status === 'planned' && (
                      <Button
                        size="sm"
                        onClick={() => updateRouteStatus(route.id, 'in_progress')}
                      >
                        Start Route
                      </Button>
                    )}
                    {route.status === 'in_progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRouteStatus(route.id, 'completed')}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DeliveryRoutes;
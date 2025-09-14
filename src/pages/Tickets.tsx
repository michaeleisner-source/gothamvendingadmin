import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Clock, CheckCircle, User, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Ticket {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  category?: string;
  machine_id?: string;
  assigned_to?: string;
  created_by?: string;
  labor_hours?: number;
  labor_cost_cents?: number;
  parts_cost_cents?: number;
  resolution?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  machines?: { name: string };
  staff?: { full_name: string };
}

interface Machine {
  id: string;
  name: string;
}

interface Staff {
  id: string;
  full_name: string;
}

const Tickets = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    category: 'maintenance',
    machine_id: '',
    assigned_to: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ticketsRes, machinesRes, staffRes] = await Promise.all([
        supabase
          .from('tickets')
          .select(`
            *,
            machines!tickets_machine_id_fkey(name),
            staff!tickets_assigned_to_fkey(full_name)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('machines').select('id, name').order('name'),
        supabase.from('staff').select('id, full_name').eq('active', true).order('full_name')
      ]);

      if (ticketsRes.error) throw ticketsRes.error;
      if (machinesRes.error) throw machinesRes.error;
      if (staffRes.error) throw staffRes.error;

      setTickets(ticketsRes.data || []);
      setMachines(machinesRes.data || []);
      setStaff(staffRes.data || []);
    } catch (error) {
      toast({
        title: "Error loading data",
        description: error instanceof Error ? error.message : "Failed to load tickets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async () => {
    if (!newTicket.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a ticket title",
        variant: "destructive"
      });
      return;
    }

    try {
      const ticketData: any = {
        title: newTicket.title,
        description: newTicket.description || null,
        priority: newTicket.priority,
        category: newTicket.category,
        machine_id: newTicket.machine_id || null,
        assigned_to: newTicket.assigned_to || null
      };

      const { error } = await supabase
        .from('tickets')
        .insert([ticketData]);

      if (error) throw error;

      toast({
        title: "Ticket created",
        description: "New ticket has been created successfully"
      });

      setNewTicket({
        title: '',
        description: '',
        priority: 'medium',
        category: 'maintenance',
        machine_id: '',
        assigned_to: ''
      });
      setShowCreateDialog(false);
      loadData();
    } catch (error) {
      toast({
        title: "Error creating ticket",
        description: error instanceof Error ? error.message : "Failed to create ticket",
        variant: "destructive"
      });
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const updates: any = { status };
      if (status === 'resolved' || status === 'closed') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Ticket status changed to ${status}`
      });

      loadData();
    } catch (error) {
      toast({
        title: "Error updating status",
        description: error instanceof Error ? error.message : "Failed to update ticket",
        variant: "destructive"
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800', 
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      open: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  const filteredTickets = tickets.filter(ticket => {
    const statusMatch = filterStatus === 'all' || ticket.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || ticket.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    urgent: tickets.filter(t => t.priority === 'urgent').length
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
        <h1 className="text-3xl font-bold">Ticket Management</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the issue"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the issue"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={newTicket.priority} 
                    onValueChange={(value: any) => setNewTicket(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={newTicket.category} 
                    onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="restock">Restock</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="machine">Machine</Label>
                <Select 
                  value={newTicket.machine_id} 
                  onValueChange={(value) => setNewTicket(prev => ({ ...prev, machine_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select machine (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map(machine => (
                      <SelectItem key={machine.id} value={machine.id}>
                        {machine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assigned">Assign To</Label>
                <Select 
                  value={newTicket.assigned_to} 
                  onValueChange={(value) => setNewTicket(prev => ({ ...prev, assigned_to: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to staff (optional)" />
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
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createTicket}>Create Ticket</Button>
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
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-2xl font-semibold">{ticketStats.total}</p>
              </div>
              <Wrench className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-semibold text-orange-600">{ticketStats.open}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-semibold text-blue-600">{ticketStats.inProgress}</p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgent</p>
                <p className="text-2xl font-semibold text-red-600">{ticketStats.urgent}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
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
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label>Priority:</Label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Wrench className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tickets found</h3>
              <p className="text-muted-foreground mb-4">
                {tickets.length === 0 
                  ? "No tickets have been created yet. Create your first ticket to get started."
                  : "No tickets match the current filters. Try adjusting your filter criteria."
                }
              </p>
              {tickets.length === 0 && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Ticket
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{ticket.title}</h3>
                      <Badge className={getPriorityBadge(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <Badge className={getStatusBadge(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    {ticket.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {ticket.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                      {ticket.machines && (
                        <span>Machine: {ticket.machines.name}</span>
                      )}
                      {ticket.staff && (
                        <span>Assigned to: {ticket.staff.full_name}</span>
                      )}
                      {ticket.category && (
                        <span>Category: {ticket.category}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {ticket.status === 'open' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                      >
                        Start Work
                      </Button>
                    )}
                    {ticket.status === 'in_progress' && (
                      <Button
                        size="sm"
                        onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                      >
                        Mark Resolved
                      </Button>
                    )}
                    {ticket.status === 'resolved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTicketStatus(ticket.id, 'closed')}
                      >
                        Close
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

export default Tickets;
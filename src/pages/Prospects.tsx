import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building, Filter, Grid, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProspectKanbanBoard } from "@/components/prospects/ProspectKanbanBoard";
import { ProspectFilters } from "@/components/prospects/ProspectFilters";
import { StatCard } from "@/components/enhanced/StatCard";
import { EnhancedDataTable } from "@/components/enhanced/EnhancedDataTable";

interface Lead {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  location_type: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  contact_method: string;
  notes?: string;
  revenue_split?: number;
  follow_up_date?: string;
  estimated_foot_traffic?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function Prospects() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadLeads();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('leads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        loadLeads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      console.error('Error loading leads:', error);
      toast({
        title: "Error",
        description: "Failed to load prospects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter and search functionality
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchTerm === '' || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      lead.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = stageFilter === 'all' || lead.status === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  // Get unique stages and sources
  const stages = [...new Set(leads.map(l => l.status))].filter(Boolean);
  const sources = ['walk-in', 'referral', 'web', 'cold-call', 'marketing', 'other'];

  // Calculate stats
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.status === 'won').length,
  };

  const tableColumns = [
    { key: 'name', label: 'Name' },
    { key: 'company', label: 'Company' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'city', label: 'City' },
    { key: 'status', label: 'Status' },
  ];


  if (loading && leads.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Building className="mr-3 h-8 w-8" />
            Prospects
          </h1>
          <p className="text-muted-foreground">Manage your sales pipeline and potential locations</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              onClick={() => setViewMode('kanban')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Link to="/prospects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Prospect
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Prospects"
          value={stats.total}
          icon={Building}
        />
        <StatCard
          title="New"
          value={stats.new}
          description="Uncontacted leads"
        />
        <StatCard
          title="Contacted"
          value={stats.contacted}
          description="Initial contact made"
        />
        <StatCard
          title="Qualified"
          value={stats.qualified}
          description="Ready for proposal"
        />
        <StatCard
          title="Converted"
          value={stats.converted}
          description="Won deals"
        />
      </div>

      {/* Filters */}
      <ProspectFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        stage={stageFilter}
        onStageChange={setStageFilter}
        source={sourceFilter}
        onSourceChange={setSourceFilter}
        filteredCount={filteredLeads.length}
        totalCount={leads.length}
        stages={stages}
        sources={sources}
      />

      {/* Content */}
      {leads.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No prospects yet</h3>
            <p className="text-muted-foreground mb-6">Start building your sales pipeline by adding your first prospect.</p>
            <Link to="/prospects/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Prospect
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : viewMode === 'kanban' ? (
        <ProspectKanbanBoard 
          prospects={filteredLeads.map(lead => ({
            id: lead.id,
            name: lead.name,
            company: lead.company,
            contact_name: lead.name,
            email: lead.email,
            phone: lead.phone,
            stage: lead.status,
            status: lead.status,
            source: 'walk-in', // Default since not in leads table
            next_follow_up_at: lead.follow_up_date,
            city: lead.city,
            state: lead.state,
          }))}
          stages={['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <EnhancedDataTable
              data={filteredLeads}
              columns={tableColumns}
              searchPlaceholder="Search leads..."
              searchFields={['name', 'company', 'email', 'city']}
              emptyMessage="No prospects found"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
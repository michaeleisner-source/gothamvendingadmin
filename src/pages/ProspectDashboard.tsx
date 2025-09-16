import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin, 
  Users, 
  DollarSign, 
  TrendingUp,
  Phone,
  Mail,
  Plus,
  Filter,
  Star,
  Clock,
  Building
} from "lucide-react";

// AI-Ready Data Structure for Prospects
interface Prospect {
  id: string;
  name: string;
  business_type: 'office' | 'hospital' | 'school' | 'apartment' | 'warehouse' | 'retail' | 'other';
  address: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  estimated_foot_traffic: number; // daily count
  peak_hours: string; // "9-11am, 2-4pm"
  demographics: 'budget' | 'mid-range' | 'premium';
  competition_nearby: boolean;
  existing_amenities: string[];
  space_available: boolean;
  power_access: boolean;
  security_level: 'low' | 'medium' | 'high';
  revenue_split_requested: number; // 0-50%
  estimated_monthly_revenue: number;
  ai_score: number; // 0-100, calculated by ML later
  status: 'new' | 'contacted' | 'visited' | 'quoted' | 'negotiating' | 'won' | 'lost';
  priority: 'low' | 'medium' | 'high';
  last_contact: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// Sample data with AI-ready structure
const sampleProspects: Prospect[] = [
  {
    id: "P001",
    name: "Manhattan Tech Hub",
    business_type: "office",
    address: "123 Broadway, Manhattan, NY",
    contact_name: "Sarah Johnson",
    contact_phone: "(555) 123-4567",
    contact_email: "sarah@techub.com",
    estimated_foot_traffic: 450,
    peak_hours: "8-10am, 12-2pm, 5-6pm",
    demographics: "premium",
    competition_nearby: false,
    existing_amenities: ["cafeteria", "coffee_shop"],
    space_available: true,
    power_access: true,
    security_level: "high",
    revenue_split_requested: 30,
    estimated_monthly_revenue: 2800,
    ai_score: 85,
    status: "negotiating",
    priority: "high",
    last_contact: "2024-09-15",
    notes: "Very interested, wants premium healthy options",
    created_at: "2024-09-10",
    updated_at: "2024-09-15"
  },
  {
    id: "P002", 
    name: "Brooklyn Community Hospital",
    business_type: "hospital",
    address: "456 Health Ave, Brooklyn, NY",
    contact_name: "Dr. Michael Chen",
    contact_phone: "(555) 987-6543",
    contact_email: "m.chen@bchospital.org",
    estimated_foot_traffic: 600,
    peak_hours: "24/7 steady flow",
    demographics: "mid-range",
    competition_nearby: true,
    existing_amenities: ["gift_shop", "cafeteria"],
    space_available: true,
    power_access: true,
    security_level: "high",
    revenue_split_requested: 0,
    estimated_monthly_revenue: 3200,
    ai_score: 78,
    status: "quoted",
    priority: "high",
    last_contact: "2024-09-12",
    notes: "Need healthy options for staff and visitors",
    created_at: "2024-09-05",
    updated_at: "2024-09-12"
  },
  {
    id: "P003",
    name: "Queens University Student Center",
    business_type: "school",
    address: "789 Campus Dr, Queens, NY",
    contact_name: "Lisa Rodriguez",
    contact_phone: "(555) 456-7890",
    contact_email: "l.rodriguez@queensu.edu",
    estimated_foot_traffic: 800,
    peak_hours: "10am-2pm, 6-8pm",
    demographics: "budget",
    competition_nearby: true,
    existing_amenities: ["food_court", "bookstore"],
    space_available: false,
    power_access: true,
    security_level: "medium",
    revenue_split_requested: 25,
    estimated_monthly_revenue: 2100,
    ai_score: 65,
    status: "visited",
    priority: "medium",
    last_contact: "2024-09-08",
    notes: "Space constraints, looking for compact machine",
    created_at: "2024-09-01",
    updated_at: "2024-09-08"
  }
];

export default function ProspectDashboard() {
  console.log("ProspectDashboard component loading...");
  const [prospects] = useState<Prospect[]>(sampleProspects);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  
  console.log("ProspectDashboard prospects:", prospects.length);

  // Smart filtering and sorting
  const filteredProspects = useMemo(() => {
    return prospects
      .filter(prospect => {
        const matchesSearch = prospect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            prospect.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            prospect.address.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || prospect.status === statusFilter;
        const matchesPriority = priorityFilter === "all" || prospect.priority === priorityFilter;
        
        return matchesSearch && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        // AI score priority sorting
        if (a.priority !== b.priority) {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.ai_score - a.ai_score;
      });
  }, [prospects, searchTerm, statusFilter, priorityFilter]);

  // Calculate KPIs
  const totalProspects = prospects.length;
  const activeProspects = prospects.filter(p => !['won', 'lost'].includes(p.status)).length;
  const totalEstimatedRevenue = prospects
    .filter(p => p.status !== 'lost')
    .reduce((sum, p) => sum + p.estimated_monthly_revenue, 0);
  const averageAIScore = prospects.reduce((sum, p) => sum + p.ai_score, 0) / prospects.length;

  const getStatusColor = (status: string) => {
    const colors = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800", 
      visited: "bg-purple-100 text-purple-800",
      quoted: "bg-orange-100 text-orange-800",
      negotiating: "bg-indigo-100 text-indigo-800",
      won: "bg-green-100 text-green-800",
      lost: "bg-red-100 text-red-800"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "text-red-600",
      medium: "text-yellow-600", 
      low: "text-green-600"
    };
    return colors[priority as keyof typeof colors] || "text-gray-600";
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Smart Prospect Pipeline</h1>
          <p className="text-muted-foreground">AI-powered lead qualification and management</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Prospect
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Prospects</p>
                <p className="text-2xl font-bold">{totalProspects}</p>
                <p className="text-xs text-green-600">{activeProspects} active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Est. Monthly Revenue</p>
                <p className="text-2xl font-bold">${totalEstimatedRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600">Pipeline value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg AI Score</p>
                <p className="text-2xl font-bold">{averageAIScore.toFixed(0)}</p>
                <p className="text-xs text-purple-600">Quality metric</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">24%</p>
                <p className="text-xs text-green-600">+5% this month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search prospects, contacts, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="visited">Visited</SelectItem>
                <SelectItem value="quoted">Quoted</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Prospects List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProspects.map((prospect) => (
          <Card key={prospect.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{prospect.name}</CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {prospect.business_type}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={getStatusColor(prospect.status)}>
                    {prospect.status}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Star className={`h-4 w-4 ${getPriorityColor(prospect.priority)}`} />
                    <span className="text-sm font-medium">{prospect.ai_score}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{prospect.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{prospect.estimated_foot_traffic} daily foot traffic</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>${prospect.estimated_monthly_revenue}/month potential</span>
                </div>
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Contact:</span>
                  <span className="font-medium">{prospect.contact_name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Revenue Split:</span>
                  <span className="font-medium">{prospect.revenue_split_requested}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Contact:</span>
                  <span className="font-medium">{prospect.last_contact}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Phone className="h-3 w-3 mr-1" />
                  Call
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Button>
                <Button size="sm" className="flex-1">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProspects.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No prospects match your current filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
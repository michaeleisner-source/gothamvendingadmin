import { useState } from "react";
import { useLeads } from "@/hooks/useApiData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, User, MapPin, Phone, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function Leads() {
  const { data: leads, isLoading, error } = useLeads();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLeads = leads?.filter(lead =>
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.city.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'secondary';
      case 'contacted': return 'outline';
      case 'interested': return 'default';
      case 'negotiating': return 'destructive';
      case 'closed': return 'default';
      case 'rejected': return 'outline';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Leads</h1>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </div>
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load leads. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Leads Management</h1>
          <p className="text-muted-foreground">
            Manage your sales prospects and opportunities
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Lead
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, company, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <div className="grid gap-4">
        {filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                {searchQuery ? 'No leads found matching your search.' : 'No leads found. Add your first lead to get started.'}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {lead.name}
                      {lead.company && (
                        <span className="text-muted-foreground font-normal">
                          • {lead.company}
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4" />
                      {lead.city}, {lead.state} • {lead.location_type}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(lead.status)}>
                    {lead.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    {lead.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{lead.email}</span>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      Est. Traffic: {lead.estimated_foot_traffic} people/day
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Address:</span><br />
                      {lead.address}, {lead.city}, {lead.state} {lead.zip_code}
                    </div>
                    {lead.notes && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="text-sm mt-1">{lead.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                {lead.follow_up_date && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Follow-up: {new Date(lead.follow_up_date).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Showing {filteredLeads.length} of {leads?.length || 0} leads
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
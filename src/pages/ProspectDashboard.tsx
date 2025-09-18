import React, { useMemo, useState, useEffect } from 'react';
import { useDashboardStats } from "@/hooks/useApiData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Users, MapPin, DollarSign, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

type Prospect = {
  id: string;
  name: string;
  type: 'Office'|'Hospital'|'University';
  footTraffic: number; // estimated / day
  estRevenue: number;  // USD / month
  aiScore: number;     // 0-100
  conversion: number;  // %
  city: string;
};

const SAMPLE: Prospect[] = [
  { id:'p1', name:'Manhattan Tech Hub', type:'Office', city:'NYC', footTraffic: 1200, estRevenue: 4200, aiScore: 86, conversion: 22 },
  { id:'p2', name:'Brooklyn Community Hospital', type:'Hospital', city:'Brooklyn', footTraffic: 950, estRevenue: 3800, aiScore: 79, conversion: 19 },
  { id:'p3', name:'Queens University', type:'University', city:'Queens', footTraffic: 2600, estRevenue: 7300, aiScore: 91, conversion: 28 },
];

export default function ProspectDashboard() {
  const { data, isLoading, error } = useDashboardStats();
  const [q, setQ] = useState('');
  const [type, setType] = useState<'All'|Prospect['type']>('All');

  // Set custom breadcrumb text
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: 'Smart Prospect Pipeline' }));
    return () => {
      window.dispatchEvent(new CustomEvent('gv:breadcrumb:set', { detail: null }));
    };
  }, []);

  const list = useMemo(() => {
    return SAMPLE.filter(p => (type==='All' || p.type===type) && p.name.toLowerCase().includes(q.toLowerCase()));
  }, [q, type]);

  const kpis = useMemo(() => {
    const total = SAMPLE.length;
    const rev   = SAMPLE.reduce((s,p)=>s+p.estRevenue,0);
    const score = Math.round(SAMPLE.reduce((s,p)=>s+p.aiScore,0) / total);
    const conv  = Math.round(SAMPLE.reduce((s,p)=>s+p.conversion,0) / total);
    return { total, rev, score, conv };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Smart Prospect Pipeline</h1>
          <p className="text-muted-foreground">
            Track and manage your prospects with AI-powered insights
          </p>
        </div>
        <Link to="/prospects">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Prospect
          </Button>
        </Link>
      </div>

      {/* Lead Management KPIs */}
      {data && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Leads
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                All leads in system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                New Leads
              </CardTitle>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.newLeads}</div>
              <p className="text-xs text-muted-foreground">
                Require follow-up
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Interested Leads
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.interestedLeads}</div>
              <p className="text-xs text-muted-foreground">
                Hot prospects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Conversion Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalLeads > 0 ? ((data.closedLeads / data.totalLeads) * 100).toFixed(1) : '0'}%</div>
              <p className="text-xs text-muted-foreground">
                {data.closedLeads} closed deals
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI-Powered Prospect Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Prospect Analytics</CardTitle>
          <CardDescription>
            Smart insights and scoring for your prospect pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12}}>
            <KPI title="Total Prospects" value={kpis.total} />
            <KPI title="Monthly Revenue (est.)" value={`$${kpis.rev.toLocaleString()}`} />
            <KPI title="AI Score (avg)" value={kpis.score} />
            <KPI title="Conversion Rate (avg)" value={`${kpis.conv}%`} />
          </div>
        </CardContent>
      </Card>

      {/* Revenue & Pipeline */}
      {data && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Lead Status Breakdown</CardTitle>
              <CardDescription>
                Current pipeline distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">New</span>
                <Badge variant="secondary">{data.newLeads}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Interested</span>
                <Badge variant="default">{data.interestedLeads}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Closed</span>
                <Badge variant="outline" className="text-green-600">{data.closedLeads}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and navigation
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4 flex-wrap">
              <Link to="/prospects">
                <Button variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  View All Leads
                </Button>
              </Link>
              <Link to="/prospects/new">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Lead
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Prospect Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <input 
              className="gv-input flex-1" 
              placeholder="Search prospects…" 
              value={q} 
              onChange={e=>setQ(e.target.value)} 
            />
            <select 
              className="gv-input" 
              value={type} 
              onChange={e=>setType(e.target.value as any)}
            >
              <option>All</option>
              <option>Office</option>
              <option>Hospital</option>
              <option>University</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Prospect Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">AI-Scored Prospects</h2>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16}}>
          {list.map(p => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="text-lg">{p.name}</CardTitle>
                <CardDescription>{p.city} · {p.type}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Chip label="Foot Traffic" val={`${p.footTraffic.toLocaleString()}/day`} />
                  <Chip label="Est. Revenue" val={`$${p.estRevenue.toLocaleString()}/mo`} />
                  <Chip label="AI Score" val={p.aiScore} />
                  <Chip label="Conversion" val={`${p.conversion}%`} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={()=>alert('Qualify → create lead')}>
                    Qualify
                  </Button>
                  <Button size="sm" variant="outline" onClick={()=>alert('View details')}>
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPI({ title, value }: { title:string; value:React.ReactNode }) {
  return (
    <div className="text-center space-y-1">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function Chip({ label, val }: { label:string; val:React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-semibold">{val}</span>
    </div>
  );
}
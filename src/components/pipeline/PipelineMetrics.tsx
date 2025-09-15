import React from "react";
import { BarChart3, TrendingUp, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpTooltip } from "@/components/ui/HelpTooltip";

interface SourceStats {
  source: string;
  total: number;
  won: number;
  qualified: number;
  conversionRate: number;
  qualificationRate: number;
}

interface PipelineMetricsProps {
  topSources: SourceStats[];
  stageDistribution: Record<string, number>;
  stalledList: Array<{
    id: string;
    name?: string;
    company?: string;
    contact_name?: string;
    age?: number | null;
    stage?: string;
  }>;
  monthlyGrowth: number;
}

export function PipelineMetrics({ 
  topSources, 
  stageDistribution, 
  stalledList, 
  monthlyGrowth 
}: PipelineMetricsProps) {
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const stages = ["new", "contacted", "qualified", "proposal", "won", "lost"];
  const stageColors = {
    new: "bg-gray-100 text-gray-800",
    contacted: "bg-blue-100 text-blue-800", 
    qualified: "bg-purple-100 text-purple-800",
    proposal: "bg-orange-100 text-orange-800",
    won: "bg-green-100 text-green-800",
    lost: "bg-red-100 text-red-800"
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Source Performance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top Lead Sources
            <HelpTooltip content="Performance metrics by lead source - shows total leads, qualification rate, and conversion rate" size="sm" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topSources.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              No source data available
            </div>
          ) : (
            topSources.map((source) => (
              <div key={source.source} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium capitalize">
                    {source.source === "unknown" ? "No Source" : source.source}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {source.total} leads
                  </span>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="text-muted-foreground">
                    Qualified: {formatPercent(source.qualificationRate)}
                  </span>
                  <span className="text-muted-foreground">
                    Won: {formatPercent(source.conversionRate)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1">
                  <div 
                    className="bg-primary h-1 rounded-full" 
                    style={{ width: `${Math.min(source.conversionRate, 100)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Stage Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Pipeline Stages
            <HelpTooltip content="Distribution of prospects across different pipeline stages" size="sm" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {stages.map((stage) => {
            const count = stageDistribution[stage] || 0;
            const total = Object.values(stageDistribution).reduce((sum, c) => sum + c, 0);
            const percentage = total > 0 ? (count / total) * 100 : 0;
            
            return (
              <div key={stage} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span 
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      stageColors[stage as keyof typeof stageColors] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {stage.charAt(0).toUpperCase() + stage.slice(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{formatPercent(percentage)}</span>
                  <span className="font-medium">{count}</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Stalled Prospects */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Stalled Prospects
            <HelpTooltip content="Active prospects with no activity for 30+ days that may need attention" size="sm" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stalledList.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              <div className="text-green-600 mb-1">✓ No stalled prospects</div>
              All active leads are progressing well
            </div>
          ) : (
            <div className="space-y-2">
              {stalledList.slice(0, 5).map((prospect) => (
                <div key={prospect.id} className="flex justify-between items-center text-sm">
                  <div>
                    <div className="font-medium">
                      {prospect.name || prospect.company || prospect.contact_name || "Unnamed"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {prospect.stage?.charAt(0).toUpperCase() + (prospect.stage?.slice(1) || "")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-amber-600 font-medium">
                      {prospect.age ? `${prospect.age.toFixed(0)}d` : "—"}
                    </div>
                  </div>
                </div>
              ))}
              {stalledList.length > 5 && (
                <div className="text-xs text-muted-foreground text-center pt-2">
                  +{stalledList.length - 5} more stalled prospects
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
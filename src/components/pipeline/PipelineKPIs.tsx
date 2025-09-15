import React from "react";
import { 
  Users, TrendingUp, Clock, DollarSign, Target, AlertTriangle,
  Calendar, BarChart3, Zap, CheckCircle2
} from "lucide-react";
import { HelpTooltip } from "@/components/ui/HelpTooltip";

interface KPIData {
  totalProspects: number;
  activeProspects: number;
  newLast7Days: number;
  newLast30Days: number;
  wonThisMonth: number;
  monthlyGrowth: number;
  conversionRate: number;
  qualificationRate: number;
  avgSalesCycle: number | null;
  pipelineValue: number;
  avgDealSize: number;
  overdueFollowups: number;
  next30DaysFollowups: number;
  salesVelocity: number;
  stalledProspects: number;
}

interface PipelineKPIsProps {
  data: KPIData;
}

export function PipelineKPIs({ data }: PipelineKPIsProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;
  const formatDays = (value: number | null) => value !== null ? `${value.toFixed(1)}d` : "—";

  return (
    <div className="space-y-4">
      {/* Primary KPIs */}
      <div className="grid gap-3 sm:grid-cols-5">
        <KPICard
          icon={Users}
          label="Total Prospects"
          value={data.totalProspects.toString()}
          tooltip="Total number of prospects in your pipeline"
        />
        
        <KPICard
          icon={Target}
          label="Active Leads"
          value={data.activeProspects.toString()}
          tooltip="Prospects currently in the sales pipeline (not won or lost)"
        />
        
        <KPICard
          icon={TrendingUp}
          label="New (7d)"
          value={data.newLast7Days.toString()}
          tooltip="New prospects added in the last 7 days"
          trend={data.newLast7Days > data.newLast30Days / 4 ? "up" : "down"}
        />
        
        <KPICard
          icon={CheckCircle2}
          label="Won (Month)"
          value={data.wonThisMonth.toString()}
          tooltip="Prospects converted to customers this month"
          trend={data.monthlyGrowth > 0 ? "up" : data.monthlyGrowth < 0 ? "down" : "neutral"}
        />
        
        <KPICard
          icon={BarChart3}
          label="Conversion Rate"
          value={formatPercent(data.conversionRate)}
          tooltip="Percentage of decided prospects that were won (Won / (Won + Lost))"
          trend={data.conversionRate > 20 ? "up" : data.conversionRate < 10 ? "down" : "neutral"}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-3 sm:grid-cols-4">
        <KPICard
          icon={DollarSign}
          label="Pipeline Value"
          value={formatCurrency(data.pipelineValue)}
          tooltip="Total estimated value of all active prospects"
        />
        
        <KPICard
          icon={DollarSign}
          label="Avg Deal Size"
          value={formatCurrency(data.avgDealSize)}
          tooltip="Average value of won prospects"
        />
        
        <KPICard
          icon={Clock}
          label="Avg Sales Cycle"
          value={formatDays(data.avgSalesCycle)}
          tooltip="Average number of days from prospect creation to conversion"
        />
        
        <KPICard
          icon={Zap}
          label="Sales Velocity"
          value={`${data.salesVelocity.toFixed(1)}/day`}
          tooltip="Average deals closed per day this month"
        />
      </div>

      {/* Activity & Health KPIs */}
      <div className="grid gap-3 sm:grid-cols-4">
        <KPICard
          icon={AlertTriangle}
          label="Overdue Follow-ups"
          value={data.overdueFollowups.toString()}
          tooltip="Prospects with overdue follow-up dates"
          tone={data.overdueFollowups > 0 ? "warn" : "ok"}
        />
        
        <KPICard
          icon={Calendar}
          label="Next 30d Follow-ups"
          value={data.next30DaysFollowups.toString()}
          tooltip="Scheduled follow-ups in the next 30 days"
        />
        
        <KPICard
          icon={Target}
          label="Qualification Rate"
          value={formatPercent(data.qualificationRate)}
          tooltip="Percentage of prospects that move beyond initial contact stage"
        />
        
        <KPICard
          icon={Clock}
          label="Stalled Prospects"
          value={data.stalledProspects.toString()}
          tooltip="Active prospects with no activity for 30+ days"
          tone={data.stalledProspects > 5 ? "warn" : "ok"}
        />
      </div>
    </div>
  );
}

interface KPICardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tooltip?: string;
  trend?: "up" | "down" | "neutral";
  tone?: "warn" | "ok";
}

function KPICard({ icon: Icon, label, value, tooltip, trend, tone }: KPICardProps) {
  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case "up": return "text-green-600";
      case "down": return "text-red-600";
      default: return "text-foreground";
    }
  };

  const getToneColor = (tone?: string) => {
    switch (tone) {
      case "warn": return "text-amber-600";
      case "ok": return "text-green-600";
      default: return "text-foreground";
    }
  };

  const valueColor = tone ? getToneColor(tone) : getTrendColor(trend);

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Icon className="h-4 w-4" />
          {label}
          {tooltip && <HelpTooltip content={tooltip} size="sm" />}
        </div>
        {trend && (
          <TrendingUp 
            className={`h-3 w-3 ${getTrendColor(trend)} ${trend === "down" ? "rotate-180" : ""}`}
          />
        )}
      </div>
      <div className={`text-lg font-semibold ${valueColor}`}>
        {value}
      </div>
    </div>
  );
}
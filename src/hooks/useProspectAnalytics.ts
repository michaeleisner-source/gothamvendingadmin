import { useMemo } from "react";

type Prospect = {
  id: string;
  name?: string | null;
  company?: string | null;
  contact_name?: string | null;
  stage?: string | null;
  status?: string | null;
  source?: string | null;
  owner_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  next_follow_up_at?: string | null;
  converted_location_id?: string | null;
  estimated_value?: number | null;
  won_at?: string | null;
  lost_at?: string | null;
};

function pickStage(p: Prospect) {
  const s = (p.stage || p.status || "new").toLowerCase();
  const normalized: Record<string, string> = {
    new: "new",
    contacted: "contacted",
    qualifying: "qualified",
    qualified: "qualified",
    meeting: "qualified",
    proposal: "proposal",
    won: "won",
    closed_won: "won",
    lost: "lost",
    closed_lost: "lost",
  };
  return normalized[s] || "new";
}

function isOverdue(p: Prospect) {
  const d = p.next_follow_up_at ? new Date(p.next_follow_up_at) : null;
  return d ? d.getTime() < Date.now() : false;
}

function daysBetween(dateStr1?: string | null, dateStr2?: string | null): number | null {
  if (!dateStr1 || !dateStr2) return null;
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
  return Math.abs((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export function useProspectAnalytics(prospects: Prospect[]) {
  return useMemo(() => {
    const now = new Date();
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Basic counts
    const totalProspects = prospects.length;
    const activeProspects = prospects.filter(p => !["won", "lost"].includes(pickStage(p)));
    const wonProspects = prospects.filter(p => pickStage(p) === "won");
    const lostProspects = prospects.filter(p => pickStage(p) === "lost");

    // Time-based metrics
    const newLast7Days = prospects.filter(p => {
      const created = p.created_at ? new Date(p.created_at) : null;
      return created && created >= last7Days;
    }).length;

    const newLast30Days = prospects.filter(p => {
      const created = p.created_at ? new Date(p.created_at) : null;
      return created && created >= last30Days;
    }).length;

    const wonThisMonth = prospects.filter(p => {
      const stage = pickStage(p);
      const updated = p.updated_at ? new Date(p.updated_at) : null;
      const wonDate = p.won_at ? new Date(p.won_at) : updated;
      const isThisMonth = wonDate && 
        wonDate >= thisMonth && 
        wonDate < nextMonth;
      return stage === "won" && isThisMonth;
    }).length;

    const wonLastMonth = prospects.filter(p => {
      const stage = pickStage(p);
      const updated = p.updated_at ? new Date(p.updated_at) : null;
      const wonDate = p.won_at ? new Date(p.won_at) : updated;
      const isLastMonth = wonDate && 
        wonDate >= lastMonth && 
        wonDate < thisMonth;
      return stage === "won" && isLastMonth;
    }).length;

    // Conversion metrics
    const decidedProspects = wonProspects.length + lostProspects.length;
    const conversionRate = decidedProspects > 0 ? (wonProspects.length / decidedProspects) * 100 : 0;
    const qualificationRate = totalProspects > 0 ? 
      (prospects.filter(p => !["new"].includes(pickStage(p))).length / totalProspects) * 100 : 0;

    // Sales cycle analytics
    const wonWithDuration = wonProspects
      .map(p => ({
        ...p,
        duration: daysBetween(p.created_at, p.won_at || p.updated_at)
      }))
      .filter(p => p.duration !== null);

    const avgSalesCycle = wonWithDuration.length > 0 ? 
      wonWithDuration.reduce((sum, p) => sum + (p.duration || 0), 0) / wonWithDuration.length : null;

    // Pipeline value
    const pipelineValue = activeProspects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
    const avgDealSize = wonProspects.length > 0 ? 
      wonProspects.reduce((sum, p) => sum + (p.estimated_value || 0), 0) / wonProspects.length : 0;

    // Follow-up metrics
    const overdueFollowups = prospects.filter(p => isOverdue(p)).length;
    const next30DaysFollowups = prospects.filter(p => {
      const followup = p.next_follow_up_at ? new Date(p.next_follow_up_at) : null;
      const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      return followup && followup >= now && followup <= in30Days;
    }).length;

    // Source performance
    const sourceStats = prospects.reduce((acc, p) => {
      const source = p.source || "unknown";
      if (!acc[source]) {
        acc[source] = { total: 0, won: 0, qualified: 0 };
      }
      acc[source].total++;
      if (pickStage(p) === "won") acc[source].won++;
      if (!["new"].includes(pickStage(p))) acc[source].qualified++;
      return acc;
    }, {} as Record<string, { total: number; won: number; qualified: number }>);

    const topSources = Object.entries(sourceStats)
      .map(([source, stats]) => ({
        source,
        ...stats,
        conversionRate: stats.total > 0 ? (stats.won / stats.total) * 100 : 0,
        qualificationRate: stats.total > 0 ? (stats.qualified / stats.total) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Stage distribution
    const stageDistribution = prospects.reduce((acc, p) => {
      const stage = pickStage(p);
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Velocity metrics
    const monthlyGrowth = wonLastMonth > 0 ? ((wonThisMonth - wonLastMonth) / wonLastMonth) * 100 : 0;
    const salesVelocity = wonThisMonth / (now.getDate()); // deals per day this month

    // Age of active prospects
    const activeWithAge = activeProspects
      .map(p => ({
        ...p,
        age: daysBetween(p.created_at, now.toISOString())
      }))
      .filter(p => p.age !== null);

    const avgActiveAge = activeWithAge.length > 0 ?
      activeWithAge.reduce((sum, p) => sum + (p.age || 0), 0) / activeWithAge.length : null;

    // Stalled prospects (>30 days active)
    const stalledProspects = activeWithAge.filter(p => (p.age || 0) > 30);

    return {
      // Basic metrics
      totalProspects,
      activeProspects: activeProspects.length,
      wonProspects: wonProspects.length,
      lostProspects: lostProspects.length,
      
      // Time-based metrics
      newLast7Days,
      newLast30Days,
      wonThisMonth,
      wonLastMonth,
      monthlyGrowth,
      salesVelocity,
      
      // Conversion metrics
      conversionRate,
      qualificationRate,
      
      // Sales cycle metrics
      avgSalesCycle,
      avgActiveAge,
      
      // Pipeline metrics
      pipelineValue,
      avgDealSize,
      
      // Follow-up metrics
      overdueFollowups,
      next30DaysFollowups,
      
      // Advanced analytics
      topSources,
      stageDistribution,
      stalledProspects: stalledProspects.length,
      
      // Raw data for components
      prospects,
      stalledList: stalledProspects.slice(0, 10),
    };
  }, [prospects]);
}
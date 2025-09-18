import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExecutiveSummary } from "@/components/analytics/ExecutiveSummary";
import { PredictiveAnalytics } from "@/components/analytics/PredictiveAnalytics";
import { PerformanceBenchmarks } from "@/components/analytics/PerformanceBenchmarks";
import { CustomReportBuilder } from "@/components/analytics/CustomReportBuilder";
import { usePageSEO } from "@/hooks/usePageSEO";
import { Brain, TrendingUp, Target, BarChart3 } from "lucide-react";

export default function AdvancedAnalytics() {
  usePageSEO({
    title: "Advanced Analytics - Gotham Vending Admin",
    description: "AI-powered business intelligence, predictive analytics, and custom reporting for data-driven decision making",
    keywords: "advanced analytics, business intelligence, predictive analytics, custom reports, performance benchmarks"
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Advanced Analytics</h1>
        <p className="text-muted-foreground">
          AI-powered insights, predictive analytics, and business intelligence dashboard
        </p>
      </div>

      <Tabs defaultValue="executive" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="executive" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Executive
          </TabsTrigger>
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Predictive
          </TabsTrigger>
          <TabsTrigger value="benchmarks" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Benchmarks
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="executive">
          <ExecutiveSummary />
        </TabsContent>

        <TabsContent value="predictive">
          <PredictiveAnalytics />
        </TabsContent>

        <TabsContent value="benchmarks">
          <PerformanceBenchmarks />
        </TabsContent>

        <TabsContent value="reports">
          <CustomReportBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
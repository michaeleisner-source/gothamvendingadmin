import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpTooltip, HelpTooltipProvider } from "@/components/ui/HelpTooltip";
import { 
  MapPin, Factory, Package, DollarSign, BarChart3, 
  Users, Truck, ArrowRight, CheckCircle, Clock,
  AlertTriangle, TrendingUp, Settings
} from "lucide-react";

/**
 * Business Flow Overview - Shows the complete vending business process
 * Helps users understand the workflow and navigate efficiently
 */

const BusinessFlow = () => {
  const workflows = [
    {
      title: "Pipeline & Prospects",
      icon: MapPin,
      color: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600",
      stages: [
        { name: "Lead Generation", link: "/prospects", status: "complete" },
        { name: "Site Evaluation", link: "/prospects", status: "complete" },
        { name: "Contract Negotiation", link: "/contracts", status: "complete" },
        { name: "Location Conversion", link: "/locations", status: "complete" }
      ],
      description: "Manage your sales pipeline from initial contact to active locations",
      completion: "100%"
    },
    {
      title: "Machine Operations",
      icon: Factory,
      color: "bg-green-50 border-green-200",
      iconColor: "text-green-600",
      stages: [
        { name: "Machine Setup", link: "/machines/new", status: "complete" },
        { name: "Slot Planning", link: "/machines", status: "complete" },
        { name: "Product Assignment", link: "/machines", status: "complete" },
        { name: "Health Monitoring", link: "/machines/health", status: "complete" }
      ],
      description: "Configure and deploy vending machines efficiently",
      completion: "100%"
    },
    {
      title: "Supply Chain Management",
      icon: Package,
      color: "bg-purple-50 border-purple-200",
      iconColor: "text-purple-600",
      stages: [
        { name: "Product Catalog", link: "/products", status: "complete" },
        { name: "Supplier Management", link: "/suppliers", status: "complete" },
        { name: "Purchase Orders", link: "/purchase-orders", status: "complete" },
        { name: "Inventory Tracking", link: "/inventory", status: "complete" }
      ],
      description: "Manage products, suppliers, and inventory levels",
      completion: "100%"
    },
    {
      title: "Route & Service Operations",
      icon: Truck,
      color: "bg-orange-50 border-orange-200",
      iconColor: "text-orange-600",
      stages: [
        { name: "Route Optimization", link: "/routes", status: "complete" },
        { name: "Service Scheduling", link: "/delivery-routes", status: "complete" },
        { name: "Mobile Operations", link: "/mobile", status: "complete" },
        { name: "Issue Management", link: "/maintenance", status: "complete" }
      ],
      description: "Optimize routes and execute field operations",
      completion: "100%"
    },
    {
      title: "Financial Management",
      icon: DollarSign,
      color: "bg-emerald-50 border-emerald-200",
      iconColor: "text-emerald-600",
      stages: [
        { name: "P&L Statement", link: "/finance-management", status: "complete" },
        { name: "Cash Flow Analysis", link: "/finance-management", status: "complete" },
        { name: "Commission Automation", link: "/finance-management", status: "complete" },
        { name: "Cost Analytics", link: "/cost-analysis", status: "complete" }
      ],
      description: "Comprehensive financial analysis and management",
      completion: "100%"
    },
    {
      title: "Advanced Analytics & BI",
      icon: BarChart3,
      color: "bg-indigo-50 border-indigo-200",
      iconColor: "text-indigo-600",
      stages: [
        { name: "Executive Dashboard", link: "/advanced-analytics", status: "complete" },
        { name: "Predictive Analytics", link: "/advanced-analytics", status: "complete" },
        { name: "Performance Benchmarks", link: "/advanced-analytics", status: "complete" },
        { name: "Custom Report Builder", link: "/advanced-analytics", status: "complete" }
      ],
      description: "AI-powered insights and business intelligence",
      completion: "100%"
    },
    {
      title: "Customer Experience",
      icon: Users,
      color: "bg-rose-50 border-rose-200",
      iconColor: "text-rose-600",
      stages: [
        { name: "Customer Analytics", link: "/customers", status: "partial" },
        { name: "Loyalty Programs", link: "#", status: "missing" },
        { name: "Feedback System", link: "#", status: "missing" },
        { name: "Support Portal", link: "/help", status: "complete" }
      ],
      description: "Enhance customer satisfaction and retention",
      completion: "50%"
    },
    {
      title: "Mobile & Field Operations",
      icon: Truck,
      color: "bg-cyan-50 border-cyan-200",
      iconColor: "text-cyan-600",
      stages: [
        { name: "Driver App", link: "/driver-dashboard", status: "complete" },
        { name: "Field Reporting", link: "/mobile", status: "complete" },
        { name: "Offline Sync", link: "#", status: "missing" },
        { name: "GPS Tracking", link: "#", status: "missing" }
      ],
      description: "Mobile-first field operations and tracking",
      completion: "60%"
    }
  ];

  const quickActions = [
    { name: "Record Sale", link: "/sales", icon: TrendingUp },
    { name: "Quick Restock", link: "/restock", icon: Package },
    { name: "Field Actions", link: "/mobile", icon: Truck },
    { name: "Create Ticket", link: "/tickets", icon: AlertTriangle }
  ];

  return (
    <HelpTooltipProvider>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Business Process Flow</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Complete overview of your vending business operations from prospect to profit.
            Follow the workflows below to optimize your business processes.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Quick Actions
              <HelpTooltip content="Common daily tasks for efficient operations" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.link}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <action.icon className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium text-center">{action.name}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Workflow Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {workflows.map((workflow) => {
            const IconComponent = workflow.icon;
            return (
              <Card key={workflow.title} className={workflow.color}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white ${workflow.iconColor}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{workflow.title}</h3>
                        <Badge 
                          variant={workflow.completion === "100%" ? "default" : workflow.completion === "50%" || workflow.completion === "60%" ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {workflow.completion} Complete
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-normal">
                        {workflow.description}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {workflow.stages.map((stage, index) => (
                    <div key={stage.name} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-6 h-6 rounded-full bg-white border-2 border-muted-foreground/20 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        {stage.link !== "#" ? (
                          <Link
                            to={stage.link}
                            className="text-sm font-medium hover:underline"
                          >
                            {stage.name}
                          </Link>
                        ) : (
                          <span className="text-sm font-medium text-muted-foreground">
                            {stage.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge 
                          variant={stage.status === "complete" ? "default" : stage.status === "partial" ? "secondary" : "destructive"} 
                          className="text-xs"
                        >
                          {stage.status === "complete" && <CheckCircle className="h-3 w-3 mr-1" />}
                          {stage.status === "partial" && <Clock className="h-3 w-3 mr-1" />}
                          {stage.status === "missing" && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {stage.status === "complete" ? "Ready" : stage.status === "partial" ? "Partial" : "Missing"}
                        </Badge>
                        {stage.status === "complete" && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Health & Administration
              <HelpTooltip content="Monitor system health and access administrative functions" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                to="/health"
                className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <BarChart3 className="h-6 w-6 text-green-600" />
                <span className="text-sm font-medium">System Health</span>
              </Link>
              <Link
                to="/audit"
                className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <CheckCircle className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-medium">Audit Logs</span>
              </Link>
              <Link
                to="/staff"
                className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <Users className="h-6 w-6 text-purple-600" />
                <span className="text-sm font-medium">Staff Management</span>
              </Link>
              <Link
                to="/admin/review-snapshot"
                className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <AlertTriangle className="h-6 w-6 text-orange-600" />
                <span className="text-sm font-medium">Review Snapshot</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </HelpTooltipProvider>
  );
};

export default BusinessFlow;
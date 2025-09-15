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
        { name: "Lead Generation", link: "/prospects", status: "active" },
        { name: "Site Evaluation", link: "/prospects", status: "active" },
        { name: "Contract Negotiation", link: "/prospects", status: "active" },
        { name: "Location Conversion", link: "/locations", status: "active" }
      ],
      description: "Manage your sales pipeline from initial contact to active locations"
    },
    {
      title: "Machine Operations",
      icon: Factory,
      color: "bg-green-50 border-green-200",
      iconColor: "text-green-600",
      stages: [
        { name: "Machine Setup", link: "/setup", status: "active" },
        { name: "Slot Planning", link: "/slots", status: "active" },
        { name: "Product Assignment", link: "/machines", status: "active" },
        { name: "Go Live", link: "/machines", status: "active" }
      ],
      description: "Configure and deploy vending machines efficiently"
    },
    {
      title: "Supply Chain",
      icon: Package,
      color: "bg-purple-50 border-purple-200",
      iconColor: "text-purple-600",
      stages: [
        { name: "Product Catalog", link: "/products", status: "active" },
        { name: "Purchase Orders", link: "/purchase-orders", status: "active" },
        { name: "Inventory Tracking", link: "/inventory", status: "active" },
        { name: "Restocking", link: "/restock", status: "active" }
      ],
      description: "Manage products, suppliers, and inventory levels"
    },
    {
      title: "Daily Operations",
      icon: Truck,
      color: "bg-orange-50 border-orange-200",
      iconColor: "text-orange-600",
      stages: [
        { name: "Route Planning", link: "/delivery-routes", status: "active" },
        { name: "Service Execution", link: "/mobile", status: "active" },
        { name: "Sales Recording", link: "/sales", status: "active" },
        { name: "Issue Resolution", link: "/tickets", status: "active" }
      ],
      description: "Execute daily operations and handle service issues"
    },
    {
      title: "Financial Management",
      icon: DollarSign,
      color: "bg-emerald-50 border-emerald-200",
      iconColor: "text-emerald-600",
      stages: [
        { name: "Revenue Tracking", link: "/reports/sales-summary", status: "active" },
        { name: "Cost Analysis", link: "/finance", status: "active" },
        { name: "Profitability", link: "/reports/product-profitability-net", status: "active" },
        { name: "ROI Reports", link: "/reports/machine-roi", status: "active" }
      ],
      description: "Monitor financial performance and optimize profitability"
    },
    {
      title: "Business Intelligence",
      icon: BarChart3,
      color: "bg-indigo-50 border-indigo-200",
      iconColor: "text-indigo-600",
      stages: [
        { name: "Performance Analytics", link: "/reports", status: "active" },
        { name: "Route Efficiency", link: "/reports/route-efficiency", status: "active" },
        { name: "Prospect Funnel", link: "/reports/prospect-funnel", status: "active" },
        { name: "Health Monitoring", link: "/health", status: "active" }
      ],
      description: "Analyze data and make informed business decisions"
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
                    <div>
                      <h3 className="font-semibold">{workflow.title}</h3>
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
                        <Link
                          to={stage.link}
                          className="text-sm font-medium hover:underline"
                        >
                          {stage.name}
                        </Link>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ready
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
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
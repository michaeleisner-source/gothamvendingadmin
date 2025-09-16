import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const qaRoutes = [
  { to: "/qa/overview", label: "QA Overview", description: "Comprehensive route and edge function testing" },
  { to: "/qa/smoke", label: "QA Smoke Test", description: "Basic functionality tests" },
  { to: "/qa/seed", label: "Seed Demo Data", description: "Populate database with test data" },
  { to: "/qa/verify", label: "Verify Smoke", description: "Verify smoke test results" },
  { to: "/qa/control", label: "QA Control", description: "Quality assurance control panel" },
  { to: "/qa/launcher2", label: "QA Launcher 2", description: "Alternative QA launcher" },
];

const debugRoutes = [
  { to: "/health", label: "Health Check", description: "System health monitoring" },
  { to: "/audit", label: "Audit", description: "System audit and compliance" },
  { to: "/debug", label: "Debug", description: "Debug utilities and tools" },
];

export default function QALauncher() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">QA Launcher</h1>
        <p className="text-muted-foreground">
          Quality assurance tools and testing utilities for development and debugging.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>QA Testing Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {qaRoutes.map((route) => (
              <Link
                key={route.to}
                to={route.to}
                className="block p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="font-medium">{route.label}</div>
                <div className="text-sm text-muted-foreground mt-1">{route.description}</div>
                <div className="text-xs text-muted-foreground mt-2 font-mono">{route.to}</div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug & System Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {debugRoutes.map((route) => (
              <Link
                key={route.to}
                to={route.to}
                className="block p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="font-medium">{route.label}</div>
                <div className="text-sm text-muted-foreground mt-1">{route.description}</div>
                <div className="text-xs text-muted-foreground mt-2 font-mono">{route.to}</div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
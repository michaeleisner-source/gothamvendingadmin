import React from "react";
import { Route } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

function ReviewSnapshotPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Review Snapshot</h1>
        <p className="text-muted-foreground">
          System review and snapshot functionality
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Review snapshot functionality is not available with the current simplified database schema.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Snapshot Overview</CardTitle>
          <CardDescription>
            System review and snapshot tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Review snapshot requires comprehensive system data and audit logs
            that are not available in the current simplified schema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/** Route helper you'll import in App.tsx */
export function ReviewSnapshotRoutes({ ProtectedRoute }: { ProtectedRoute?: React.ComponentType<{children:React.ReactNode}> }) {
  const Wrap: React.FC<{children:React.ReactNode}> = ({ children }) =>
    ProtectedRoute ? <ProtectedRoute>{children}</ProtectedRoute> : <>{children}</>;
  return (
    <>
      <Route path="/qa/review" element={<Wrap><ReviewSnapshotPage /></Wrap>} />
    </>
  );
}

export default ReviewSnapshotPage;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function LocationDetail() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Location Details</h1>
        <p className="text-muted-foreground">
          View detailed information about locations
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Location details are not available with the current simplified database schema.
          This feature requires the full location and machine data structure.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Location Information</CardTitle>
          <CardDescription>
            Detailed location performance and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Location details require comprehensive location data, machine assignments, and performance metrics
            that are not available in the current simplified schema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
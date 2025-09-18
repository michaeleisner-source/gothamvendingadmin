import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function MachineDetail() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Machine Details</h1>
        <p className="text-muted-foreground">
          View detailed machine information and performance
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Machine details are not available with the current simplified database schema.
          This feature requires the full vending machine data structure.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Machine Information</CardTitle>
          <CardDescription>
            Detailed machine status, performance, and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Machine details require comprehensive machine data, telemetry, and performance metrics
            that are not available in the current simplified schema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
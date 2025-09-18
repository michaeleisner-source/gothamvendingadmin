import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function LocationCommission() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Location Commission</h1>
        <p className="text-muted-foreground">
          Location-based commission reporting
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Location commission reporting is not available with the current simplified database schema.
          This feature requires sales and commission data.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Commission Reports</CardTitle>
          <CardDescription>
            Location-based commission calculations and reporting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Commission reporting requires detailed sales data, commission structures, and location data
            that are not available in the current simplified schema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
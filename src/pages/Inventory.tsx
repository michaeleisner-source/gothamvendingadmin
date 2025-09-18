import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function Inventory() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground">
          Manage product inventory and stock levels
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Inventory management is not available with the current simplified database schema.
          This feature requires product, machine, and inventory data.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Overview</CardTitle>
          <CardDescription>
            Track product inventory, stock levels, and restocking needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Inventory management requires product catalogs, machine configurations, and stock tracking
            that are not available in the current simplified schema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
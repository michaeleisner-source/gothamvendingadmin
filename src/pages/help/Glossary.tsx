import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function Glossary() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Glossary"
        description="Definitions of terms and concepts used in Gotham Vending"
      />

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <h4 className="font-semibold">Commission Model</h4>
                <p className="text-sm text-muted-foreground">The method used to calculate location owner compensation (percentage, flat rate, or hybrid).</p>
              </div>
              <div>
                <h4 className="font-semibold">Par Level</h4>
                <p className="text-sm text-muted-foreground">The target inventory quantity to maintain in each machine slot.</p>
              </div>
              <div>
                <h4 className="font-semibold">Planogram</h4>
                <p className="text-sm text-muted-foreground">The layout configuration showing which products go in which machine slots.</p>
              </div>
              <div>
                <h4 className="font-semibold">Route</h4>
                <p className="text-sm text-muted-foreground">A scheduled path for servicing multiple machines, typically for restocking or maintenance.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
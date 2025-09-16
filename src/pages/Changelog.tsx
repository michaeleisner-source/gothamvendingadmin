import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Changelog() {
  const releases = [
    {
      version: "v2.1.0",
      date: "2024-01-15",
      type: "feature",
      items: [
        "Added advanced location performance analytics",
        "New stockout prediction reports",
        "Enhanced sales trend analysis",
        "Improved CSV export functionality"
      ]
    },
    {
      version: "v2.0.5",
      date: "2024-01-10", 
      type: "fix",
      items: [
        "Fixed commission calculation edge cases",
        "Resolved inventory sync issues",
        "Improved machine health monitoring"
      ]
    },
    {
      version: "v2.0.0",
      date: "2024-01-01",
      type: "major",
      items: [
        "Complete UI redesign",
        "New reporting dashboard",
        "Enhanced commission management",
        "Mobile-optimized interface"
      ]
    }
  ];

  const getBadgeVariant = (type: string) => {
    switch(type) {
      case 'major': return 'default';
      case 'feature': return 'secondary';
      case 'fix': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Changelog"
        description="Latest updates and improvements to Gotham Vending"
      />

      <div className="space-y-4">
        {releases.map((release) => (
          <Card key={release.version}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {release.version}
                  <Badge variant={getBadgeVariant(release.type)}>
                    {release.type}
                  </Badge>
                </CardTitle>
                <span className="text-sm text-muted-foreground">{release.date}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {release.items.map((item, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
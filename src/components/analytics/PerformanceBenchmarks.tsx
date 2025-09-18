import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Trophy, Target, TrendingUp, MapPin, Users, DollarSign } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";

export function PerformanceBenchmarks() {
  const { data: dashboardData, isLoading } = useDashboardData();

  // Mock benchmark data
  const locationBenchmarks = [
    { name: "Downtown Mall", revenue: 12500, industry: 8500, score: 94, rank: 1 },
    { name: "Airport Terminal", revenue: 15200, industry: 12000, score: 91, rank: 2 },
    { name: "University Campus", revenue: 8900, industry: 7200, score: 88, rank: 3 },
    { name: "Office Complex", revenue: 6400, industry: 6800, score: 82, rank: 4 },
    { name: "Shopping Center", revenue: 9200, industry: 9500, score: 79, rank: 5 }
  ];

  const machineBenchmarks = [
    { name: "VM-001", utilization: 87, industry: 72, efficiency: 92, profit: 115 },
    { name: "VM-003", utilization: 82, industry: 72, efficiency: 88, profit: 108 },
    { name: "VM-007", utilization: 79, industry: 72, efficiency: 85, profit: 102 },
    { name: "VM-012", utilization: 74, industry: 72, efficiency: 81, profit: 95 },
    { name: "VM-015", utilization: 69, industry: 72, efficiency: 76, profit: 88 }
  ];

  const overallMetrics = [
    { metric: "Revenue per Machine", value: 95, label: "95% above industry average" },
    { metric: "Customer Satisfaction", value: 88, label: "88% satisfaction rate" },
    { metric: "Operational Efficiency", value: 82, label: "82% efficiency score" },
    { metric: "Profit Margins", value: 91, label: "91% above target margins" },
    { metric: "Machine Uptime", value: 96, label: "96% uptime achieved" },
    { metric: "Inventory Turnover", value: 78, label: "78% optimal turnover" }
  ];

  const competitorAnalysis = [
    { subject: "Revenue Growth", A: 85, B: 72, fullMark: 100 },
    { subject: "Market Share", A: 78, B: 65, fullMark: 100 },
    { subject: "Operational Costs", A: 82, B: 88, fullMark: 100 },
    { subject: "Customer Retention", A: 91, B: 76, fullMark: 100 },
    { subject: "Innovation", A: 87, B: 69, fullMark: 100 },
    { subject: "Service Quality", A: 93, B: 81, fullMark: 100 }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Benchmarks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Performance Benchmarks
          </CardTitle>
          <CardDescription>
            Compare your performance against industry standards and competitors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overall" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overall">Overall Metrics</TabsTrigger>
              <TabsTrigger value="locations">Locations</TabsTrigger>
              <TabsTrigger value="machines">Machines</TabsTrigger>
              <TabsTrigger value="competitive">Competitive</TabsTrigger>
            </TabsList>

            <TabsContent value="overall" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overallMetrics.map((metric, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{metric.metric}</span>
                          <Badge 
                            variant={metric.value >= 85 ? "default" : metric.value >= 70 ? "secondary" : "destructive"}
                          >
                            {metric.value}%
                          </Badge>
                        </div>
                        <Progress value={metric.value} className="h-2" />
                        <p className="text-xs text-muted-foreground">{metric.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Performance Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold">$1.2M</div>
                      <div className="text-sm text-muted-foreground">Annual Revenue</div>
                      <Badge variant="default" className="mt-1">+15% YoY</Badge>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold">94%</div>
                      <div className="text-sm text-muted-foreground">Target Achievement</div>
                      <Badge variant="default" className="mt-1">Excellent</Badge>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <MapPin className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <div className="text-2xl font-bold">24</div>
                      <div className="text-sm text-muted-foreground">Active Locations</div>
                      <Badge variant="secondary" className="mt-1">+3 This Month</Badge>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Users className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                      <div className="text-2xl font-bold">87%</div>
                      <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
                      <Badge variant="default" className="mt-1">Above Industry</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="locations" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Location Performance Ranking</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Compare location performance against industry benchmarks
                </p>
              </div>
              <div className="h-80 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locationBenchmarks}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `$${Number(value).toLocaleString()}`,
                        name === 'revenue' ? 'Your Revenue' : 'Industry Average'
                      ]}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                    <Bar dataKey="industry" fill="hsl(var(--muted-foreground))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {locationBenchmarks.map((location, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{location.rank}</Badge>
                      <div>
                        <div className="font-medium">{location.name}</div>
                        <div className="text-sm text-muted-foreground">
                          ${location.revenue.toLocaleString()} vs ${location.industry.toLocaleString()} industry avg
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{location.score}/100</div>
                      <Badge 
                        variant={location.score >= 90 ? "default" : location.score >= 80 ? "secondary" : "destructive"}
                      >
                        {location.score >= 90 ? "Excellent" : location.score >= 80 ? "Good" : "Needs Improvement"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="machines" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Machine Performance Analysis</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Individual machine performance compared to industry standards
                </p>
              </div>
              <div className="space-y-3">
                {machineBenchmarks.map((machine, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">{machine.name}</span>
                        <Badge variant={machine.profit >= 100 ? "default" : "secondary"}>
                          {machine.profit}% Profit Index
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Utilization</div>
                          <div className="flex items-center gap-2">
                            <Progress value={machine.utilization} className="flex-1 h-2" />
                            <span className="text-sm font-medium">{machine.utilization}%</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Industry: {machine.industry}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Efficiency</div>
                          <div className="flex items-center gap-2">
                            <Progress value={machine.efficiency} className="flex-1 h-2" />
                            <span className="text-sm font-medium">{machine.efficiency}%</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Profit Score</div>
                          <div className="text-lg font-semibold text-green-600">{machine.profit}%</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="competitive" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Competitive Analysis</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Performance comparison against key competitors
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={competitorAnalysis}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Your Company"
                        dataKey="A"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                      />
                      <Radar
                        name="Competitor Average"
                        dataKey="B"
                        stroke="hsl(var(--muted-foreground))"
                        fill="hsl(var(--muted-foreground))"
                        fillOpacity={0.1}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        Competitive Advantages
                      </h4>
                      <ul className="text-sm space-y-1">
                        <li>• 23% higher customer retention rate</li>
                        <li>• 18% better service quality scores</li>
                        <li>• 15% faster response times</li>
                        <li>• Superior technology integration</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        Improvement Opportunities
                      </h4>
                      <ul className="text-sm space-y-1">
                        <li>• Reduce operational costs by 8%</li>
                        <li>• Increase market share in new regions</li>
                        <li>• Enhance mobile payment options</li>
                        <li>• Expand healthy snack offerings</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
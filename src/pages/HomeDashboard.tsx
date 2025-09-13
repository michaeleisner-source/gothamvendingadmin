import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Machine = {
  id: string;
  name: string;
  location: string | null;
  status: string | null;
  created_at: string | null;
};

const fetchMachines = async (): Promise<Machine[]> => {
  const { data, error } = await (supabase as any)
    .from("machines")
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

const HomeDashboard = () => {
  const { data: machines = [], isLoading, error } = useQuery({
    queryKey: ["machines"],
    queryFn: fetchMachines,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-12"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
        <p className="text-destructive">Error loading machines data</p>
      </div>
    );
  }

  const totalMachines = machines.length;
  const onlineMachines = machines.filter(m => m.status === 'ONLINE').length;
  const offlineMachines = machines.filter(m => m.status === 'OFFLINE').length;
  const serviceMachines = machines.filter(m => m.status === 'SERVICE').length;

  const kpiData = [
    {
      title: "Total Machines",
      value: totalMachines,
      className: "text-primary"
    },
    {
      title: "Online",
      value: onlineMachines,
      className: "text-green-600"
    },
    {
      title: "Offline", 
      value: offlineMachines,
      className: "text-red-600"
    },
    {
      title: "Service",
      value: serviceMachines,
      className: "text-yellow-600"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${kpi.className}`}>
                {kpi.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HomeDashboard;
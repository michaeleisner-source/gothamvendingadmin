import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Machine = {
  id: string;
  name: string;
  location: string | null;
  status: string | null;
};

const fetchMachines = async (): Promise<Machine[]> => {
  const { data, error } = await (supabase as any)
    .from("machines")
    .select("id, name, location, status")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

const getStatusVariant = (status: string | null) => {
  switch (status?.toUpperCase()) {
    case "ONLINE":
      return "default";
    case "OFFLINE":
      return "destructive";
    case "MAINTENANCE":
      return "secondary";
    default:
      return "outline";
  }
};

export const MachinesList = () => {
  const {
    data: machines,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["machines"],
    queryFn: fetchMachines,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading machines...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-destructive">
          Error loading machines: {error.message}
        </div>
      </div>
    );
  }

  if (!machines || machines.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">No machines found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Machines</h1>
        <p className="text-muted-foreground">
          Manage and monitor your machine inventory
        </p>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {machines.map((machine) => (
              <TableRow key={machine.id}>
                <TableCell className="font-medium">{machine.name}</TableCell>
                <TableCell>{machine.location || "Not specified"}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(machine.status)}>
                    {machine.status || "Unknown"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
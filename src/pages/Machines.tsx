import { Factory } from "lucide-react";
import { MachinesList } from "@/components/MachinesList";
import { PageHeader } from "@/components/common/PageHeader";

const Machines = () => {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <PageHeader 
        title="Machines"
        description="Manage your vending machine fleet"
        icon={Factory}
      />
      <MachinesList />
    </div>
  );
};

export default Machines;
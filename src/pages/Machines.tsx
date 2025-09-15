import { Factory } from "lucide-react";
import { MachinesList } from "@/components/MachinesList";
import { PageHeader } from "@/components/common/PageHeader";
import { HelpTooltip, HelpTooltipProvider } from "@/components/ui/HelpTooltip";

const Machines = () => {
  return (
    <HelpTooltipProvider>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader 
            title="Machines"
            description="Manage your vending machine fleet"
            icon={Factory}
          />
          <HelpTooltip content="Monitor and manage all your vending machines. Track status, performance, maintenance schedules, and configure machine settings. Use the machine detail pages to set up slots, assign products, and manage pricing." />
        </div>
        <MachinesList />
      </div>
    </HelpTooltipProvider>
  );
};

export default Machines;
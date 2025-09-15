import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HelpTooltipProps {
  content: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function HelpTooltip({ content, className = "", size = "sm" }: HelpTooltipProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className={`cursor-help text-muted-foreground hover:text-foreground transition-colors ${sizeClasses[size]} ${className}`} />
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Wrapper component that includes TooltipProvider for pages that need it
export function HelpTooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      {children}
    </TooltipProvider>
  );
}
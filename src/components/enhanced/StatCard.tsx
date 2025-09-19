import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string; // Keep description for backward compatibility
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    direction: "up" | "down" | "neutral";
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  subtitle,
  icon: Icon,
  trend,
  className = "",
}: StatCardProps) {
  const getTrendColor = (direction: "up" | "down" | "neutral") => {
    switch (direction) {
      case "up":
        return "text-success";
      case "down":
        return "text-expense";
      default:
        return "text-muted-foreground";
    }
  };

  const getTrendIcon = (direction: "up" | "down" | "neutral") => {
    switch (direction) {
      case "up":
        return "↗";
      case "down":
        return "↘";
      default:
        return "→";
    }
  };

  return (
    <div className={`rounded-xl border border-border bg-card p-6 space-y-3 card-hover ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      </div>
      
      <div className="space-y-1">
        <p className="text-2xl font-bold">{value}</p>
        {(description || subtitle) && (
          <p className="text-sm text-muted-foreground">{description || subtitle}</p>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-2 text-sm">
          <span className={`inline-flex items-center gap-1 ${getTrendColor(trend.direction)}`}>
            <span>{getTrendIcon(trend.direction)}</span>
            <span className="font-medium">{Math.abs(trend.value)}%</span>
          </span>
          <span className="text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
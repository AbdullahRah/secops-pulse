"use client";

import { TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number;
  icon: "activity" | "alert" | "warning" | "check";
  trend: { value: number; direction: "up" | "down" } | null;
  color: "blue" | "yellow" | "red" | "green";
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  activity: Activity,
  alert: AlertTriangle,
  warning: AlertTriangle,
  check: CheckCircle,
};

const colorMap = {
  blue: {
    bg: "bg-primary-subtle",
    icon: "text-primary",
    trend: "text-accent",
  },
  yellow: {
    bg: "bg-warning-subtle",
    icon: "text-warning",
    trend: "text-warning",
  },
  red: {
    bg: "bg-danger-subtle",
    icon: "text-danger",
    trend: "text-danger",
  },
  green: {
    bg: "bg-accent-subtle",
    icon: "text-accent",
    trend: "text-accent",
  },
};

export default function MetricCard({ title, value, icon, trend, color }: MetricCardProps) {
  const Icon = iconMap[icon];
  const colors = colorMap[color];

  return (
    <div className="bg-surface rounded-card p-6 shadow-card card-hover">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${colors.bg}`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
        {trend && (
          <div
            className={`flex items-center space-x-1 text-sm font-medium ${
              trend.direction === "up" ? "text-accent" : "text-danger"
            }`}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{trend.value}%</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-text-muted">{title}</p>
        <p className="text-3xl font-bold text-text-primary mt-1 tracking-tight">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

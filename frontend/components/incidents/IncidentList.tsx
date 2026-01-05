"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";

interface IncidentListProps {
  incidents: Array<{
    id: string;
    title: string;
    risk_score: number;
    risk_level: string;
    status: string;
    category: string | null;
    source_events_count: number;
    created_at: string;
    updated_at: string;
  }>;
  compact?: boolean;
}

const riskConfig = {
  critical: { color: "risk-critical", icon: AlertTriangle, label: "Critical" },
  high: { color: "risk-high", icon: AlertTriangle, label: "High" },
  medium: { color: "risk-medium", icon: AlertCircle, label: "Medium" },
  low: { color: "risk-low", icon: CheckCircle, label: "Low" },
  info: { color: "risk-info", icon: Info, label: "Info" },
};

const statusConfig = {
  open: { class: "status-open", label: "Open" },
  investigating: { class: "status-investigating", label: "Investigating" },
  resolved: { class: "status-resolved", label: "Resolved" },
  dismissed: { class: "status-dismissed", label: "Dismissed" },
};

export default function IncidentList({ incidents, compact = false }: IncidentListProps) {
  if (incidents.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 mx-auto mb-3 bg-surfaceSubtle rounded-full flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-text-muted" />
        </div>
        <p className="text-sm text-text-muted">No incidents to display</p>
      </div>
    );
  }

  return (
    <div className={`${compact ? "" : "divide-y divide-border"}`}>
      {incidents.map((incident) => {
        const risk = riskConfig[incident.risk_level as keyof typeof riskConfig] || riskConfig.info;
        const status = statusConfig[incident.status as keyof typeof statusConfig] || statusConfig.open;
        const RiskIcon = risk.icon;

        return (
          <Link
            key={incident.id}
            href={`/dashboard/incidents/${incident.id}`}
            className={`flex items-center justify-between p-4 hover:bg-surfaceSubtle transition-colors rounded-xl ${
              compact ? "mb-2" : "mb-2 last:mb-0"
            }`}
          >
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${risk.color}`}
              >
                <RiskIcon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary truncate">
                  {incident.title}
                </p>
                <div className="flex items-center space-x-3 mt-1">
                  <span className={`badge ${status.class}`}>{status.label}</span>
                  {!compact && (
                    <>
                      <span className="text-xs text-text-muted">
                        {incident.source_events_count} events
                      </span>
                      <span className="text-xs text-text-muted">
                        {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 ml-4">
              <div className="text-center">
                <p className="text-lg font-bold" style={{ color: risk.color.replace("risk-", "") }}>
                  {incident.risk_score}
                </p>
                <p className="text-xs text-text-muted">Score</p>
              </div>
              <ChevronRight className="w-5 h-5 text-text-muted" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

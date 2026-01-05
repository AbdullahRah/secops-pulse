"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowLeft,
  Clock,
  User,
  Activity,
  Shield,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface IncidentDetail {
  id: string;
  title: string;
  description: string | null;
  risk_score: number;
  risk_level: string;
  ai_summary: string | null;
  ai_explanation: string | null;
  ai_recommendations: Array<Record<string, unknown>> | null;
  status: string;
  category: string | null;
  tags: string[] | null;
  source_events_count: number;
  first_event_at: string | null;
  last_event_at: string | null;
  created_at: string;
  updated_at: string;
  events: Array<{
    id: string;
    source: string;
    action: string | null;
    timestamp: string | null;
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    description: string | null;
    fix_steps: Array<Record<string, unknown>> | null;
    priority: number | null;
    effort_estimate: string | null;
    category: string | null;
    automation_possible: boolean;
    applied: boolean;
  }>;
}

const riskConfig = {
  critical: { color: "#FF453A", bg: "bg-danger-subtle", border: "border-danger/20", text: "text-danger" },
  high: { color: "#FFB800", bg: "bg-warning-subtle", border: "border-warning/20", text: "text-warning" },
  medium: { color: "#FFB800", bg: "bg-warning-subtle", border: "border-warning/20", text: "text-warning" },
  low: { color: "#00D4AA", bg: "bg-accent-subtle", border: "border-accent/20", text: "text-accent" },
  info: { color: "#0066FF", bg: "bg-primary-subtle", border: "border-primary/20", text: "text-primary" },
};

const statusConfig = {
  open: { class: "status-open", label: "Open" },
  investigating: { class: "status-investigating", label: "Investigating" },
  resolved: { class: "status-resolved", label: "Resolved" },
  dismissed: { class: "status-dismissed", label: "Dismissed" },
};

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchIncident();
  }, [params.id]);

  const fetchIncident = async () => {
    setLoading(true);
    const response = await fetch(`http://localhost:8000/api/v1/incidents/${params.id}`);
    if (response.ok) {
      const data = await response.json();
      setIncident(data);
    }
    setLoading(false);
  };

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    const response = await fetch(`http://localhost:8000/api/v1/incidents/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (response.ok) {
      await fetchIncident();
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="skeleton h-8 w-48 mb-6"></div>
          <div className="skeleton h-64 w-full rounded-card"></div>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">Incident not found</h1>
          <Link href="/dashboard/incidents" className="text-primary hover:underline mt-2 inline-block">
            Back to incidents
          </Link>
        </div>
      </div>
    );
  }

  const risk = riskConfig[incident.risk_level as keyof typeof riskConfig] || riskConfig.info;
  const status = statusConfig[incident.status as keyof typeof statusConfig] || statusConfig.open;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Incidents</span>
        </button>

        {/* Header */}
        <div className="bg-surface rounded-card p-6 shadow-card">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <span className={`badge ${status.class}`}>{status.label}</span>
                {incident.category && (
                  <span className="badge bg-surfaceSubtle text-text-secondary">{incident.category}</span>
                )}
                {incident.tags?.map((tag) => (
                  <span key={tag} className="badge bg-surfaceSubtle text-text-secondary">
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">{incident.title}</h1>
              {incident.description && (
                <p className="text-text-secondary mt-2">{incident.description}</p>
              )}
            </div>
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center ml-4"
              style={{ backgroundColor: `${risk.color}15` }}
            >
              <span className="text-3xl font-bold tracking-tight" style={{ color: risk.color }}>
                {incident.risk_score}
              </span>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-border">
            <div className="flex items-center space-x-2 text-sm text-text-muted">
              <Clock className="w-4 h-4" />
              <span>
                Created {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-text-muted">
              <Activity className="w-4 h-4" />
              <span>{incident.source_events_count} events</span>
            </div>
            {incident.first_event_at && (
              <div className="flex items-center space-x-2 text-sm text-text-muted">
                <Clock className="w-4 h-4" />
                <span>
                  First event: {format(new Date(incident.first_event_at), "MMM d, yyyy HH:mm")}
                </span>
              </div>
            )}
          </div>

          {/* Status actions */}
          <div className="flex space-x-3 mt-6 pt-6 border-t border-border">
            {incident.status !== "investigating" && (
              <button
                onClick={() => updateStatus("investigating")}
                disabled={updating}
                className="px-4 py-2 bg-warning-subtle text-warning rounded-xl font-medium hover:bg-warning-subtle/80 transition-colors disabled:opacity-50"
              >
                Investigating
              </button>
            )}
            {incident.status !== "resolved" && (
              <button
                onClick={() => updateStatus("resolved")}
                disabled={updating}
                className="px-4 py-2 bg-accent-subtle text-accent rounded-xl font-medium hover:bg-accent-subtle/80 transition-colors disabled:opacity-50"
              >
                Resolve
              </button>
            )}
          </div>
        </div>

        {/* AI Analysis */}
        {(incident.ai_summary || incident.ai_explanation) && (
          <div className="bg-surface rounded-card p-6 shadow-card ai-glow border border-primary/10">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-text-primary">AI Analysis</h2>
            </div>

            {incident.ai_summary && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-text-muted mb-2">Summary</h3>
                <p className="text-text-primary">{incident.ai_summary}</p>
              </div>
            )}

            {incident.ai_explanation && (
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-2">Explanation</h3>
                <p className="text-text-secondary">{incident.ai_explanation}</p>
              </div>
            )}

            {incident.ai_recommendations && incident.ai_recommendations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-text-muted mb-3">AI Recommendations</h3>
                <div className="space-y-2">
                  {incident.ai_recommendations.map((rec, idx) => {
                    const recData = rec as Record<string, unknown>;
                    const title = recData.title as string;
                    const description = recData.description as string | null | undefined;
                    const priority = recData.priority as string | null | undefined;
                    return (
                    <div
                      key={idx}
                      className="flex items-start space-x-3 p-3 bg-surfaceSubtle rounded-lg"
                    >
                      <span className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-medium text-text-primary">{title}</p>
                        {description && (
                          <p className="text-sm text-text-secondary mt-1">{description}</p>
                        )}
                        {priority && (
                          <span className="inline-block mt-2 text-xs bg-warning-subtle text-warning px-2 py-0.5 rounded-full">
                            Priority: {priority}
                          </span>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recommendations */}
        {incident.recommendations && incident.recommendations.length > 0 && (
          <div className="bg-surface rounded-card p-6 shadow-card">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-text-primary">Remediation Steps</h2>
            </div>

            <div className="space-y-4">
              {incident.recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-text-primary">{rec.title}</h3>
                      {rec.description && (
                        <p className="text-sm text-text-secondary mt-1">{rec.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-3">
                        {rec.priority && (
                          <span className="text-xs text-text-muted">
                            Priority: <span className="font-medium">{rec.priority}</span>
                          </span>
                        )}
                        {rec.effort_estimate && (
                          <span className="text-xs text-text-muted">
                            Est. time: <span className="font-medium">{rec.effort_estimate}</span>
                          </span>
                        )}
                        {rec.automation_possible && (
                          <span className="text-xs bg-accent-subtle text-accent px-2 py-0.5 rounded-full">
                            Auto-possible
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="p-2 hover:bg-surfaceSubtle rounded-lg transition-colors">
                      <ChevronRight className="w-5 h-5 text-text-muted" />
                    </button>
                  </div>

                  {rec.fix_steps && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h4 className="text-sm font-medium text-text-muted mb-2">Fix Steps</h4>
                      <ol className="space-y-2">
                        {rec.fix_steps.map((step, idx) => {
                          const stepData = step as Record<string, unknown>;
                          const stepNum = stepData.step as number;
                          const action = stepData.action as string;
                          const stepDesc = stepData.description as string | null | undefined;
                          return (
                          <li key={idx} className="flex items-start space-x-3 text-sm">
                            <span className="flex-shrink-0 w-5 h-5 bg-surfaceSubtle rounded-full flex items-center justify-center text-xs font-medium">
                              {stepNum}
                            </span>
                            <div>
                              <p className="font-medium text-text-primary">{action}</p>
                              {stepDesc && (
                                <p className="text-text-secondary">{stepDesc}</p>
                              )}
                            </div>
                          </li>
                          );
                        })}
                      </ol>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Events */}
        <div className="bg-surface rounded-card p-6 shadow-card">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-text-primary">Related Events</h2>
          </div>

          <div className="space-y-3">
            {incident.events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 bg-surfaceSubtle rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="badge bg-surface text-text-secondary">{event.source}</span>
                  <span className="text-sm text-text-primary">{event.action}</span>
                </div>
                {event.timestamp && (
                  <span className="text-xs text-text-muted">
                    {format(new Date(event.timestamp), "MMM d, HH:mm")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

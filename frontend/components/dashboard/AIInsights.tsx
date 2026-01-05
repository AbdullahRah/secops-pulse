"use client";

import { Sparkles, AlertTriangle, CheckCircle } from "lucide-react";

interface AIInsightsProps {
  incidents: Array<{
    id: string;
    title: string;
    risk_score: number;
    ai_summary?: string | null;
  }>;
}

export default function AIInsights({ incidents }: AIInsightsProps) {
  const highRiskIncidents = incidents.filter((i) => i.risk_score >= 7);
  const hasSummary = incidents.some((i) => i.ai_summary);

  if (!hasSummary) {
    return (
      <div className="bg-surface rounded-card p-6 shadow-card">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">AI Insights</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 bg-surfaceSubtle rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-text-muted" />
          </div>
          <p className="text-sm text-text-muted">
            AI analysis will appear here once incidents are analyzed
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-card p-6 shadow-card">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-text-primary">AI Insights</h2>
      </div>

      <div className="space-y-4">
        {/* High risk summary */}
        {highRiskIncidents.length > 0 && (
          <div className="p-4 bg-danger-subtle rounded-xl border border-danger/10">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-danger mt-0.5" />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {highRiskIncidents.length} High Risk Incident{highRiskIncidents.length > 1 ? "s" : ""} Require Attention
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  AI has identified potential security concerns requiring immediate review
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sample AI summary */}
        {incidents[0]?.ai_summary && (
          <div className="p-4 bg-primary-subtle rounded-xl border border-primary/10 ai-glow">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-text-primary">AI Analysis</p>
                <p className="text-sm text-text-secondary mt-1">
                  {incidents[0].ai_summary}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 bg-surfaceSubtle rounded-lg">
            <p className="text-2xl font-bold text-text-primary">
              {incidents.filter((i) => i.ai_summary).length}
            </p>
            <p className="text-xs text-text-muted">Analyzed</p>
          </div>
          <div className="p-3 bg-surfaceSubtle rounded-lg">
            <p className="text-2xl font-bold text-text-primary">
              {Math.round(
                incidents.reduce((sum, i) => sum + i.risk_score, 0) / incidents.length
              )}
            </p>
            <p className="text-xs text-text-muted">Avg Score</p>
          </div>
        </div>
      </div>
    </div>
  );
}

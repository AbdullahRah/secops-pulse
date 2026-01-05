"use client";

import { useState, useEffect } from "react";
import MetricCard from "@/components/dashboard/MetricCard";
import RiskGauge from "@/components/dashboard/RiskGauge";
import IncidentList from "@/components/incidents/IncidentList";
import EventsChart from "@/components/dashboard/EventsChart";
import AIInsights from "@/components/dashboard/AIInsights";
import api from "@/app/api/client";
import { RefreshCw } from "lucide-react";

interface DashboardData {
  metrics: {
    total_events_today: number;
    total_events_week: number;
    open_incidents: number;
    high_risk_incidents: number;
    resolved_today: number;
    average_risk_score: number;
  };
  risk_distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  recent_incidents: Array<{
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
  events_over_time: Array<{
    timestamp: string;
    source: string;
    count: number;
  }>;
  top_categories: Array<{ category: string; count: number }>;
}

export default function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    const response = await api.getDashboard();
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data as DashboardData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface rounded-card p-6 shadow-card">
              <div className="skeleton h-4 w-24 mb-4"></div>
              <div className="skeleton h-8 w-16 mb-2"></div>
              <div className="skeleton h-3 w-32"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-surface rounded-card p-6 shadow-card">
            <div className="skeleton h-64"></div>
          </div>
          <div className="bg-surface rounded-card p-6 shadow-card">
            <div className="skeleton h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-warning text-6xl">!</div>
        <h2 className="text-xl font-semibold text-text-primary">Failed to load dashboard</h2>
        <p className="text-text-secondary">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const metrics = data.metrics;
  const riskDist = data.risk_distribution;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Security Dashboard</h1>
          <p className="text-text-secondary mt-1">
            Real-time overview of your security posture
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-text-muted">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
          <button
            onClick={fetchDashboard}
            className="p-2 bg-surface border border-border rounded-xl hover:bg-surfaceSubtle transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 text-text-secondary ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Events Today"
          value={metrics.total_events_today}
          icon="activity"
          trend={{ value: 12, direction: "up" }}
          color="blue"
        />
        <MetricCard
          title="Open Incidents"
          value={metrics.open_incidents}
          icon="alert"
          trend={{ value: 3, direction: "down" }}
          color="yellow"
        />
        <MetricCard
          title="High Risk"
          value={metrics.high_risk_incidents}
          icon="warning"
          trend={null}
          color="red"
        />
        <MetricCard
          title="Resolved Today"
          value={metrics.resolved_today}
          icon="check"
          trend={{ value: 8, direction: "up" }}
          color="green"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Events chart */}
          <div className="bg-surface rounded-card p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary">Events Over Time</h2>
              <select className="px-3 py-1.5 bg-surfaceSubtle border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>Last 24 hours</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
              </select>
            </div>
            <EventsChart data={data.events_over_time} />
          </div>

          {/* Recent incidents */}
          <div className="bg-surface rounded-card p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary">Recent Incidents</h2>
              <a
                href="/dashboard/incidents"
                className="text-sm text-primary hover:underline font-medium"
              >
                View all
              </a>
            </div>
            <IncidentList incidents={data.recent_incidents} compact />
          </div>
        </div>

        {/* Right column - Risk and insights */}
        <div className="space-y-6">
          {/* Risk gauge */}
          <div className="bg-surface rounded-card p-6 shadow-card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Risk Overview</h2>
            <RiskGauge distribution={riskDist} averageScore={metrics.average_risk_score} />
          </div>

          {/* AI insights */}
          <AIInsights incidents={data.recent_incidents} />

          {/* Top categories */}
          <div className="bg-surface rounded-card p-6 shadow-card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Top Categories</h2>
            <div className="space-y-3">
              {data.top_categories.map((cat, idx) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center justify-center w-6 h-6 bg-surfaceSubtle rounded-full text-xs font-medium">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-text-primary capitalize">
                      {cat.category}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-text-secondary">
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

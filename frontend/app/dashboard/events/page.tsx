"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { formatDistanceToNow } from "date-fns";
import { Activity, Filter, Search, RefreshCw } from "lucide-react";

interface Event {
  id: string;
  source: string;
  resource_id: string | null;
  actor: string | null;
  action: string | null;
  result: string | null;
  risk_score: number | null;
  processed: boolean;
  event_timestamp: string | null;
  created_at: string;
}

export default function EventsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [sourceFilter]);

  const fetchEvents = async () => {
    setLoading(true);
    const response = await fetch(
      `http://localhost:8000/api/v1/events?source=${sourceFilter}&limit=50`
    );
    if (response.ok) {
      const data = await response.json();
      setEvents(data);
    }
    setLoading(false);
  };

  const sourceOptions = [
    { value: "", label: "All Sources" },
    { value: "cloudwatch", label: "CloudWatch" },
    { value: "azure_monitor", label: "Azure Monitor" },
    { value: "github_actions", label: "GitHub Actions" },
    { value: "power_platform", label: "Power Platform" },
    { value: "kubernetes", label: "Kubernetes" },
    { value: "api_gateway", label: "API Gateway" },
  ];

  const getRiskColor = (score: number | null) => {
    if (score === null) return "text-gray-400 bg-gray-100";
    if (score >= 7) return "text-red-600 bg-red-100";
    if (score >= 4) return "text-yellow-600 bg-yellow-100";
    return "text-green-600 bg-green-100";
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "md:ml-64" : "md:ml-20"
        }`}
      >
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} isMobile={isMobile} />
        <main className="p-4 md:p-6 lg:p-8">
          <div className="space-y-6 animate-fade-in">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Events</h1>
                <p className="text-text-secondary mt-1">
                  Raw security events from all sources
                </p>
              </div>
              <button
                onClick={fetchEvents}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-border rounded-xl hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-card p-4 shadow-card">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="px-4 py-2 bg-gray-50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  {sourceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Events list */}
            <div className="bg-white rounded-card shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-medium text-text-muted uppercase tracking-wider">
                        Source
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-text-muted uppercase tracking-wider">
                        Actor
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-text-muted uppercase tracking-wider">
                        Action
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-text-muted uppercase tracking-wider">
                        Result
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-text-muted uppercase tracking-wider">
                        Risk
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-text-muted uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      Array(10)
                        .fill(0)
                        .map((_, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4">
                              <div className="skeleton h-4 w-20"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="skeleton h-4 w-32"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="skeleton h-4 w-24"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="skeleton h-6 w-16 rounded-full"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="skeleton h-6 w-10 rounded-full"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="skeleton h-4 w-20"></div>
                            </td>
                          </tr>
                        ))
                    ) : events.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <Activity className="w-12 h-12 mx-auto text-text-muted mb-3" />
                          <p className="text-text-muted">No events found</p>
                        </td>
                      </tr>
                    ) : (
                      events.map((event) => (
                        <tr
                          key={event.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="badge bg-gray-100 text-gray-700 capitalize">
                              {event.source.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-text-primary">
                            {event.actor || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-text-primary">
                            {event.action || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`badge ${
                                event.result === "success"
                                  ? "bg-green-100 text-green-700"
                                  : event.result === "failure"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {event.result || "unknown"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getRiskColor(
                                event.risk_score
                              )}`}
                            >
                              {event.risk_score ?? "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-text-muted">
                            {event.created_at
                              ? formatDistanceToNow(new Date(event.created_at), {
                                  addSuffix: true,
                                })
                              : "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

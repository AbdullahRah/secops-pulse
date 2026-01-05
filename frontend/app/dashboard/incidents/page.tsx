"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import IncidentList from "@/components/incidents/IncidentList";
import api from "@/app/api/client";

interface Incident {
  id: string;
  title: string;
  risk_score: number;
  risk_level: string;
  status: string;
  category: string | null;
  source_events_count: number;
  created_at: string;
  updated_at: string;
}

interface IncidentResponse {
  incidents: Incident[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export default function IncidentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [minRisk, setMinRisk] = useState<number | undefined>(undefined);
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
    fetchIncidents();
  }, [page, statusFilter, minRisk, search]);

  const fetchIncidents = async () => {
    setLoading(true);
    const response = await api.getIncidents({
      skip: (page - 1) * 20,
      limit: 20,
      status: statusFilter || undefined,
      min_risk: minRisk,
      search: search || undefined,
    });

    if (response.data) {
      const data = response.data as IncidentResponse;
      setIncidents(data.incidents);
      setTotal(data.total);
    }
    setLoading(false);
  };

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "open", label: "Open" },
    { value: "investigating", label: "Investigating" },
    { value: "resolved", label: "Resolved" },
    { value: "dismissed", label: "Dismissed" },
  ];

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
                <h1 className="text-2xl font-bold text-text-primary">Incidents</h1>
                <p className="text-text-secondary mt-1">
                  {total} total incidents
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-card p-4 shadow-card">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search incidents..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div className="flex gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-gray-50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={minRisk || ""}
                    onChange={(e) => setMinRisk(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="px-4 py-2 bg-gray-50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="">All Risks</option>
                    <option value="7">High+ (7+)</option>
                    <option value="5">Medium+ (5+)</option>
                    <option value="3">Low+ (3+)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Incidents list */}
            <div className="bg-white rounded-card p-6 shadow-card">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4">
                      <div className="skeleton w-10 h-10 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-4 w-3/4"></div>
                        <div className="skeleton h-3 w-1/2"></div>
                      </div>
                      <div className="skeleton h-8 w-12"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <IncidentList incidents={incidents} />
              )}

              {/* Pagination */}
              {!loading && incidents.length > 0 && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                  <p className="text-sm text-text-muted">
                    Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={incidents.length < 20}
                      className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

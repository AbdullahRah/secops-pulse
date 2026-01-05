/**
 * API client for SecOps Pulse backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiResponse<T> {
  data: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          data: null as T,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        data: null as T,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Health endpoints
  async healthCheck() {
    return this.request<{
      status: string;
      version: string;
      database: string;
      components: Record<string, unknown>;
    }>("/api/v1/health");
  }

  // Dashboard endpoints
  async getDashboard() {
    return this.request<{
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
    }>("/api/v1/dashboard");
  }

  // Incidents endpoints
  async getIncidents(params?: {
    skip?: number;
    limit?: number;
    status?: string;
    min_risk?: number;
    search?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.set("skip", params.skip.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.status) searchParams.set("status", params.status);
    if (params?.min_risk) searchParams.set("min_risk", params.min_risk.toString());
    if (params?.search) searchParams.set("search", params.search);

    const query = searchParams.toString();
    const endpoint = `/api/v1/incidents${query ? `?${query}` : ""}`;

    return this.request<{
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
      total: number;
      page: number;
      page_size: number;
      has_more: boolean;
    }>(endpoint);
  }

  async getIncident(id: string) {
    return this.request<{
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
    }>(`/api/v1/incidents/${id}`);
  }

  async updateIncident(id: string, data: { status?: string }) {
    return this.request<{
      id: string;
      title: string;
      risk_score: number;
      risk_level: string;
      status: string;
      // ... other fields
    }>(`/api/v1/incidents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Events endpoints
  async ingestEvent(event: {
    source: string;
    resource_type?: string;
    actor?: string;
    action?: string;
    result?: string;
    raw_payload: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) {
    return this.request<{
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
    }>("/api/v1/ingest", {
      method: "POST",
      body: JSON.stringify(event),
    });
  }

  async getEvents(params?: { skip?: number; limit?: number; source?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.set("skip", params.skip.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.source) searchParams.set("source", params.source);

    const query = searchParams.toString();
    const endpoint = `/api/v1/events${query ? `?${query}` : ""}`;

    return this.request<Array<{
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
    }>>(endpoint);
  }
}

export const api = new ApiClient();
export default api;

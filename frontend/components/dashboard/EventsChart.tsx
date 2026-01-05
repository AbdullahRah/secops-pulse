"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface EventsChartProps {
  data: Array<{
    timestamp: string;
    source: string;
    count: number;
  }>;
}

const sourceColors: Record<string, string> = {
  cloudwatch: "#FFB800",
  azure_monitor: "#0066FF",
  github_actions: "#00D4AA",
  power_platform: "#5856D6",
  kubernetes: "#FF453A",
  api_gateway: "#AF52DE",
};

export default function EventsChart({ data }: EventsChartProps) {
  // Group data by source
  const groupedData: Record<string, Record<string, number>> = {};
  const timestamps: Set<string> = new Set();

  data.forEach((item) => {
    const time = new Date(item.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    timestamps.add(time);

    if (!groupedData[item.source]) {
      groupedData[item.source] = {};
    }
    groupedData[item.source][time] = item.count;
  });

  const sortedTimes = Array.from(timestamps).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  const chartData = sortedTimes.map((time) => {
    const point: Record<string, string | number> = { time };
    Object.entries(groupedData).forEach(([source, counts]) => {
      point[source] = counts[time] || 0;
    });
    return point;
  });

  const sources = Object.keys(groupedData);

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {sources.map((source) => (
              <linearGradient key={source} id={`gradient-${source}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={sourceColors[source] || "#666"} stopOpacity={0.3} />
                <stop offset="95%" stopColor={sourceColors[source] || "#666"} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 12, fill: "#64748B" }}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748B" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: "12px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.08)",
            }}
            labelStyle={{ fontWeight: 600, color: "#0F172A" }}
          />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            iconType="circle"
            iconSize={8}
          />
          {sources.map((source) => (
            <Area
              key={source}
              type="monotone"
              dataKey={source}
              stroke={sourceColors[source] || "#666"}
              strokeWidth={2}
              fill={`url(#gradient-${source})`}
              fillOpacity={1}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

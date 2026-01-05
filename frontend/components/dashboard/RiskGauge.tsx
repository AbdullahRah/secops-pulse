"use client";

import { useEffect, useRef } from "react";

interface RiskGaugeProps {
  distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  averageScore: number;
}

export default function RiskGauge({ distribution, averageScore }: RiskGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const total =
    distribution.critical + distribution.high + distribution.medium + distribution.low + distribution.info;

  const riskLevels = [
    { label: "Critical", count: distribution.critical, color: "#FF453A", percent: total > 0 ? (distribution.critical / total) * 100 : 0 },
    { label: "High", count: distribution.high, color: "#FFB800", percent: total > 0 ? (distribution.high / total) * 100 : 0 },
    { label: "Medium", count: distribution.medium, color: "#FFB800", percent: total > 0 ? (distribution.medium / total) * 100 : 0 },
    { label: "Low", count: distribution.low, color: "#00D4AA", percent: total > 0 ? (distribution.low / total) * 100 : 0 },
  ];

  const getRiskLevel = (score: number) => {
    if (score >= 9) return { level: "Critical", color: "#FF453A", bg: "bg-danger-subtle" };
    if (score >= 7) return { level: "High", color: "#FFB800", bg: "bg-warning-subtle" };
    if (score >= 4) return { level: "Medium", color: "#FFB800", bg: "bg-warning-subtle" };
    if (score >= 1) return { level: "Low", color: "#00D4AA", bg: "bg-accent-subtle" };
    return { level: "Info", color: "#0066FF", bg: "bg-primary-subtle" };
  };

  const currentRisk = getRiskLevel(averageScore);

  return (
    <div className="space-y-6">
      {/* Score display */}
      <div className="text-center">
        <div className="relative inline-block">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center ${currentRisk.bg}`}
          >
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center ${
                averageScore >= 9 ? "bg-danger" :
                averageScore >= 7 ? "bg-warning" :
                averageScore >= 4 ? "bg-warning" :
                averageScore >= 1 ? "bg-accent" : "bg-primary"
              }`}
            >
              <span className="text-3xl font-bold text-white tracking-tight">{averageScore.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm font-medium text-text-secondary">
          Average Risk Score
        </p>
        <p className="text-lg font-semibold" style={{ color: currentRisk.color }}>
          {currentRisk.level}
        </p>
      </div>

      {/* Distribution */}
      <div className="space-y-3">
        {riskLevels.map((level) => (
          <div key={level.label} className="flex items-center space-x-3">
            <div className="w-20 text-sm text-text-secondary">{level.label}</div>
            <div className="flex-1 h-2 bg-surfaceSubtle rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${level.percent}%`,
                  backgroundColor: level.color,
                }}
              />
            </div>
            <div className="w-8 text-sm font-medium text-text-primary text-right">
              {level.count}
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="pt-3 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">Total Open Incidents</span>
          <span className="font-semibold text-text-primary">{total}</span>
        </div>
      </div>
    </div>
  );
}

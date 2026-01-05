"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Settings, Shield, Bell, Database, Key, Save, Check } from "lucide-react";

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      slack: false,
      highRiskOnly: true,
    },
    ai: {
      enabled: true,
      autoAnalyze: true,
      model: "gpt-4-turbo",
    },
    thresholds: {
      highRisk: 7,
      mediumRisk: 4,
    },
  });

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

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "ai", label: "AI Configuration", icon: Shield },
    { id: "thresholds", label: "Risk Thresholds", icon: Database },
    { id: "api", label: "API Keys", icon: Key },
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
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Page header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
                <p className="text-text-secondary mt-1">
                  Configure your SecOps Pulse platform
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-white rounded-card shadow-card overflow-hidden">
              {/* Tabs */}
              <div className="border-b border-border">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === tab.id
                            ? "border-primary text-primary"
                            : "border-transparent text-text-muted hover:text-text-primary hover:border-gray-300"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab content */}
              <div className="p-6">
                {activeTab === "general" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-text-primary mb-4">
                        General Settings
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium text-text-primary">Auto-refresh Dashboard</p>
                            <p className="text-sm text-text-muted">
                              Automatically refresh dashboard data every 30 seconds
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              defaultChecked
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium text-text-primary">Compact Mode</p>
                            <p className="text-sm text-text-muted">
                              Show more incidents in less space
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "notifications" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-text-primary mb-4">
                        Notification Preferences
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium text-text-primary">Email Notifications</p>
                            <p className="text-sm text-text-muted">
                              Receive email alerts for high-risk incidents
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.notifications.email}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  notifications: {
                                    ...settings.notifications,
                                    email: e.target.checked,
                                  },
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium text-text-primary">High Risk Only</p>
                            <p className="text-sm text-text-muted">
                              Only notify for incidents with risk score 7+
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.notifications.highRiskOnly}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  notifications: {
                                    ...settings.notifications,
                                    highRiskOnly: e.target.checked,
                                  },
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "ai" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-text-primary mb-4">
                        AI Configuration
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium text-text-primary">Enable AI Analysis</p>
                            <p className="text-sm text-text-muted">
                              Use AI for incident analysis and recommendations
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.ai.enabled}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  ai: { ...settings.ai, enabled: e.target.checked },
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium text-text-primary">Auto-analyze New Incidents</p>
                            <p className="text-sm text-text-muted">
                              Automatically run AI analysis on new incidents
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.ai.autoAnalyze}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  ai: { ...settings.ai, autoAnalyze: e.target.checked },
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            AI Model
                          </label>
                          <select
                            value={settings.ai.model}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                ai: { ...settings.ai, model: e.target.value },
                              })
                            }
                            className="w-full px-4 py-2 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          >
                            <option value="gpt-4-turbo">GPT-4 Turbo (Recommended)</option>
                            <option value="gpt-4">GPT-4</option>
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "thresholds" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-text-primary mb-4">
                        Risk Scoring Thresholds
                      </h3>
                      <p className="text-text-secondary mb-4">
                        Configure risk score thresholds for incident classification
                      </p>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            High Risk Threshold
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={settings.thresholds.highRisk}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                thresholds: {
                                  ...settings.thresholds,
                                  highRisk: parseInt(e.target.value),
                                },
                              })
                            }
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-text-muted mt-1">
                            <span>1</span>
                            <span className="font-medium text-primary">
                              {settings.thresholds.highRisk}
                            </span>
                            <span>10</span>
                          </div>
                          <p className="text-xs text-text-muted mt-2">
                            Incidents with score {settings.thresholds.highRisk}+ are classified as "High Risk"
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            Medium Risk Threshold
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={settings.thresholds.mediumRisk}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                thresholds: {
                                  ...settings.thresholds,
                                  mediumRisk: parseInt(e.target.value),
                                },
                              })
                            }
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-text-muted mt-1">
                            <span>1</span>
                            <span className="font-medium text-primary">
                              {settings.thresholds.mediumRisk}
                            </span>
                            <span>10</span>
                          </div>
                          <p className="text-xs text-text-muted mt-2">
                            Incidents with score {settings.thresholds.mediumRisk}+ are classified as "Medium Risk" or higher
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "api" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-text-primary mb-4">
                        API Configuration
                      </h3>
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-4">
                        <p className="text-sm text-yellow-800">
                          API keys and sensitive configuration should be set via environment variables.
                          See the .env.example file for configuration options.
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            API Base URL
                          </label>
                          <input
                            type="text"
                            value="http://localhost:8000"
                            readOnly
                            className="w-full px-4 py-2 bg-white border border-border rounded-xl text-text-muted"
                          />
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            API Documentation
                          </label>
                          <a
                            href="http://localhost:8000/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            http://localhost:8000/docs
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

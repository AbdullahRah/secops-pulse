"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  AlertTriangle,
  Activity,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Incidents", href: "/dashboard/incidents", icon: AlertTriangle },
  { name: "Events", href: "/dashboard/events", icon: Activity },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-surface border-r border-border transition-all duration-400 ease-smooth ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary shadow-lg shadow-primary/25">
            <Shield className="w-6 h-6 text-white" />
          </div>
          {isOpen && (
            <span className="font-semibold text-text-primary text-lg tracking-tight">
              SecOps Pulse
            </span>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surfaceSubtle transition-colors"
        >
          {isOpen ? (
            <ChevronLeft className="w-5 h-5 text-text-secondary" />
          ) : (
            <ChevronRight className="w-5 h-5 text-text-secondary" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "text-text-secondary hover:bg-surfaceSubtle hover:text-text-primary"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isOpen ? "mr-3" : "mx-auto"}`} />
              {isOpen && <span className="font-medium">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      {isOpen && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center space-x-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-medium">S</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                Security Team
              </p>
              <p className="text-xs text-text-muted truncate">Admin</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

"use client";

import { useState } from "react";
import { Search, Bell, Menu, X, RefreshCw } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
  isMobile: boolean;
}

export default function Header({ onMenuClick, isMobile }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {isMobile && (
            <button
              onClick={onMenuClick}
              className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-surfaceSubtle transition-colors"
            >
              <Menu className="w-5 h-5 text-text-secondary" />
            </button>
          )}

          {/* Search */}
          <div className="relative">
            {isSearchOpen || !isMobile ? (
              <div className="flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search incidents, events..."
                    className="w-64 md:w-80 pl-10 pr-4 py-2 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                </div>
                {isMobile && (
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="ml-2 p-2 hover:bg-surfaceSubtle rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-text-secondary" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface border border-border hover:bg-surfaceSubtle transition-colors"
              >
                <Search className="w-5 h-5 text-text-muted" />
              </button>
            )}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-3">
          {/* Refresh button */}
          <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface border border-border hover:bg-surfaceSubtle transition-colors">
            <RefreshCw className="w-5 h-5 text-text-muted" />
          </button>

          {/* Notifications */}
          <button className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-surface border border-border hover:bg-surfaceSubtle transition-colors">
            <Bell className="w-5 h-5 text-text-muted" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full"></span>
          </button>

          {/* Status indicator */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-accent-subtle rounded-lg">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-accent">System Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}

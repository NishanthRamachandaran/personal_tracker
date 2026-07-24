import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BarChart3, Calendar as CalendarIcon, User, Plus, Zap, Activity, CreditCard, Smile, HeartPulse } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { useAuth } from "@/hooks/useAuth";
import { useStreaks } from "@/hooks/useStreaks";

export const Navigation: React.FC = () => {
  const location = useLocation();
  const { openAddModal } = useUIStore();
  const { user, profile } = useAuth();
  const { activeStreakCount } = useStreaks(user?.id || "");

  if (location.pathname === "/onboarding" || location.pathname === "/auth") {
    return null;
  }

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
    { name: "Calendar", path: "/calendar", icon: CalendarIcon },
    { name: "Profile", path: "/profile", icon: User },
  ];

  return (
    <>
      {/* Desktop Sidebar (visible >= 1024px) */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 bg-[#0D0D12] border-r border-outline-variant/30 p-6 z-40">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-habit via-expense to-health flex items-center justify-center shadow-glow-habit">
            <Zap className="w-6 h-6 text-background fill-background" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-on-surface">PULSE</h1>
            <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Command Center</p>
          </div>
        </div>

        {/* Quick Streak Badge */}
        <div className="mb-6 p-4 rounded-2xl glass-card border border-habit/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase font-bold">Active Streak</p>
              <p className="text-base font-extrabold text-habit-primary">{activeStreakCount} Days</p>
            </div>
          </div>
          <span className="text-[10px] bg-habit/20 text-habit px-2 py-0.5 rounded-full border border-habit/40 font-bold">Active</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-surface-level2 text-on-surface border border-white/10 shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-level1"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-habit" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Quick Add Log Buttons */}
        <div className="pt-4 border-t border-outline-variant/30 space-y-2">
          <p className="text-[10px] text-on-surface-variant font-bold tracking-wider uppercase px-1 mb-2">Quick Log</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => openAddModal("habits")}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-habit/10 hover:bg-habit/20 border border-habit/30 text-habit text-xs font-bold transition-all"
            >
              <Activity className="w-4 h-4" /> Habit
            </button>
            <button
              onClick={() => openAddModal("expenses")}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-expense/10 hover:bg-expense/20 border border-expense/30 text-expense text-xs font-bold transition-all"
            >
              <CreditCard className="w-4 h-4" /> Expense
            </button>
            <button
              onClick={() => openAddModal("mood")}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-mood/10 hover:bg-mood/20 border border-mood/30 text-mood text-xs font-bold transition-all"
            >
              <Smile className="w-4 h-4" /> Mood
            </button>
            <button
              onClick={() => openAddModal("health")}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-health/10 hover:bg-health/20 border border-health/30 text-health text-xs font-bold transition-all"
            >
              <HeartPulse className="w-4 h-4" /> Health
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Floating Bottom Navbar (< 1024px) */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
        <div className="glass-card bg-[#0D0D12]/90 backdrop-blur-xl border border-outline-variant/40 rounded-3xl p-2 px-4 flex items-center justify-between shadow-2xl">
          {navItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${
                  isActive ? "text-habit font-bold scale-105" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px]">{item.name}</span>
              </Link>
            );
          })}

          {/* Glowing FAB Button */}
          <button
            onClick={() => openAddModal("habits")}
            className="w-13 h-13 -mt-6 rounded-full bg-gradient-to-r from-habit via-expense to-health p-[2px] shadow-glow-fab transition-transform active:scale-95"
            aria-label="Add entry"
          >
            <div className="w-full h-full bg-[#0D0D12] rounded-full flex items-center justify-center">
              <Plus className="w-7 h-7 text-on-surface stroke-[2.5]" />
            </div>
          </button>

          {navItems.slice(2, 4).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${
                  isActive ? "text-habit font-bold scale-105" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px]">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUIStore } from "@/store/useUIStore";
import { Search, Activity, CreditCard, Smile, HeartPulse, LayoutDashboard, BarChart3, Calendar, User, Command, X } from "lucide-react";

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { openAddModal } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const actions = [
    { id: "log-habit", title: "Log Habit", icon: Activity, color: "text-habit", action: () => { openAddModal("habits"); setIsOpen(false); } },
    { id: "log-expense", title: "Log Expense", icon: CreditCard, color: "text-expense", action: () => { openAddModal("expenses"); setIsOpen(false); } },
    { id: "log-mood", title: "Log Mood & Energy", icon: Smile, color: "text-mood", action: () => { openAddModal("mood"); setIsOpen(false); } },
    { id: "log-health", title: "Log Health Metrics", icon: HeartPulse, color: "text-health", action: () => { openAddModal("health"); setIsOpen(false); } },
    { id: "nav-dash", title: "Go to Dashboard", icon: LayoutDashboard, color: "text-on-surface-variant", action: () => { navigate("/"); setIsOpen(false); } },
    { id: "nav-analytics", title: "Go to Analytics", icon: BarChart3, color: "text-on-surface-variant", action: () => { navigate("/analytics"); setIsOpen(false); } },
    { id: "nav-calendar", title: "Go to Calendar History", icon: Calendar, color: "text-on-surface-variant", action: () => { navigate("/calendar"); setIsOpen(false); } },
    { id: "nav-profile", title: "Go to Profile Settings", icon: User, color: "text-on-surface-variant", action: () => { navigate("/profile"); setIsOpen(false); } },
  ];

  const filtered = actions.filter((a) => a.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-[#0D0D12]/80 backdrop-blur-md flex items-start justify-center pt-16 md:pt-24 p-4 animate-fadeIn">
      <div className="w-full max-w-xl bg-surface-level1 border border-outline/30 rounded-3xl shadow-2xl overflow-hidden glass-modal space-y-0">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-outline-variant/30 flex items-center gap-3">
          <Search className="w-5 h-5 text-habit-primary" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search... (e.g. 'Log Expense')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none font-medium"
          />
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-surface-level2 text-[10px] font-bold text-on-surface-variant border border-outline/20">
            ESC
          </span>
          <button onClick={() => setIsOpen(false)} className="text-on-surface-variant hover:text-on-surface">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-on-surface-variant font-semibold">
              No matching commands found.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  className="p-3 rounded-2xl hover:bg-surface-level2 cursor-pointer flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl bg-surface-level2 group-hover:bg-surface-level3 flex items-center justify-center ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-on-surface">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant group-hover:text-on-surface font-semibold">
                    Execute ↵
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint Bar */}
        <div className="px-4 py-2.5 bg-surface-level2 border-t border-outline-variant/30 flex items-center justify-between text-[10px] font-bold text-on-surface-variant">
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3" /> Navigation Shortcut
          </span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};

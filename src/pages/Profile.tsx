import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useHabits } from "@/hooks/useHabits";
import { useExpenses } from "@/hooks/useExpenses";
import { useMoodLogs } from "@/hooks/useMoodLogs";
import { useHealthLogs } from "@/hooks/useHealthLogs";
import { useStreaks } from "@/hooks/useStreaks";
import { Card } from "@/components/ui/Card";
import { User, Download, Moon, Trash2, LogOut, Check, Activity, CreditCard, Smile, HeartPulse, DollarSign } from "lucide-react";
import { CategoryType } from "@/types/database";
import { SUPPORTED_CURRENCIES, getStoredCurrency, setStoredCurrency, CurrencyOption } from "@/utils/currencyFormatter";

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, updateCategories, signOut, deleteAccount } = useAuth();
  const userId = user?.id || "";

  const { habits, habitLogs } = useHabits(userId);
  const { expenses } = useExpenses(userId);
  const { moodLogs } = useMoodLogs(userId);
  const { healthLogs } = useHealthLogs(userId);
  const { streaks } = useStreaks(userId);

  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyOption>(getStoredCurrency());

  useEffect(() => {
    const handleCurrencyChange = () => setSelectedCurrency(getStoredCurrency());
    window.addEventListener("pulse_currency_changed", handleCurrencyChange);
    return () => window.removeEventListener("pulse_currency_changed", handleCurrencyChange);
  }, []);

  const totalEntriesCount = habitLogs.length + expenses.length + moodLogs.length + healthLogs.length;
  const maxStreak = streaks.reduce((max, s) => Math.max(max, s.longest_streak), 0);

  const activeCategories = profile?.active_categories || ["habits", "expenses", "mood", "health"];

  const toggleCategory = (cat: CategoryType) => {
    const updated = activeCategories.includes(cat)
      ? activeCategories.filter((c) => c !== cat)
      : [...activeCategories, cat];

    updateCategories(updated);
  };

  const handleCurrencySelect = (currency: CurrencyOption) => {
    setStoredCurrency(currency);
    setSelectedCurrency(currency);
  };

  const handleExportCSV = () => {
    let csv = "Category,ID,Date,Detail 1,Detail 2,Detail 3\n";

    habits.forEach((h) => {
      csv += `Habit,${h.id},${h.created_at},"${h.name}",${h.frequency},${h.reminder_time || ""}\n`;
    });
    expenses.forEach((e) => {
      csv += `Expense,${e.id},${e.spent_on},${e.amount},"${e.expense_categories?.name || ""}"\n`;
    });
    moodLogs.forEach((m) => {
      csv += `Mood,${m.id},${m.logged_on},${m.mood_score},"${m.tags ? m.tags.join(";") : ""}"\n`;
    });
    healthLogs.forEach((h) => {
      csv += `Health,${h.id},${h.logged_on},${h.water_glasses * 0.25}L,${h.sleep_hours}h,${h.workout_minutes}m\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pulse-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadNotice("Downloaded CSV File!");
    setTimeout(() => setDownloadNotice(null), 3000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to permanently delete your account and all tracked data?")) {
      await deleteAccount();
      navigate("/auth");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* User Header Profile Card */}
      <Card className="flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-habit via-expense to-health p-0.5 shadow-glow-habit flex items-center justify-center">
            <div className="w-full h-full bg-[#0D0D12] rounded-[22px] flex items-center justify-center">
              <User className="w-8 h-8 text-habit-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">{profile?.full_name || "User Account"}</h1>
            <p className="text-xs text-on-surface-variant">{user?.email || "user@pulse.app"}</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-habit/20 border border-habit/40 text-habit-primary font-bold text-[10px] uppercase tracking-wider">
              {user?.id ? "Authenticated Account" : "Demo Session"}
            </span>
          </div>
        </div>

        {/* Real Stats Grid */}
        <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
          <div className="p-3.5 rounded-2xl bg-surface-level2 border border-outline/30 text-center min-w-[90px]">
            <p className="text-[10px] text-on-surface-variant uppercase font-bold">Total Logs</p>
            <p className="text-lg font-extrabold text-habit-primary">{totalEntriesCount}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-surface-level2 border border-outline/30 text-center min-w-[90px]">
            <p className="text-[10px] text-on-surface-variant uppercase font-bold">Best Streak</p>
            <p className="text-lg font-extrabold text-expense">{maxStreak} Days</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-surface-level2 border border-outline/30 text-center min-w-[90px]">
            <p className="text-[10px] text-on-surface-variant uppercase font-bold">Active</p>
            <p className="text-lg font-extrabold text-health">{activeCategories.length}/4</p>
          </div>
        </div>
      </Card>

      {downloadNotice && (
        <div className="p-4 rounded-2xl bg-health/20 border border-health/40 text-health text-xs font-bold text-center animate-fadeIn">
          ✓ {downloadNotice}
        </div>
      )}

      {/* Active Category Preferences Toggle */}
      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-on-surface">Active Tracker Preferences</h2>
        <p className="text-xs text-on-surface-variant">Updates active_categories in profiles</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: "habits" as CategoryType, name: "Habits Tracker", icon: Activity, color: "text-habit", border: "border-habit/40", bg: "bg-habit/10" },
            { id: "expenses" as CategoryType, name: "Expense Flow", icon: CreditCard, color: "text-expense", border: "border-expense/40", bg: "bg-expense/10" },
            { id: "mood" as CategoryType, name: "Mood & Energy", icon: Smile, color: "text-mood", border: "border-mood/40", bg: "bg-mood/10" },
            { id: "health" as CategoryType, name: "Health Metrics", icon: HeartPulse, color: "text-health", border: "border-health/40", bg: "bg-health/10" },
          ].map((cat) => {
            const isSelected = activeCategories.includes(cat.id);
            const Icon = cat.icon;

            return (
              <div
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? `${cat.bg} ${cat.border} text-on-surface`
                    : "bg-surface-level2 border-outline/30 text-on-surface-variant opacity-70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${cat.bg} flex items-center justify-center ${cat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-on-surface">{cat.name}</span>
                </div>

                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                  isSelected ? "bg-habit border-habit text-background" : "border-outline/40"
                }`}>
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Currency Preference Settings */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-expense" /> Display Currency
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Default is set to Indian Rupee (₹ INR) with automatic country detection
            </p>
          </div>
          <span className="text-xs font-bold text-expense px-3 py-1 rounded-full bg-expense/20">
            {selectedCurrency.symbol} {selectedCurrency.code}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SUPPORTED_CURRENCIES.map((curr) => {
            const isSelected = selectedCurrency.code === curr.code;
            return (
              <button
                key={curr.code}
                onClick={() => handleCurrencySelect(curr)}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  isSelected
                    ? "bg-expense/20 border-expense text-expense shadow-glow-expense"
                    : "bg-surface-level2 border-outline/30 text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="text-base font-extrabold">{curr.symbol}</span>
                <span className="text-[10px]">{curr.code}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* System Settings & Data Export */}
      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-on-surface">Data Control & Settings</h2>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-surface-level2 border border-outline/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-habit-primary" />
              <div>
                <p className="text-sm font-bold text-on-surface">Dark Theme (#0D0D12)</p>
                <p className="text-xs text-on-surface-variant">Default active aesthetic</p>
              </div>
            </div>
            <span className="text-xs font-bold text-habit-primary px-3 py-1 rounded-full bg-habit/20">
              Active
            </span>
          </div>

          <button
            onClick={handleExportCSV}
            className="w-full p-4 rounded-2xl bg-surface-level2 hover:bg-surface-level3 border border-outline/30 text-on-surface font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4 text-expense" /> Export CSV Data
          </button>
        </div>

        <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between">
          <button
            onClick={handleDeleteAccount}
            className="text-xs font-bold text-mood hover:underline flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>

          <button
            onClick={handleSignOut}
            className="text-xs font-bold text-on-surface-variant hover:text-on-surface flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </Card>
    </div>
  );
};

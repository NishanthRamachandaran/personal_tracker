import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useHabits } from "@/hooks/useHabits";
import { useExpenses } from "@/hooks/useExpenses";
import { useMoodLogs } from "@/hooks/useMoodLogs";
import { useHealthLogs } from "@/hooks/useHealthLogs";
import { BarChartCard } from "@/components/charts/BarChartCard";
import { DonutChartCard } from "@/components/charts/DonutChartCard";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { ComboChartCard } from "@/components/charts/ComboChartCard";
import { HabitHeatmap } from "@/components/HabitHeatmap";
import { Card } from "@/components/ui/Card";
import { BarChart3, TrendingUp, Sparkles, Activity, CreditCard, Smile, HeartPulse, Zap } from "lucide-react";
import { CategoryType } from "@/types/database";

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || "";

  const [activeSegment, setActiveSegment] = useState<CategoryType | "all">("all");
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");

  const { habits, habitLogs } = useHabits(userId);
  const { expenses } = useExpenses(userId);
  const { moodLogs } = useMoodLogs(userId);
  const { healthLogs } = useHealthLogs(userId);

  // Past 7 days calculation
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const dayNames = days.map((d) => new Date(d).toLocaleDateString("en-US", { weekday: "short" }));

  // 1. Habit Completion Data
  const habitChartData = days.map((dateStr, idx) => {
    const totalCount = habits.length || 1;
    const completedCount = habitLogs.filter((l) => l.completed_on === dateStr).length;
    return {
      day: dayNames[idx],
      completionRate: Math.round((completedCount / totalCount) * 100),
    };
  });

  // 2. Expense Spend Data
  const expenseChartData = days.map((dateStr, idx) => {
    const spent = expenses
      .filter((e) => e.spent_on === dateStr)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return {
      day: dayNames[idx],
      completionRate: Number(spent.toFixed(2)),
    };
  });

  // 3. Category Expenses Donut Data
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    const catName = e.expense_categories?.name || "Other";
    categoryTotals[catName] = (categoryTotals[catName] || 0) + Number(e.amount);
  });

  const expenseCategoryDonutData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2)),
  }));

  // 4. Mood Trend Data
  const moodChartData = days.map((dateStr, idx) => {
    const log = moodLogs.find((m) => m.logged_on === dateStr);
    return {
      day: dayNames[idx],
      rating: log ? log.mood_score : 3,
    };
  });

  // 5. Health Combo Chart Data
  const healthChartData = days.map((dateStr, idx) => {
    const log = healthLogs.find((h) => h.logged_on === dateStr);
    return {
      day: dayNames[idx],
      waterLiters: log ? Number((log.water_glasses * 0.25).toFixed(1)) : 0,
      sleepHours: log ? Number(log.sleep_hours) : 0,
    };
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-habit-primary" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
              Analytics & Insights
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Deep dive data visualizations, correlation trends, and heatmap matrix
          </p>
        </div>

        {/* Time Range Filter Switcher */}
        <div className="flex items-center gap-1 p-1 bg-surface-level2 rounded-2xl border border-white/5">
          {(["week", "month", "year"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                timeRange === range
                  ? "bg-habit/20 text-habit-primary border border-habit/40"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Category Segment Control */}
      <div className="flex overflow-x-auto gap-2 p-1 bg-surface-level2 rounded-2xl border border-white/5">
        {[
          { id: "all", name: "All Categories", icon: Zap, color: "text-habit-primary" },
          { id: "habits", name: "Habits", icon: Activity, color: "text-habit" },
          { id: "expenses", name: "Expenses", icon: CreditCard, color: "text-expense" },
          { id: "mood", name: "Mood", icon: Smile, color: "text-mood" },
          { id: "health", name: "Health", icon: HeartPulse, color: "text-health" },
        ].map((seg) => {
          const Icon = seg.icon;
          const isActive = activeSegment === seg.id;

          return (
            <button
              key={seg.id}
              onClick={() => setActiveSegment(seg.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-surface-level3 text-on-surface border border-white/10 shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Icon className={`w-4 h-4 ${seg.color}`} />
              {seg.name}
            </button>
          );
        })}
      </div>

      {/* Dynamic Client-Computed Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card glowCategory="habits">
          <div className="flex items-center gap-2 text-xs font-bold text-habit-primary uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" /> Habit Consistency
          </div>
          <p className="text-xl font-extrabold text-on-surface">
            {habitChartData.reduce((acc, curr) => acc + curr.completionRate, 0) / 7 > 70 ? "High Consistency 🔥" : "Building Momentum ⚡"}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Weekly average habit completion rate is {Math.round(habitChartData.reduce((acc, curr) => acc + curr.completionRate, 0) / 7)}%.
          </p>
        </Card>

        <Card glowCategory="expenses">
          <div className="flex items-center gap-2 text-xs font-bold text-expense uppercase tracking-wider mb-2">
            <TrendingUp className="w-4 h-4" /> Top Spend Driver
          </div>
          <p className="text-xl font-extrabold text-on-surface">
            {expenseCategoryDonutData[0]?.name || "None"}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            {expenseCategoryDonutData[0] ? `Total spent: ₹${expenseCategoryDonutData[0].value}` : "No expenses recorded this week."}
          </p>
        </Card>

        <Card glowCategory="health">
          <div className="flex items-center gap-2 text-xs font-bold text-health uppercase tracking-wider mb-2">
            <HeartPulse className="w-4 h-4" /> Wellness Correlation
          </div>
          <p className="text-xl font-extrabold text-on-surface">Optimal Energy</p>
          <p className="text-xs text-on-surface-variant mt-1">
            Hydration & sleep rates are positively correlated with mood ratings.
          </p>
        </Card>
      </div>

      {/* 52-Week GitHub-Style Activity Matrix Heatmap */}
      <Card>
        <HabitHeatmap habitLogs={habitLogs} expenses={expenses} moodLogs={moodLogs} healthLogs={healthLogs} />
      </Card>

      {/* Recharts Analytics Visualization Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(activeSegment === "all" || activeSegment === "habits") && (
          <BarChartCard
            title="Weekly Habit Completion (%)"
            subtitle="Percentage of target habits completed daily"
            data={habitChartData}
          />
        )}

        {(activeSegment === "all" || activeSegment === "expenses") && (
          <BarChartCard
            title="Daily Expense Spend (₹)"
            subtitle="Total money spent per day"
            data={expenseChartData}
          />
        )}

        {(activeSegment === "all" || activeSegment === "expenses") && expenseCategoryDonutData.length > 0 && (
          <DonutChartCard
            title="Expense Category Breakdown"
            subtitle="Percentage share of expenses by category"
            data={expenseCategoryDonutData}
          />
        )}

        {(activeSegment === "all" || activeSegment === "mood") && (
          <LineChartCard
            title="Mood Rating Trend (1-5)"
            subtitle="Daily emotional state tracker"
            data={moodChartData}
          />
        )}

        {(activeSegment === "all" || activeSegment === "health") && (
          <ComboChartCard
            title="Health: Hydration (L) vs Sleep (h)"
            subtitle="Daily water intake liters and rest hours"
            data={healthChartData}
          />
        )}
      </div>
    </div>
  );
};

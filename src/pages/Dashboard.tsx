import React from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useHabits } from "@/hooks/useHabits";
import { useExpenses } from "@/hooks/useExpenses";
import { useMoodLogs } from "@/hooks/useMoodLogs";
import { useHealthLogs } from "@/hooks/useHealthLogs";
import { useStreaks } from "@/hooks/useStreaks";
import { useUIStore } from "@/store/useUIStore";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Activity, CreditCard, Smile, HeartPulse, Check, Plus, Calendar as CalendarIcon, Zap, Command, Sparkles } from "lucide-react";
import { formatCurrency } from "@/utils/currencyFormatter";
import { playCheckmarkSound, playSuccessFanfare } from "@/utils/audioFeedback";

export const DashboardPage: React.FC = () => {
  const { user, profile } = useAuth();
  const userId = user?.id || "";
  const { openAddModal } = useUIStore();

  const { habits, habitLogs, toggleHabit } = useHabits(userId);
  const { expenses } = useExpenses(userId);
  const { moodLogs } = useMoodLogs(userId);
  const { healthLogs } = useHealthLogs(userId);
  const { activeStreakCount } = useStreaks(userId);

  const todayStr = new Date().toISOString().split("T")[0];
  const formattedDate = format(new Date(), "EEEE, MMM d");

  const currentHour = new Date().getHours();
  const timeGreeting =
    currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";
  const timeEmoji = currentHour < 12 ? "🌅" : currentHour < 18 ? "☀️" : "🌙";

  // Habits Today Calculations
  const totalHabits = habits.length;
  const completedHabitsToday = habitLogs.filter((l) => l.completed_on === todayStr).length;
  const habitPercent = totalHabits > 0 ? Math.round((completedHabitsToday / totalHabits) * 100) : 0;

  // Expenses Today Calculations
  const expensesToday = expenses
    .filter((e) => e.spent_on === todayStr)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Mood Today
  const moodToday = moodLogs.find((m) => m.logged_on === todayStr);

  // Health Today
  const healthToday = healthLogs.find((h) => h.logged_on === todayStr);

  const handleToggleHabit = async (habitId: string) => {
    const isDoneBefore = habitLogs.some((l) => l.habit_id === habitId && l.completed_on === todayStr);
    playCheckmarkSound();

    const res = await toggleHabit({ habitId });
    if (!isDoneBefore && completedHabitsToday + 1 >= totalHabits && totalHabits > 0) {
      playSuccessFanfare();
    }
    return res;
  };

  // Today Snapshot timeline items
  const timeline: Array<{ id: string; type: string; title: string; subtitle: string; color: string }> = [];

  habitLogs
    .filter((l) => l.completed_on === todayStr)
    .forEach((l) => {
      const h = habits.find((item) => item.id === l.habit_id);
      if (h) {
        timeline.push({ id: l.id, type: "habit", title: h.name, subtitle: "Habit check-in completed", color: "#A855F7" });
      }
    });

  expenses
    .filter((e) => e.spent_on === todayStr)
    .forEach((e) => {
      timeline.push({ id: e.id, type: "expense", title: `${e.expense_categories?.name || "Expense"}: ${formatCurrency(Number(e.amount))}`, subtitle: e.note || "Logged expense", color: "#22D3EE" });
    });

  moodLogs
    .filter((m) => m.logged_on === todayStr)
    .forEach((m) => {
      timeline.push({ id: m.id, type: "mood", title: `Mood Score: ${m.mood_score}/5`, subtitle: m.journal_note || (m.tags ? m.tags.join(", ") : "Logged mood"), color: "#EC4899" });
    });

  healthLogs
    .filter((h) => h.logged_on === todayStr)
    .forEach((h) => {
      timeline.push({ id: h.id, type: "health", title: "Health Tracker", subtitle: `💧 ${(h.water_glasses * 0.25).toFixed(1)}L | 💤 ${h.sleep_hours}h | 🏃 ${h.workout_minutes}m`, color: "#84CC16" });
    });

  const activeCategories = profile?.active_categories || ["habits", "expenses", "mood", "health"];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Header with Time-Aware Greeting & Command Bar Hint */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
            <CalendarIcon className="w-3.5 h-3.5 text-habit" /> {formattedDate}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            {timeGreeting}, {profile?.full_name?.split(" ")[0] || "User"} {timeEmoji}
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Here is your real-time snapshot for habits, expenses, mood, and health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Cmd + K Command Palette Hint Badge */}
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl bg-surface-level2 border border-outline/30 hover:border-habit/40 text-xs font-bold text-on-surface-variant transition-all"
          >
            <Command className="w-3.5 h-3.5 text-habit-primary" />
            <span>Cmd + K</span>
          </button>

          {/* Active Streak Counter Badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-surface-level2 border border-habit/30 shadow-glow-habit">
            <Zap className="w-5 h-5 text-habit-primary stroke-[2.5]" />
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Active Streak</p>
              <p className="text-sm font-extrabold text-habit-primary">{activeStreakCount} Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Daily AI Digest Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-habit/15 via-expense/10 to-health/15 border border-habit/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-habit/20 flex items-center justify-center text-habit-primary shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface">
              {habitPercent === 100
                ? "🎯 Perfect Day! All habits completed 100%!"
                : habitPercent > 0
                ? `⚡ Great momentum! ${completedHabitsToday} of ${totalHabits} habits completed today.`
                : "🚀 Ready to kickstart your day? Check off your first habit below!"}
            </p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              {expensesToday > 0
                ? `Expenses today: ${formatCurrency(expensesToday)}.`
                : "No expenses logged yet today."}
              {moodToday ? ` • Mood: ${moodToday.mood_score}/5` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* HABITS CARD */}
        {activeCategories.includes("habits") && (
          <Card 
            glowCategory="habits" 
            hoverable 
            onClick={() => openAddModal("habits")}
            className="flex items-center justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-habit/20 flex items-center justify-center text-habit-primary mb-3">
                <Activity className="w-5 h-5" />
              </div>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Habits Today</p>
              <h3 className="text-2xl font-extrabold text-on-surface mt-1">{completedHabitsToday} / {totalHabits}</h3>
              <p className="text-[11px] text-habit-primary font-semibold mt-1">completed</p>
            </div>
            <ProgressRing progress={habitPercent} size={68} strokeWidth={6} color="#A855F7">
              <span className="text-xs font-bold text-on-surface">{habitPercent}%</span>
            </ProgressRing>
          </Card>
        )}

        {/* EXPENSES CARD */}
        {activeCategories.includes("expenses") && (
          <Card 
            glowCategory="expenses" 
            hoverable 
            onClick={() => openAddModal("expenses")}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-expense/20 flex items-center justify-center text-expense-secondary">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-expense">+ Log</span>
            </div>
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Expenses Today</p>
            <h3 className="text-2xl font-extrabold text-on-surface mt-1">{formatCurrency(expensesToday)}</h3>
            <p className="text-[11px] text-on-surface-variant mt-2 font-medium">Daily budget tracking</p>
          </Card>
        )}

        {/* MOOD CARD */}
        {activeCategories.includes("mood") && (
          <Card 
            glowCategory="mood" 
            hoverable 
            onClick={() => openAddModal("mood")}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-mood/20 flex items-center justify-center text-mood">
                <Smile className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-mood">
                {moodToday ? `${moodToday.mood_score}/5` : "Unset"}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Mood Status</p>
            <h3 className="text-xl font-extrabold text-on-surface mt-1">
              {moodToday ? `Score ${moodToday.mood_score}/5` : "Log Mood"}
            </h3>
            <p className="text-[11px] text-on-surface-variant mt-2 truncate">
              {moodToday?.tags?.length ? moodToday.tags.join(" • ") : "Tap to record mood"}
            </p>
          </Card>
        )}

        {/* HEALTH CARD */}
        {activeCategories.includes("health") && (
          <Card 
            glowCategory="health" 
            hoverable 
            onClick={() => openAddModal("health")}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-health/20 flex items-center justify-center text-health">
                <HeartPulse className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-health">
                {healthToday ? `${(healthToday.water_glasses * 0.25).toFixed(1)}L` : "0L"}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Health Metrics</p>
            <h3 className="text-xl font-extrabold text-on-surface mt-1">
              {healthToday ? `${healthToday.sleep_hours}h Sleep` : "Log Metrics"}
            </h3>
            <p className="text-[11px] text-on-surface-variant mt-2">
              {healthToday ? `🏃 ${healthToday.workout_minutes}m Workout` : "Water, Sleep, Exercise"}
            </p>
          </Card>
        )}
      </div>

      {/* Daily Habits Checklist */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-habit" />
            <h2 className="text-lg font-bold text-on-surface">Daily Habits Checklist</h2>
          </div>
          <button
            onClick={() => openAddModal("habits")}
            className="text-xs font-bold text-habit-primary flex items-center gap-1 hover:underline"
          >
            <Plus className="w-4 h-4" /> Add Habit
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {habits.map((habit) => {
            const isDone = habitLogs.some((l) => l.habit_id === habit.id && l.completed_on === todayStr);

            return (
              <div
                key={habit.id}
                onClick={() => handleToggleHabit(habit.id)}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer active:scale-98 ${
                  isDone
                    ? "bg-habit/10 border-habit/50 shadow-glow-habit"
                    : "bg-surface-level2 border-outline/30 hover:border-habit/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isDone ? "bg-habit text-background shadow-glow-habit" : "bg-surface-bright text-on-surface-variant"}`}>
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isDone ? "line-through text-on-surface-variant" : "text-on-surface"}`}>{habit.name}</p>
                    <p className="text-xs text-on-surface-variant">{habit.reminder_time || "All day"}</p>
                  </div>
                </div>
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${isDone ? "bg-habit/20 text-habit-primary" : "bg-surface-bright text-on-surface-variant"}`}>
                  {isDone ? "Completed" : "Check-in"}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Today's Activity Snapshot */}
      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-on-surface">Today's Timeline Activity</h2>
        {timeline.length === 0 ? (
          <div className="py-8 text-center text-on-surface-variant text-xs font-semibold">
            No activity recorded today yet. Log a habit, expense, or mood above!
          </div>
        ) : (
          <div className="space-y-2.5">
            {timeline.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-surface-level2 border border-outline/30 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <p className="text-sm font-bold text-on-surface">{item.title}</p>
                    <p className="text-xs text-on-surface-variant">{item.subtitle}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-on-surface-variant">Today</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

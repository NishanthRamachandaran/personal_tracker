import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useHabits } from "@/hooks/useHabits";
import { useExpenses } from "@/hooks/useExpenses";
import { useMoodLogs } from "@/hooks/useMoodLogs";
import { useHealthLogs } from "@/hooks/useHealthLogs";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Zap } from "lucide-react";

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || "";

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split("T")[0]);
  const [isDaySheetOpen, setIsDaySheetOpen] = useState(false);

  const { habits, habitLogs } = useHabits(userId);
  const { expenses } = useExpenses(userId);
  const { moodLogs } = useMoodLogs(userId);
  const { healthLogs } = useHealthLogs(userId);

  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayDots = (dateStr: string) => {
    const hasHabit = habitLogs.some((l) => l.completed_on === dateStr);
    const hasExpense = expenses.some((e) => e.spent_on === dateStr);
    const hasMood = moodLogs.some((m) => m.logged_on === dateStr);
    const hasHealth = healthLogs.some((h) => h.logged_on === dateStr);

    return { hasHabit, hasExpense, hasMood, hasHealth };
  };

  const handleSelectDay = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsDaySheetOpen(true);
  };

  const getEntriesForDate = (dateStr: string) => {
    const entries: Array<{ id: string; type: string; title: string; subtitle: string; color: string }> = [];

    habitLogs
      .filter((l) => l.completed_on === dateStr)
      .forEach((l) => {
        const h = habits.find((item) => item.id === l.habit_id);
        if (h) entries.push({ id: l.id, type: "Habit", title: h.name, subtitle: "Habit check-in", color: "#A855F7" });
      });

    expenses
      .filter((e) => e.spent_on === dateStr)
      .forEach((e) => {
        entries.push({ id: e.id, type: "Expense", title: `${e.expense_categories?.name || "Expense"}: $${Number(e.amount).toFixed(2)}`, subtitle: e.note || "Logged expense", color: "#22D3EE" });
      });

    moodLogs
      .filter((m) => m.logged_on === dateStr)
      .forEach((m) => {
        entries.push({ id: m.id, type: "Mood", title: `Mood Rating: ${m.mood_score}/5`, subtitle: m.journal_note || (m.tags ? m.tags.join(", ") : "Logged mood"), color: "#EC4899" });
      });

    healthLogs
      .filter((h) => h.logged_on === dateStr)
      .forEach((h) => {
        entries.push({ id: h.id, type: "Health", title: "Health Metrics", subtitle: `💧 ${(h.water_glasses * 0.25).toFixed(1)}L | 💤 ${h.sleep_hours}h`, color: "#84CC16" });
      });

    return entries;
  };

  const selectedDateEntries = selectedDate ? getEntriesForDate(selectedDate) : [];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-expense" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
              Calendar & History
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Visual month log history with category indicators
          </p>
        </div>
      </div>

      {/* Month Calendar Grid */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
          <h2 className="text-lg font-bold text-on-surface">{format(currentMonth, "MMMM yyyy")}</h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="p-2 rounded-xl bg-surface-level2 hover:bg-surface-level3 text-on-surface">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={handleNextMonth} className="p-2 rounded-xl bg-surface-level2 hover:bg-surface-level3 text-on-surface">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-on-surface-variant/70 uppercase">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>

        {/* Grid Days */}
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day) => {
            const dateStr = day.toISOString().split("T")[0];
            const isSelected = selectedDate === dateStr;
            const isToday = isSameDay(day, new Date());
            const dots = getDayDots(dateStr);

            return (
              <div
                key={dateStr}
                onClick={() => handleSelectDay(dateStr)}
                className={`min-h-[64px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-expense/15 border-expense shadow-glow-expense scale-105"
                    : isToday
                    ? "bg-surface-level2 border-habit/50"
                    : "bg-surface-level1 border-outline/20 hover:border-white/20"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-extrabold ${isToday ? "text-habit-primary" : "text-on-surface"}`}>
                    {format(day, "d")}
                  </span>
                  {isToday && <span className="w-1.5 h-1.5 rounded-full bg-habit" />}
                </div>

                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {dots.hasHabit && <span className="w-2 h-2 rounded-full bg-habit shadow-glow-habit" />}
                  {dots.hasExpense && <span className="w-2 h-2 rounded-full bg-expense shadow-glow-expense" />}
                  {dots.hasMood && <span className="w-2 h-2 rounded-full bg-mood shadow-glow-mood" />}
                  {dots.hasHealth && <span className="w-2 h-2 rounded-full bg-health shadow-glow-health" />}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Day Detail Modal */}
      <Modal isOpen={isDaySheetOpen} onClose={() => setIsDaySheetOpen(false)} title={`Log History — ${selectedDate}`}>
        {selectedDateEntries.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Clock className="w-8 h-8 text-on-surface-variant/40 mx-auto" />
            <p className="text-sm font-semibold text-on-surface-variant">No entries recorded for this date</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {selectedDateEntries.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-surface-level1 border border-outline/30 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-background font-bold text-xs"
                    style={{ backgroundColor: item.color }}
                  >
                    ✓
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{item.title}</p>
                    <p className="text-xs text-on-surface-variant">{item.subtitle}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-surface-level3 text-on-surface-variant">
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

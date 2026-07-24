import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useHabits } from "@/hooks/useHabits";
import { useExpenses } from "@/hooks/useExpenses";
import { useMoodLogs } from "@/hooks/useMoodLogs";
import { useHealthLogs } from "@/hooks/useHealthLogs";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Trash2, Activity, CreditCard, Smile, HeartPulse } from "lucide-react";
import { formatCurrency } from "@/utils/currencyFormatter";

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || "";

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split("T")[0]);
  const [isDaySheetOpen, setIsDaySheetOpen] = useState(false);

  const { habits, habitLogs, toggleHabit } = useHabits(userId);
  const { expenses, deleteExpense } = useExpenses(userId);
  const { moodLogs, deleteMoodLog } = useMoodLogs(userId);
  const { healthLogs, deleteHealthLog } = useHealthLogs(userId);

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

  const handleDeleteEntry = async (entry: { id: string; type: string; rawItem: any }) => {
    if (confirm(`Are you sure you want to erase this ${entry.type} entry from history?`)) {
      if (entry.type === "Habit") {
        await toggleHabit({ habitId: entry.rawItem.habit_id, dateStr: selectedDate || undefined });
      } else if (entry.type === "Expense") {
        await deleteExpense(entry.id);
      } else if (entry.type === "Mood") {
        await deleteMoodLog(entry.id);
      } else if (entry.type === "Health") {
        await deleteHealthLog(entry.id);
      }
    }
  };

  const getEntriesForDate = (dateStr: string) => {
    const entries: Array<{ id: string; type: string; title: string; subtitle: string; color: string; icon: any; rawItem: any }> = [];

    habitLogs
      .filter((l) => l.completed_on === dateStr)
      .forEach((l) => {
        const h = habits.find((item) => item.id === l.habit_id);
        if (h) {
          const timeCalcStr = h.reminder_time ? `Scheduled: ${h.reminder_time}` : "Completed all-day";
          entries.push({
            id: l.id,
            type: "Habit",
            title: h.name,
            subtitle: `Check-in • ${timeCalcStr}`,
            color: "#A855F7",
            icon: Activity,
            rawItem: l,
          });
        }
      });

    expenses
      .filter((e) => e.spent_on === dateStr)
      .forEach((e) => {
        entries.push({
          id: e.id,
          type: "Expense",
          title: `${e.expense_categories?.name || "Expense"}: ${formatCurrency(Number(e.amount))}`,
          subtitle: e.note || "Logged expense",
          color: "#22D3EE",
          icon: CreditCard,
          rawItem: e,
        });
      });

    moodLogs
      .filter((m) => m.logged_on === dateStr)
      .forEach((m) => {
        entries.push({
          id: m.id,
          type: "Mood",
          title: `Mood Rating: ${m.mood_score}/5`,
          subtitle: m.journal_note || (m.tags ? m.tags.join(", ") : "Logged mood"),
          color: "#EC4899",
          icon: Smile,
          rawItem: m,
        });
      });

    healthLogs
      .filter((h) => h.logged_on === dateStr)
      .forEach((h) => {
        entries.push({
          id: h.id,
          type: "Health",
          title: "Health Metrics",
          subtitle: `💧 ${(h.water_glasses * 0.25).toFixed(1)}L | 💤 ${h.sleep_hours}h | 🏃 ${h.workout_minutes}m`,
          color: "#84CC16",
          icon: HeartPulse,
          rawItem: h,
        });
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
            Visual month history log with category indicators & entry management
          </p>
        </div>
      </div>

      {/* Month Calendar Grid */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
          <h2 className="text-lg font-bold text-on-surface">{format(currentMonth, "MMMM yyyy")}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-surface-level2 hover:bg-surface-level3 border border-outline/30 text-on-surface transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-surface-level2 hover:bg-surface-level3 border border-outline/30 text-on-surface transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-on-surface-variant uppercase pb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Month Day Cells */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {daysInMonth.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;
            const isSelected = selectedDate === dateStr;
            const dots = getDayDots(dateStr);

            return (
              <button
                key={dateStr}
                onClick={() => handleSelectDay(dateStr)}
                className={`min-h-[64px] sm:min-h-[76px] p-2 rounded-2xl border flex flex-col justify-between items-start transition-all relative ${
                  isSelected
                    ? "bg-habit/15 border-habit shadow-glow-habit"
                    : isToday
                    ? "bg-surface-level2 border-expense/60"
                    : "bg-surface-level2 border-outline/30 hover:border-outline-variant/60"
                }`}
              >
                <span className={`text-xs font-extrabold ${isToday ? "text-expense" : "text-on-surface"}`}>
                  {format(day, "d")}
                </span>

                {/* Activity Dots Indicator Row */}
                <div className="flex items-center gap-1 mt-1">
                  {dots.hasHabit && <span className="w-2 h-2 rounded-full bg-habit shadow-glow-habit" />}
                  {dots.hasExpense && <span className="w-2 h-2 rounded-full bg-expense shadow-glow-expense" />}
                  {dots.hasMood && <span className="w-2 h-2 rounded-full bg-mood shadow-glow-mood" />}
                  {dots.hasHealth && <span className="w-2 h-2 rounded-full bg-health shadow-glow-health" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-outline-variant/30 text-xs font-semibold">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-habit" /> Habit Log</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-expense" /> Expense Log</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-mood" /> Mood Log</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-health" /> Health Log</div>
        </div>
      </Card>

      {/* Day History Detail Sheet Modal */}
      <Modal
        isOpen={isDaySheetOpen}
        onClose={() => setIsDaySheetOpen(false)}
        title={selectedDate ? `Activity Details for ${selectedDate}` : "Activity History"}
      >
        {selectedDateEntries.length === 0 ? (
          <div className="py-8 text-center text-on-surface-variant text-xs font-semibold space-y-2">
            <p>No activity or expenses recorded for this date.</p>
            <p className="text-[11px] text-on-surface-variant/70">Click quick add to log your habits, expenses, mood, or health metrics!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDateEntries.map((entry) => {
              const Icon = entry.icon;

              return (
                <div
                  key={entry.id}
                  className="p-3.5 rounded-2xl bg-surface-level2 border border-outline/30 flex items-center justify-between gap-3 group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${entry.color}20`, color: entry.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">{entry.title}</p>
                      <p className="text-xs text-on-surface-variant">{entry.subtitle}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteEntry(entry)}
                    title="Erase / Delete Entry"
                    className="p-2 rounded-xl bg-surface-level3 hover:bg-mood/20 text-on-surface-variant hover:text-mood border border-outline/20 transition-all flex items-center gap-1 text-xs font-semibold"
                  >
                    <Trash2 className="w-4 h-4 text-mood" />
                    <span className="hidden sm:inline">Erase</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
};

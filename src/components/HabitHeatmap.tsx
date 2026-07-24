import React from "react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { HabitLog, Expense, MoodLog, HealthLog } from "@/types/database";

interface HabitHeatmapProps {
  habitLogs: HabitLog[];
  expenses: Expense[];
  moodLogs: MoodLog[];
  healthLogs: HealthLog[];
}

export const HabitHeatmap: React.FC<HabitHeatmapProps> = ({ habitLogs, expenses, moodLogs, healthLogs }) => {
  const today = new Date();
  const startDate = subDays(today, 119); // 120 days (~4 months matrix grid)
  const days = eachDayOfInterval({ start: startDate, end: today });

  const getIntensity = (dateStr: string) => {
    let count = 0;
    count += habitLogs.filter((l) => l.completed_on === dateStr).length;
    count += expenses.filter((e) => e.spent_on === dateStr).length ? 1 : 0;
    count += moodLogs.filter((m) => m.logged_on === dateStr).length ? 1 : 0;
    count += healthLogs.filter((h) => h.logged_on === dateStr).length ? 1 : 0;
    return count;
  };

  const getColorClass = (intensity: number) => {
    if (intensity === 0) return "bg-surface-level2 border-outline/20";
    if (intensity === 1) return "bg-habit/30 border-habit/40";
    if (intensity === 2) return "bg-habit/60 border-habit/70 shadow-glow-habit";
    if (intensity >= 3) return "bg-habit border-habit shadow-glow-habit text-background";
    return "bg-habit border-habit";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-on-surface">Consistency Heatmap (120 Days)</h3>
          <p className="text-xs text-on-surface-variant">Visual activity logs intensity matrix</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant">
          <span>Less</span>
          <span className="w-2.5 h-2.5 rounded-sm bg-surface-level2 border border-outline/20" />
          <span className="w-2.5 h-2.5 rounded-sm bg-habit/30" />
          <span className="w-2.5 h-2.5 rounded-sm bg-habit/60" />
          <span className="w-2.5 h-2.5 rounded-sm bg-habit" />
          <span>More</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-surface-level2 border border-outline/30 overflow-x-auto">
        <div className="grid grid-rows-7 grid-flow-col gap-1.5 min-w-[500px]">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const intensity = getIntensity(dateStr);
            const colorClass = getColorClass(intensity);

            return (
              <div
                key={dateStr}
                title={`${format(day, "MMM d, yyyy")}: ${intensity} activity logs`}
                className={`w-3.5 h-3.5 rounded-md border transition-all cursor-pointer hover:scale-125 ${colorClass}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

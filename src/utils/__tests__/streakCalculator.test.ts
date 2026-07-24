import { calculateHabitStreak, checkMilestone } from "../streakCalculator";

describe("Streak Calculator Utilities", () => {
  const getDaysAgo = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split("T")[0];
  };

  test("calculates current streak when logged today and consecutive past days", () => {
    const dates = [getDaysAgo(0), getDaysAgo(1), getDaysAgo(2)];
    const result = calculateHabitStreak(dates);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  test("calculates current streak when logged yesterday but not yet today", () => {
    const dates = [getDaysAgo(1), getDaysAgo(2)];
    const result = calculateHabitStreak(dates);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });

  test("resets current streak to 0 if last log was 2+ days ago, preserving historical longest streak", () => {
    const dates = ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04"];
    const result = calculateHabitStreak(dates);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(4);
  });

  test("detects milestones correctly for 3, 7, 14, 30 days", () => {
    expect(checkMilestone(3)?.title).toContain("3-Day Ignition!");
    expect(checkMilestone(7)?.title).toContain("7-Day Unstoppable Force!");
    expect(checkMilestone(14)?.title).toContain("14-Day Iron Discipline!");
    expect(checkMilestone(30)?.title).toContain("30-Day Masterclass!");
    expect(checkMilestone(5)).toBeNull();
  });
});

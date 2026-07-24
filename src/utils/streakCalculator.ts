export function calculateHabitStreak(dates: string[]): { currentStreak: number; longestStreak: number } {
  if (!dates || dates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const uniqueDates = Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a));
  
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const hasLogToday = uniqueDates.includes(todayStr);
  const hasLogYesterday = uniqueDates.includes(yesterdayStr);

  if (!hasLogToday && !hasLogYesterday) {
    return { currentStreak: 0, longestStreak: calculateLongestStreak(uniqueDates) };
  }

  let currentStreak = 0;
  let checkDate = hasLogToday ? new Date() : yesterday;

  while (true) {
    const checkStr = checkDate.toISOString().split("T")[0];
    if (uniqueDates.includes(checkStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  const longestStreak = Math.max(currentStreak, calculateLongestStreak(uniqueDates));
  return { currentStreak, longestStreak };
}

function calculateLongestStreak(uniqueDatesDescending: string[]): number {
  if (uniqueDatesDescending.length === 0) return 0;
  const ascending = [...uniqueDatesDescending].sort((a, b) => a.localeCompare(b));
  
  let maxStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < ascending.length; i++) {
    const prev = new Date(ascending[i - 1]);
    const curr = new Date(ascending[i]);
    const diffTime = Math.abs(curr.getTime() - prev.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    } else if (diffDays > 1) {
      tempStreak = 1;
    }
  }

  return maxStreak;
}

export function checkMilestone(streakCount: number) {
  const milestones = [
    { number: 3, title: "3-Day Ignition!", description: "3 days of consistency!" },
    { number: 7, title: "7-Day Unstoppable Force!", description: "1 full week streak!" },
    { number: 14, title: "14-Day Iron Discipline!", description: "2 solid weeks!" },
    { number: 30, title: "30-Day Masterclass!", description: "1-month streak achieved!" }
  ];
  return milestones.find((m) => m.number === streakCount) || null;
}

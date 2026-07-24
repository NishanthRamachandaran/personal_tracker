import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Habit, HabitLog } from "@/types/database";

const getTodayStr = () => new Date().toISOString().split("T")[0];
const DEMO_USER_ID = "demo-user-id-001";

const INITIAL_HABITS: Habit[] = [
  { id: "h-1", user_id: DEMO_USER_ID, name: "Morning Meditation (10m)", icon: "brain", frequency: "daily", reminder_time: "07:30:00", is_active: true, created_at: new Date().toISOString() },
  { id: "h-2", user_id: DEMO_USER_ID, name: "Drink 2.5L Water Goal", icon: "droplets", frequency: "daily", reminder_time: "09:00:00", is_active: true, created_at: new Date().toISOString() },
  { id: "h-3", user_id: DEMO_USER_ID, name: "30 Min HIIT Workout", icon: "activity", frequency: "daily", reminder_time: "18:00:00", is_active: true, created_at: new Date().toISOString() },
  { id: "h-4", user_id: DEMO_USER_ID, name: "Read 20 Pages", icon: "book-open", frequency: "daily", reminder_time: "21:30:00", is_active: true, created_at: new Date().toISOString() },
];

const INITIAL_LOGS: HabitLog[] = [
  { id: "hl-1", habit_id: "h-1", user_id: DEMO_USER_ID, completed_on: getTodayStr(), created_at: new Date().toISOString() },
  { id: "hl-2", habit_id: "h-2", user_id: DEMO_USER_ID, completed_on: getTodayStr(), created_at: new Date().toISOString() },
];

export function useHabits(userId: string) {
  const queryClient = useQueryClient();
  const isDemo = !userId || userId === DEMO_USER_ID;

  // 1. Fetch Habits List with auto-seeding for new real users
  const habitsQuery = useQuery({
    queryKey: ["habits", userId],
    queryFn: async (): Promise<Habit[]> => {
      if (isDemo) return INITIAL_HABITS;

      const { data, error } = await (supabase.from("habits") as any)
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) return [];

      if (!data || data.length === 0) {
        // Auto-seed starter habits into Supabase for new user
        const seedHabits = INITIAL_HABITS.map((h) => ({
          user_id: userId,
          name: h.name,
          icon: h.icon,
          frequency: h.frequency,
          reminder_time: h.reminder_time,
          is_active: true,
        }));

        const { data: inserted, error: insertErr } = await (supabase.from("habits") as any)
          .insert(seedHabits)
          .select();

        if (!insertErr && inserted) return inserted as Habit[];
        return [];
      }

      return data as Habit[];
    },
    enabled: !!userId,
  });

  // 2. Fetch Habit Logs
  const habitLogsQuery = useQuery({
    queryKey: ["habit_logs", userId],
    queryFn: async (): Promise<HabitLog[]> => {
      if (isDemo) return INITIAL_LOGS;

      const { data, error } = await (supabase.from("habit_logs") as any)
        .select("*")
        .eq("user_id", userId);

      if (error || !data) return [];
      return data as HabitLog[];
    },
    enabled: !!userId,
  });

  // 3. Toggle Habit Log (Optimistic mutation + persistent DB insert/delete)
  const toggleHabitMutation = useMutation({
    mutationFn: async ({ habitId, dateStr = getTodayStr() }: { habitId: string; dateStr?: string }) => {
      const currentLogs = habitLogsQuery.data || (isDemo ? INITIAL_LOGS : []);
      const existing = currentLogs.find(
        (l) => l.habit_id === habitId && l.completed_on === dateStr
      );

      if (existing) {
        // Delete log from database
        if (!isDemo) {
          await (supabase.from("habit_logs") as any).delete().eq("id", existing.id);
        }
        return { action: "deleted", habitId, dateStr };
      } else {
        // Create log in database
        if (!isDemo) {
          const { data, error } = await (supabase.from("habit_logs") as any)
            .insert({ user_id: userId, habit_id: habitId, completed_on: dateStr })
            .select()
            .single();

          await (supabase as any).rpc("update_streak", { p_user_id: userId, p_category: "habits" });
          if (!error && data) return { action: "created", log: data as HabitLog };
        }

        const fallbackLog: HabitLog = {
          id: "hl-" + Date.now(),
          habit_id: habitId,
          user_id: userId,
          completed_on: dateStr,
          created_at: new Date().toISOString(),
        };
        return { action: "created", log: fallbackLog };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit_logs", userId] });
      queryClient.invalidateQueries({ queryKey: ["streaks", userId] });
    },
  });

  // 4. Create Habit
  const createHabitMutation = useMutation({
    mutationFn: async (habitData: { name: string; frequency?: "daily" | "weekly"; reminder_time?: string }) => {
      if (!isDemo) {
        const { data, error } = await (supabase.from("habits") as any)
          .insert({
            user_id: userId,
            name: habitData.name,
            frequency: habitData.frequency || "daily",
            reminder_time: habitData.reminder_time || "09:00",
            is_active: true,
          })
          .select()
          .single();

        if (!error && data) return data as Habit;
      }

      const newHabit: Habit = {
        id: "h-" + Date.now(),
        user_id: userId,
        name: habitData.name,
        icon: "activity",
        frequency: habitData.frequency || "daily",
        reminder_time: habitData.reminder_time || "09:00",
        is_active: true,
        created_at: new Date().toISOString(),
      };
      return newHabit;
    },
    onSuccess: (newHabit) => {
      queryClient.setQueryData<Habit[]>(["habits", userId], (old) => [newHabit, ...(old || [])]);
    },
  });

  return {
    habits: habitsQuery.data || (isDemo ? INITIAL_HABITS : []),
    habitLogs: habitLogsQuery.data || (isDemo ? INITIAL_LOGS : []),
    isLoading: habitsQuery.isLoading || habitLogsQuery.isLoading,
    toggleHabit: toggleHabitMutation.mutateAsync,
    createHabit: createHabitMutation.mutateAsync,
  };
}

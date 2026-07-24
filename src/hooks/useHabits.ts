import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Habit, HabitLog } from "@/types/database";

const getTodayStr = () => new Date().toISOString().split("T")[0];

const INITIAL_HABITS: Habit[] = [
  { id: "h-1", user_id: "demo-user-id-001", name: "Morning Meditation (10m)", icon: "brain", frequency: "daily", reminder_time: "07:30:00", is_active: true, created_at: new Date().toISOString() },
  { id: "h-2", user_id: "demo-user-id-001", name: "Drink 2.5L Water Goal", icon: "droplets", frequency: "daily", reminder_time: "09:00:00", is_active: true, created_at: new Date().toISOString() },
  { id: "h-3", user_id: "demo-user-id-001", name: "30 Min HIIT Workout", icon: "activity", frequency: "daily", reminder_time: "18:00:00", is_active: true, created_at: new Date().toISOString() },
  { id: "h-4", user_id: "demo-user-id-001", name: "Read 20 Pages", icon: "book-open", frequency: "daily", reminder_time: "21:30:00", is_active: true, created_at: new Date().toISOString() },
];

const INITIAL_LOGS: HabitLog[] = [
  { id: "hl-1", habit_id: "h-1", user_id: "demo-user-id-001", completed_on: getTodayStr(), created_at: new Date().toISOString() },
  { id: "hl-2", habit_id: "h-2", user_id: "demo-user-id-001", completed_on: getTodayStr(), created_at: new Date().toISOString() },
];

export function useHabits(userId: string) {
  const queryClient = useQueryClient();

  // 1. Fetch Habits List
  const habitsQuery = useQuery({
    queryKey: ["habits", userId],
    queryFn: async (): Promise<Habit[]> => {
      const { data, error } = await (supabase.from("habits") as any)
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) return INITIAL_HABITS;
      return data as Habit[];
    },
  });

  // 2. Fetch Habit Logs
  const habitLogsQuery = useQuery({
    queryKey: ["habit_logs", userId],
    queryFn: async (): Promise<HabitLog[]> => {
      const { data, error } = await (supabase.from("habit_logs") as any)
        .select("*")
        .eq("user_id", userId);

      if (error || !data || data.length === 0) return INITIAL_LOGS;
      return data as HabitLog[];
    },
  });

  // 3. Toggle Habit Log (Optimistic mutation)
  const toggleHabitMutation = useMutation({
    mutationFn: async ({ habitId, dateStr = getTodayStr() }: { habitId: string; dateStr?: string }) => {
      const existing = (habitLogsQuery.data || INITIAL_LOGS).find(
        (l) => l.habit_id === habitId && l.completed_on === dateStr
      );

      if (existing) {
        // Delete log
        await (supabase.from("habit_logs") as any).delete().eq("id", existing.id);
        return { action: "deleted", habitId, dateStr };
      } else {
        // Insert log
        const { data, error } = await (supabase.from("habit_logs") as any)
          .insert({ habit_id: habitId, user_id: userId, completed_on: dateStr })
          .select()
          .single();

        // Call Postgres streak trigger procedure
        await (supabase as any).rpc("update_streak", { p_user_id: userId, p_category: "habits" });

        if (error) {
          // Fallback local insertion if DB credentials not yet set up
          return { id: "hl-" + Date.now(), habit_id: habitId, user_id: userId, completed_on: dateStr, created_at: new Date().toISOString() };
        }
        return data;
      }
    },
    onMutate: async ({ habitId, dateStr = getTodayStr() }) => {
      await queryClient.cancelQueries({ queryKey: ["habit_logs", userId] });
      const previousLogs = queryClient.getQueryData<HabitLog[]>(["habit_logs", userId]) || INITIAL_LOGS;

      const existingIndex = previousLogs.findIndex(
        (l) => l.habit_id === habitId && l.completed_on === dateStr
      );

      let newLogs: HabitLog[];
      if (existingIndex >= 0) {
        newLogs = previousLogs.filter((_, idx) => idx !== existingIndex);
      } else {
        newLogs = [
          { id: "hl-temp-" + Date.now(), habit_id: habitId, user_id: userId, completed_on: dateStr, created_at: new Date().toISOString() },
          ...previousLogs,
        ];
      }

      queryClient.setQueryData(["habit_logs", userId], newLogs);
      return { previousLogs };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousLogs) {
        queryClient.setQueryData(["habit_logs", userId], context.previousLogs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["habit_logs", userId] });
      queryClient.invalidateQueries({ queryKey: ["streaks", userId] });
      queryClient.invalidateQueries({ queryKey: ["milestones", userId] });
    },
  });

  // 4. Create New Habit Mutation
  const createHabitMutation = useMutation({
    mutationFn: async ({ name, icon = "check-circle", frequency = "daily", reminder_time }: { name: string; icon?: string; frequency?: "daily" | "weekly"; reminder_time?: string }) => {
      const { data, error } = await (supabase.from("habits") as any)
        .insert({ user_id: userId, name, icon, frequency, reminder_time })
        .select()
        .single();

      if (error || !data) {
        const fallback: Habit = {
          id: "h-" + Date.now(),
          user_id: userId,
          name,
          icon,
          frequency,
          reminder_time: reminder_time || null,
          is_active: true,
          created_at: new Date().toISOString(),
        };
        return fallback;
      }
      return data;
    },
    onSuccess: (newHabit) => {
      queryClient.setQueryData<Habit[]>(["habits", userId], (old) => [newHabit, ...(old || [])]);
    },
  });

  return {
    habits: habitsQuery.data || INITIAL_HABITS,
    habitLogs: habitLogsQuery.data || INITIAL_LOGS,
    isLoading: habitsQuery.isLoading || habitLogsQuery.isLoading,
    toggleHabit: toggleHabitMutation.mutate,
    createHabit: createHabitMutation.mutateAsync,
  };
}

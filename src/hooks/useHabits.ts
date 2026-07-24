import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Habit, HabitLog } from "@/types/database";

const getTodayStr = () => new Date().toISOString().split("T")[0];
const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

const INITIAL_HABITS: Habit[] = [
  { id: "11111111-1111-4111-8111-111111111111", user_id: DEMO_USER_ID, name: "Morning Meditation (10m)", icon: "brain", frequency: "daily", reminder_time: "07:30:00", is_active: true, created_at: new Date().toISOString() },
  { id: "22222222-2222-4222-8222-222222222222", user_id: DEMO_USER_ID, name: "Drink 2.5L Water Goal", icon: "droplets", frequency: "daily", reminder_time: "09:00:00", is_active: true, created_at: new Date().toISOString() },
  { id: "33333333-3333-4333-8333-333333333333", user_id: DEMO_USER_ID, name: "30 Min HIIT Workout", icon: "activity", frequency: "daily", reminder_time: "18:00:00", is_active: true, created_at: new Date().toISOString() },
  { id: "44444444-4444-4444-8444-444444444444", user_id: DEMO_USER_ID, name: "Read 20 Pages", icon: "book-open", frequency: "daily", reminder_time: "21:30:00", is_active: true, created_at: new Date().toISOString() },
];

// Pre-checked logs only for Demo Mode
const DEMO_LOGS: HabitLog[] = [
  { id: "aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaaaa", habit_id: "11111111-1111-4111-8111-111111111111", user_id: DEMO_USER_ID, completed_on: getTodayStr(), created_at: new Date().toISOString() },
  { id: "bbbb2222-bbbb-4bbb-8bbb-bbbbbbbbbbbb", habit_id: "22222222-2222-4222-8222-222222222222", user_id: DEMO_USER_ID, completed_on: getTodayStr(), created_at: new Date().toISOString() },
];

function getLocalLogs(userId: string): HabitLog[] {
  try {
    const raw = localStorage.getItem(`pulse_habit_logs_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalLogs(userId: string, logs: HabitLog[]) {
  try {
    localStorage.setItem(`pulse_habit_logs_${userId}`, JSON.stringify(logs));
  } catch (e) {
    console.error("Failed to save local habit logs", e);
  }
}

function getLocalHabits(userId: string): Habit[] {
  try {
    const raw = localStorage.getItem(`pulse_habits_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalHabits(userId: string, habits: Habit[]) {
  try {
    localStorage.setItem(`pulse_habits_${userId}`, JSON.stringify(habits));
  } catch (e) {
    console.error("Failed to save local habits", e);
  }
}

export function useHabits(userId: string) {
  const queryClient = useQueryClient();
  const isDemo = !userId || userId === DEMO_USER_ID || userId === "demo-user-id-001";

  // 1. Fetch Habits List with matching UUID seeding
  const habitsQuery = useQuery({
    queryKey: ["habits", userId],
    queryFn: async (): Promise<Habit[]> => {
      if (isDemo) return INITIAL_HABITS;

      const localHabits = getLocalHabits(userId);

      const { data, error } = await (supabase.from("habits") as any)
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[SUPABASE_HABITS_FETCH_ERROR]", error);
        return localHabits;
      }

      if (!data || data.length === 0) {
        if (localHabits.length > 0) return localHabits;

        // Auto-seed starter habits into Supabase with matching UUIDs for foreign key validity
        const seedHabits = INITIAL_HABITS.map((h) => ({
          id: h.id,
          user_id: userId,
          name: h.name,
          icon: h.icon,
          frequency: h.frequency,
          reminder_time: h.reminder_time,
          is_active: true,
        }));

        const { data: inserted, error: insertErr } = await (supabase.from("habits") as any)
          .upsert(seedHabits, { onConflict: "id" })
          .select();

        if (insertErr) {
          console.error("[SUPABASE_SEED_HABITS_ERROR]", insertErr);
        }

        if (!insertErr && inserted && inserted.length > 0) {
          saveLocalHabits(userId, inserted as Habit[]);
          return inserted as Habit[];
        }

        saveLocalHabits(userId, INITIAL_HABITS.map(h => ({ ...h, user_id: userId })));
        return INITIAL_HABITS.map(h => ({ ...h, user_id: userId }));
      }

      saveLocalHabits(userId, data as Habit[]);
      return data as Habit[];
    },
    enabled: !!userId,
  });

  // 2. Fetch Habit Logs
  const habitLogsQuery = useQuery({
    queryKey: ["habit_logs", userId],
    queryFn: async (): Promise<HabitLog[]> => {
      if (isDemo) return DEMO_LOGS;

      const localLogs = getLocalLogs(userId);

      const { data, error } = await (supabase.from("habit_logs") as any)
        .select("*")
        .eq("user_id", userId);

      if (error) {
        console.error("[SUPABASE_HABIT_LOGS_FETCH_ERROR]", error);
        return localLogs;
      }

      const logs = (data as HabitLog[]) || [];
      // Combine Supabase logs and local logs to prevent missing logs
      const combinedMap = new Map<string, HabitLog>();
      [...localLogs, ...logs].forEach((l) => combinedMap.set(`${l.habit_id}_${l.completed_on}`, l));
      const combined = Array.from(combinedMap.values());

      saveLocalLogs(userId, combined);
      return combined;
    },
    enabled: !!userId,
  });

  // 3. Toggle Habit Log (Optimistic UI + foreign key valid DB insert)
  const toggleHabitMutation = useMutation({
    mutationFn: async ({ habitId, dateStr = getTodayStr() }: { habitId: string; dateStr?: string }) => {
      const currentLogs = habitLogsQuery.data || (isDemo ? DEMO_LOGS : getLocalLogs(userId));
      const existing = currentLogs.find(
        (l) => l.habit_id === habitId && l.completed_on === dateStr
      );

      if (existing) {
        // Delete log
        const updatedLogs = currentLogs.filter((l) => l.id !== existing.id);
        if (!isDemo) {
          saveLocalLogs(userId, updatedLogs);
          const { error } = await (supabase.from("habit_logs") as any).delete().eq("id", existing.id);
          if (error) console.error("[SUPABASE_DELETE_HABIT_LOG_ERROR]", error);
        }
        return { action: "deleted", logs: updatedLogs };
      } else {
        // Create log
        const newLog: HabitLog = {
          id: crypto.randomUUID(),
          habit_id: habitId,
          user_id: userId,
          completed_on: dateStr,
          created_at: new Date().toISOString(),
        };

        const updatedLogs = [newLog, ...currentLogs];

        if (!isDemo) {
          saveLocalLogs(userId, updatedLogs);

          // Ensure habit exists in Supabase table before creating log
          const targetHabit = (habitsQuery.data || []).find((h) => h.id === habitId);
          if (targetHabit) {
            await (supabase.from("habits") as any)
              .upsert([{
                id: targetHabit.id,
                user_id: userId,
                name: targetHabit.name,
                icon: targetHabit.icon,
                frequency: targetHabit.frequency,
                reminder_time: targetHabit.reminder_time,
                is_active: true,
              }], { onConflict: "id" });
          }

          const { data, error } = await (supabase.from("habit_logs") as any)
            .insert({ user_id: userId, habit_id: habitId, completed_on: dateStr })
            .select()
            .single();

          if (error) {
            console.error("[SUPABASE_INSERT_HABIT_LOG_ERROR]", error);
          } else {
            await (supabase as any).rpc("update_streak", { p_user_id: userId, p_category: "habits" });
            if (data) {
              const finalLogs = [data as HabitLog, ...currentLogs.filter(l => l.id !== newLog.id)];
              saveLocalLogs(userId, finalLogs);
              return { action: "created", logs: finalLogs };
            }
          }
        }

        return { action: "created", logs: updatedLogs };
      }
    },
    onMutate: async ({ habitId, dateStr = getTodayStr() }) => {
      await queryClient.cancelQueries({ queryKey: ["habit_logs", userId] });
      const previousLogs = habitLogsQuery.data || [];

      const existing = previousLogs.find(
        (l) => l.habit_id === habitId && l.completed_on === dateStr
      );

      let nextLogs: HabitLog[];
      if (existing) {
        nextLogs = previousLogs.filter((l) => l.id !== existing.id);
      } else {
        const tempLog: HabitLog = {
          id: crypto.randomUUID(),
          habit_id: habitId,
          user_id: userId,
          completed_on: dateStr,
          created_at: new Date().toISOString(),
        };
        nextLogs = [tempLog, ...previousLogs];
      }

      queryClient.setQueryData(["habit_logs", userId], nextLogs);
      saveLocalLogs(userId, nextLogs);
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
    },
  });

  // 4. Create Habit
  const createHabitMutation = useMutation({
    mutationFn: async (habitData: { name: string; frequency?: "daily" | "weekly"; reminder_time?: string }) => {
      const generatedId = crypto.randomUUID();
      const newHabit: Habit = {
        id: generatedId,
        user_id: userId,
        name: habitData.name,
        icon: "activity",
        frequency: habitData.frequency || "daily",
        reminder_time: habitData.reminder_time || "09:00",
        is_active: true,
        created_at: new Date().toISOString(),
      };

      if (!isDemo) {
        const { data, error } = await (supabase.from("habits") as any)
          .insert({
            id: generatedId,
            user_id: userId,
            name: habitData.name,
            frequency: habitData.frequency || "daily",
            reminder_time: habitData.reminder_time || "09:00",
            is_active: true,
          })
          .select()
          .single();

        if (error) {
          console.error("[SUPABASE_CREATE_HABIT_ERROR]", error);
        } else if (data) {
          const currentHabits = habitsQuery.data || [];
          saveLocalHabits(userId, [data as Habit, ...currentHabits]);
          return data as Habit;
        }
      }

      const currentHabits = habitsQuery.data || [];
      saveLocalHabits(userId, [newHabit, ...currentHabits]);
      return newHabit;
    },
    onSuccess: (newHabit) => {
      queryClient.setQueryData<Habit[]>(["habits", userId], (old) => [newHabit, ...(old || [])]);
    },
  });

  return {
    habits: habitsQuery.data || (isDemo ? INITIAL_HABITS : getLocalHabits(userId)),
    habitLogs: habitLogsQuery.data || (isDemo ? DEMO_LOGS : getLocalLogs(userId)),
    isLoading: habitsQuery.isLoading || habitLogsQuery.isLoading,
    toggleHabit: toggleHabitMutation.mutateAsync,
    createHabit: createHabitMutation.mutateAsync,
  };
}

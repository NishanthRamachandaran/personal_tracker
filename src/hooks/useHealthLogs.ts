import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { HealthLog } from "@/types/database";

const getTodayStr = () => new Date().toISOString().split("T")[0];
const DEMO_USER_ID = "demo-user-id-001";

const INITIAL_HEALTH_LOGS: HealthLog[] = [
  { id: "hlog-1", user_id: DEMO_USER_ID, logged_on: getTodayStr(), water_glasses: 8, sleep_hours: 8.0, workout_minutes: 45, workout_type: "HIIT & Cardio", created_at: new Date().toISOString() },
  { id: "hlog-2", user_id: DEMO_USER_ID, logged_on: new Date(Date.now() - 86400000).toISOString().split("T")[0], water_glasses: 7, sleep_hours: 7.5, workout_minutes: 30, workout_type: "Yoga Stretch", created_at: new Date().toISOString() },
];

export function useHealthLogs(userId: string) {
  const queryClient = useQueryClient();
  const isDemo = !userId || userId === DEMO_USER_ID;

  const healthQuery = useQuery({
    queryKey: ["health_logs", userId],
    queryFn: async (): Promise<HealthLog[]> => {
      if (isDemo) return INITIAL_HEALTH_LOGS;

      const { data, error } = await (supabase.from("health_logs") as any)
        .select("*")
        .eq("user_id", userId)
        .order("logged_on", { ascending: false });

      if (error || !data) return [];
      return data as HealthLog[];
    },
  });

  const upsertHealthLogMutation = useMutation({
    mutationFn: async ({ waterGlasses, sleepHours, workoutMinutes, workoutType, dateStr = getTodayStr() }: { waterGlasses: number; sleepHours: number; workoutMinutes: number; workoutType?: string; dateStr?: string }) => {
      if (!isDemo) {
        const { data, error } = await (supabase.from("health_logs") as any)
          .upsert(
            { user_id: userId, logged_on: dateStr, water_glasses: waterGlasses, sleep_hours: sleepHours, workout_minutes: workoutMinutes, workout_type: workoutType },
            { onConflict: "user_id,logged_on" }
          )
          .select()
          .single();

        await (supabase as any).rpc("update_streak", { p_user_id: userId, p_category: "health" });
        if (!error && data) return data as HealthLog;
      }

      const fallback: HealthLog = {
        id: "hlog-" + Date.now(),
        user_id: userId,
        logged_on: dateStr,
        water_glasses: waterGlasses,
        sleep_hours: sleepHours,
        workout_minutes: workoutMinutes,
        workout_type: workoutType || null,
        created_at: new Date().toISOString(),
      };
      return fallback;
    },
    onSuccess: (newLog) => {
      queryClient.setQueryData<HealthLog[]>(["health_logs", userId], (old) => {
        const filtered = (old || []).filter((h) => h.logged_on !== newLog.logged_on);
        return [newLog, ...filtered];
      });
      queryClient.invalidateQueries({ queryKey: ["streaks", userId] });
    },
  });

  return {
    healthLogs: healthQuery.data || (isDemo ? INITIAL_HEALTH_LOGS : []),
    isLoading: healthQuery.isLoading,
    upsertHealthLog: upsertHealthLogMutation.mutateAsync,
  };
}

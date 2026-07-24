import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { HealthLog } from "@/types/database";

const getTodayStr = () => new Date().toISOString().split("T")[0];
const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

const INITIAL_HEALTH_LOGS: HealthLog[] = [
  { id: "h1111111-1111-4111-8111-111111111111", user_id: DEMO_USER_ID, logged_on: getTodayStr(), water_glasses: 8, sleep_hours: 8.0, workout_minutes: 45, workout_type: "HIIT & Cardio", created_at: new Date().toISOString() },
  { id: "h2222222-2222-4222-8222-222222222222", user_id: DEMO_USER_ID, logged_on: new Date(Date.now() - 86400000).toISOString().split("T")[0], water_glasses: 7, sleep_hours: 7.5, workout_minutes: 30, workout_type: "Yoga Stretch", created_at: new Date().toISOString() },
];

function getLocalHealthLogs(userId: string): HealthLog[] {
  try {
    const raw = localStorage.getItem(`pulse_health_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalHealthLogs(userId: string, logs: HealthLog[]) {
  try {
    localStorage.setItem(`pulse_health_${userId}`, JSON.stringify(logs));
  } catch (e) {
    console.error("Failed to save local health logs", e);
  }
}

export function useHealthLogs(userId: string) {
  const queryClient = useQueryClient();
  const isDemo = !userId || userId === DEMO_USER_ID || userId === "demo-user-id-001";

  const healthQuery = useQuery({
    queryKey: ["health_logs", userId],
    queryFn: async (): Promise<HealthLog[]> => {
      if (isDemo) return INITIAL_HEALTH_LOGS;

      const localLogs = getLocalHealthLogs(userId);

      const { data, error } = await (supabase.from("health_logs") as any)
        .select("*")
        .eq("user_id", userId)
        .order("logged_on", { ascending: false });

      if (error) {
        console.error("[SUPABASE_HEALTH_FETCH_ERROR]", error);
        return localLogs;
      }

      const logs = (data as HealthLog[]) || [];
      const combinedMap = new Map<string, HealthLog>();
      [...localLogs, ...logs].forEach((h) => combinedMap.set(h.logged_on, h));
      const combined = Array.from(combinedMap.values());

      saveLocalHealthLogs(userId, combined);
      return combined;
    },
    enabled: !!userId,
  });

  const upsertHealthLogMutation = useMutation({
    mutationFn: async ({ waterGlasses, sleepHours, workoutMinutes, workoutType, dateStr = getTodayStr() }: { waterGlasses: number; sleepHours: number; workoutMinutes: number; workoutType?: string; dateStr?: string }) => {
      const newLogId = crypto.randomUUID();
      const fallback: HealthLog = {
        id: newLogId,
        user_id: userId,
        logged_on: dateStr,
        water_glasses: waterGlasses,
        sleep_hours: sleepHours,
        workout_minutes: workoutMinutes,
        workout_type: workoutType || null,
        created_at: new Date().toISOString(),
      };

      const currentLogs = healthQuery.data || (isDemo ? INITIAL_HEALTH_LOGS : getLocalHealthLogs(userId));
      const updatedLogs = [fallback, ...currentLogs.filter(h => h.logged_on !== dateStr)];

      if (!isDemo) {
        saveLocalHealthLogs(userId, updatedLogs);
        const { data, error } = await (supabase.from("health_logs") as any)
          .upsert(
            { user_id: userId, logged_on: dateStr, water_glasses: waterGlasses, sleep_hours: sleepHours, workout_minutes: workoutMinutes, workout_type: workoutType },
            { onConflict: "user_id,logged_on" }
          )
          .select()
          .single();

        if (error) {
          console.error("[SUPABASE_HEALTH_UPSERT_ERROR]", error);
        } else {
          await (supabase as any).rpc("update_streak", { p_user_id: userId, p_category: "health" });
          if (data) {
            const finalLogs = [data as HealthLog, ...currentLogs.filter(h => h.logged_on !== dateStr)];
            saveLocalHealthLogs(userId, finalLogs);
            return data as HealthLog;
          }
        }
      }

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
    healthLogs: healthQuery.data || (isDemo ? INITIAL_HEALTH_LOGS : getLocalHealthLogs(userId)),
    isLoading: healthQuery.isLoading,
    upsertHealthLog: upsertHealthLogMutation.mutateAsync,
  };
}

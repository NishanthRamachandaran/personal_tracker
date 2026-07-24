import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { MoodLog } from "@/types/database";

const getTodayStr = () => new Date().toISOString().split("T")[0];
const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

const INITIAL_MOOD_LOGS: MoodLog[] = [
  { id: "m1111111-1111-4111-8111-111111111111", user_id: DEMO_USER_ID, mood_score: 5, tags: ["Workout", "Focus", "Creative"], journal_note: "Felt super energized during morning deep work!", logged_on: getTodayStr(), created_at: new Date().toISOString() },
  { id: "m2222222-2222-4222-8222-222222222222", user_id: DEMO_USER_ID, mood_score: 4, tags: ["Calm", "Friends"], journal_note: "Nice dinner with close friends.", logged_on: new Date(Date.now() - 86400000).toISOString().split("T")[0], created_at: new Date().toISOString() },
];

function getLocalMoodLogs(userId: string): MoodLog[] {
  try {
    const raw = localStorage.getItem(`pulse_mood_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMoodLogs(userId: string, logs: MoodLog[]) {
  try {
    localStorage.setItem(`pulse_mood_${userId}`, JSON.stringify(logs));
  } catch (e) {
    console.error("Failed to save local mood logs", e);
  }
}

export function useMoodLogs(userId: string) {
  const queryClient = useQueryClient();
  const isDemo = !userId || userId === DEMO_USER_ID || userId === "demo-user-id-001";

  const moodQuery = useQuery({
    queryKey: ["mood_logs", userId],
    queryFn: async (): Promise<MoodLog[]> => {
      if (isDemo) return INITIAL_MOOD_LOGS;

      const localLogs = getLocalMoodLogs(userId);

      const { data, error } = await (supabase.from("mood_logs") as any)
        .select("*")
        .eq("user_id", userId)
        .order("logged_on", { ascending: false });

      if (error) {
        console.error("[SUPABASE_MOOD_FETCH_ERROR]", error);
        return localLogs;
      }

      const logs = (data as MoodLog[]) || [];
      const combinedMap = new Map<string, MoodLog>();
      [...localLogs, ...logs].forEach((m) => combinedMap.set(m.logged_on, m));
      const combined = Array.from(combinedMap.values());

      saveLocalMoodLogs(userId, combined);
      return combined;
    },
    enabled: !!userId,
  });

  const addMoodLogMutation = useMutation({
    mutationFn: async ({ moodScore, tags, journalNote, dateStr = getTodayStr() }: { moodScore: number; tags?: string[]; journalNote?: string; dateStr?: string }) => {
      const newLogId = crypto.randomUUID();
      const fallback: MoodLog = {
        id: newLogId,
        user_id: userId,
        mood_score: moodScore as any,
        tags: tags || null,
        journal_note: journalNote || null,
        logged_on: dateStr,
        created_at: new Date().toISOString(),
      };

      const currentLogs = moodQuery.data || (isDemo ? INITIAL_MOOD_LOGS : getLocalMoodLogs(userId));
      const updatedLogs = [fallback, ...currentLogs.filter(m => m.logged_on !== dateStr)];

      if (!isDemo) {
        saveLocalMoodLogs(userId, updatedLogs);
        const { data, error } = await (supabase.from("mood_logs") as any)
          .insert({ id: newLogId, user_id: userId, mood_score: moodScore, tags, journal_note: journalNote, logged_on: dateStr })
          .select()
          .single();

        if (error) {
          console.error("[SUPABASE_ADD_MOOD_ERROR]", error);
        } else {
          await (supabase as any).rpc("update_streak", { p_user_id: userId, p_category: "mood" });
          if (data) {
            const finalLogs = [data as MoodLog, ...currentLogs.filter(m => m.logged_on !== dateStr)];
            saveLocalMoodLogs(userId, finalLogs);
            return data as MoodLog;
          }
        }
      }

      return fallback;
    },
    onSuccess: (newLog) => {
      queryClient.setQueryData<MoodLog[]>(["mood_logs", userId], (old) => {
        const filtered = (old || []).filter((m) => m.logged_on !== newLog.logged_on);
        return [newLog, ...filtered];
      });
      queryClient.invalidateQueries({ queryKey: ["streaks", userId] });
    },
  });

  return {
    moodLogs: moodQuery.data || (isDemo ? INITIAL_MOOD_LOGS : getLocalMoodLogs(userId)),
    isLoading: moodQuery.isLoading,
    addMoodLog: addMoodLogMutation.mutateAsync,
  };
}

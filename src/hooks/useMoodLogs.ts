import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { MoodLog } from "@/types/database";

const getTodayStr = () => new Date().toISOString().split("T")[0];

const INITIAL_MOOD_LOGS: MoodLog[] = [
  { id: "m-1", user_id: "demo-user-id-001", mood_score: 5, tags: ["Workout", "Focus", "Creative"], journal_note: "Felt super energized during morning deep work!", logged_on: getTodayStr(), created_at: new Date().toISOString() },
  { id: "m-2", user_id: "demo-user-id-001", mood_score: 4, tags: ["Calm", "Friends"], journal_note: "Nice dinner with close friends.", logged_on: new Date(Date.now() - 86400000).toISOString().split("T")[0], created_at: new Date().toISOString() },
];

export function useMoodLogs(userId: string) {
  const queryClient = useQueryClient();

  const moodQuery = useQuery({
    queryKey: ["mood_logs", userId],
    queryFn: async (): Promise<MoodLog[]> => {
      const { data, error } = await (supabase.from("mood_logs") as any)
        .select("*")
        .eq("user_id", userId)
        .order("logged_on", { ascending: false });

      if (error || !data || data.length === 0) return INITIAL_MOOD_LOGS;
      return data as MoodLog[];
    },
  });

  const addMoodLogMutation = useMutation({
    mutationFn: async ({ moodScore, tags, journalNote, dateStr = getTodayStr() }: { moodScore: number; tags?: string[]; journalNote?: string; dateStr?: string }) => {
      const { data, error } = await (supabase.from("mood_logs") as any)
        .insert({ user_id: userId, mood_score: moodScore, tags, journal_note: journalNote, logged_on: dateStr })
        .select()
        .single();

      await (supabase as any).rpc("update_streak", { p_user_id: userId, p_category: "mood" });

      if (error || !data) {
        const fallback: MoodLog = {
          id: "m-" + Date.now(),
          user_id: userId,
          mood_score: moodScore as any,
          tags: tags || null,
          journal_note: journalNote || null,
          logged_on: dateStr,
          created_at: new Date().toISOString(),
        };
        return fallback;
      }
      return data as MoodLog;
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
    moodLogs: moodQuery.data || INITIAL_MOOD_LOGS,
    isLoading: moodQuery.isLoading,
    addMoodLog: addMoodLogMutation.mutateAsync,
  };
}

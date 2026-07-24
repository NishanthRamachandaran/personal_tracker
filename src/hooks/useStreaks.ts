import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Streak, Milestone } from "@/types/database";

const INITIAL_STREAKS: Streak[] = [
  { id: "s-1", user_id: "demo-user-id-001", category: "habits", current_streak: 5, longest_streak: 12, last_logged_on: new Date().toISOString().split("T")[0] },
  { id: "s-2", user_id: "demo-user-id-001", category: "expenses", current_streak: 3, longest_streak: 8, last_logged_on: new Date().toISOString().split("T")[0] },
  { id: "s-3", user_id: "demo-user-id-001", category: "mood", current_streak: 4, longest_streak: 10, last_logged_on: new Date().toISOString().split("T")[0] },
  { id: "s-4", user_id: "demo-user-id-001", category: "health", current_streak: 6, longest_streak: 14, last_logged_on: new Date().toISOString().split("T")[0] },
];

export function useStreaks(userId: string) {
  const streaksQuery = useQuery({
    queryKey: ["streaks", userId],
    queryFn: async (): Promise<Streak[]> => {
      const { data, error } = await (supabase.from("streaks") as any).select("*").eq("user_id", userId);
      if (error || !data || data.length === 0) return INITIAL_STREAKS;
      return data as Streak[];
    },
  });

  const milestonesQuery = useQuery({
    queryKey: ["milestones", userId],
    queryFn: async (): Promise<Milestone[]> => {
      const { data, error } = await (supabase.from("milestones") as any).select("*").eq("user_id", userId);
      if (error || !data) return [];
      return data as Milestone[];
    },
  });

  const activeStreakCount = (streaksQuery.data || INITIAL_STREAKS).reduce((max, s) => Math.max(max, s.current_streak), 0);

  return {
    streaks: streaksQuery.data || INITIAL_STREAKS,
    milestones: milestonesQuery.data || [],
    activeStreakCount,
    isLoading: streaksQuery.isLoading,
  };
}

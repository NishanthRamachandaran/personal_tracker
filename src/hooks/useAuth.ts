import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/types/database";

const DEMO_USER_ID = "demo-user-id-001";
const DEFAULT_DEMO_PROFILE: Profile = {
  id: DEMO_USER_ID,
  full_name: "Alex Vance",
  avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  active_categories: ["habits", "expenses", "mood", "health"],
  dark_mode: true,
  created_at: new Date().toISOString(),
};

export function useAuth() {
  const queryClient = useQueryClient();
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem("pulse_demo_mode") === "true";
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSessionUser(session.user);
        setIsDemoMode(false);
        localStorage.setItem("pulse_demo_mode", "false");
      }
      setIsAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionUser(session.user);
        setIsDemoMode(false);
        localStorage.setItem("pulse_demo_mode", "false");
      } else if (!localStorage.getItem("pulse_demo_mode") || localStorage.getItem("pulse_demo_mode") === "false") {
        setSessionUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const userId = sessionUser?.id || (isDemoMode ? DEMO_USER_ID : null);

  // Fetch User Profile from Supabase with auto-upsert
  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    queryFn: async (): Promise<Profile> => {
      if (!sessionUser) {
        const customName = localStorage.getItem("pulse_user_name") || "Alex Vance";
        return {
          ...DEFAULT_DEMO_PROFILE,
          full_name: customName,
        };
      }

      const userEmail = sessionUser.email || "User";
      const userName = sessionUser.user_metadata?.full_name || userEmail.split("@")[0];
      const avatarUrl = sessionUser.user_metadata?.avatar_url || null;

      // Upsert profile row in Supabase database
      const { data, error } = await (supabase.from("profiles") as any)
        .upsert(
          {
            id: sessionUser.id,
            full_name: userName,
            avatar_url: avatarUrl,
          },
          { onConflict: "id", ignoreDuplicates: true }
        )
        .select()
        .single();

      if (error || !data) {
        // Fallback fetch if upsert ignored
        const { data: fetchedData } = await (supabase.from("profiles") as any)
          .select("*")
          .eq("id", sessionUser.id)
          .single();

        if (fetchedData) return fetchedData as Profile;

        return {
          id: sessionUser.id,
          full_name: userName,
          avatar_url: avatarUrl,
          active_categories: ["habits", "expenses", "mood", "health"],
          dark_mode: true,
          created_at: new Date().toISOString(),
        };
      }

      return data as Profile;
    },
    enabled: isAuthReady && !!userId,
  });

  // Update active categories with persistent upsert
  const updateCategoriesMutation = useMutation({
    mutationFn: async (categories: ("habits" | "expenses" | "mood" | "health")[]) => {
      if (!sessionUser) {
        DEFAULT_DEMO_PROFILE.active_categories = categories;
        return { ...DEFAULT_DEMO_PROFILE, active_categories: categories };
      }

      const { data, error } = await (supabase.from("profiles") as any)
        .upsert(
          {
            id: sessionUser.id,
            active_categories: categories,
          },
          { onConflict: "id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["profile", userId], updatedProfile);
    },
  });

  // Sign Up / Login helpers
  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw error;

    localStorage.setItem("pulse_user_name", fullName);
    localStorage.setItem("pulse_user_email", email);
    setIsDemoMode(false);
    localStorage.setItem("pulse_demo_mode", "false");
    return data;
  };

  const signInWithEmail = async (email: string, password?: string) => {
    if (password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setIsDemoMode(false);
      localStorage.setItem("pulse_demo_mode", "false");
      return data;
    } else {
      const { data, error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      return data;
    }
  };

  // Force Google to prompt account selector every time
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    if (error) throw error;
  };

  const enableDemoMode = (customName?: string, customEmail?: string) => {
    if (customName) localStorage.setItem("pulse_user_name", customName);
    if (customEmail) localStorage.setItem("pulse_user_email", customEmail);
    setIsDemoMode(true);
    localStorage.setItem("pulse_demo_mode", "true");
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setIsDemoMode(false);
    localStorage.removeItem("pulse_demo_mode");
    queryClient.clear();
  };

  const deleteAccount = async () => {
    if (sessionUser) {
      await (supabase.from("profiles") as any).delete().eq("id", sessionUser.id);
      await supabase.auth.signOut();
    }
    setSessionUser(null);
    setIsDemoMode(false);
    localStorage.removeItem("pulse_demo_mode");
    localStorage.removeItem("pulse_user_name");
    localStorage.removeItem("pulse_user_email");
    queryClient.clear();
  };

  const currentUser = sessionUser
    ? { id: sessionUser.id, email: sessionUser.email }
    : isDemoMode
    ? { id: DEMO_USER_ID, email: localStorage.getItem("pulse_user_email") || "alex@pulse.app" }
    : null;

  return {
    user: currentUser,
    profile: profileQuery.data || (isDemoMode ? DEFAULT_DEMO_PROFILE : null),
    isAuthenticated: !!sessionUser || isDemoMode,
    isLoadingProfile: profileQuery.isLoading,
    updateCategories: updateCategoriesMutation.mutate,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    enableDemoMode,
    signOut,
    deleteAccount,
    isAuthReady,
  };
}

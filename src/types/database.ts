export type CategoryType = "habits" | "expenses" | "mood" | "health";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  active_categories: CategoryType[];
  dark_mode: boolean;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  frequency: "daily" | "weekly";
  reminder_time: string | null;
  is_active: boolean;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_on: string; // YYYY-MM-DD
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  note: string | null;
  spent_on: string; // YYYY-MM-DD
  created_at: string;
  expense_categories?: ExpenseCategory | null;
}

export interface MoodLog {
  id: string;
  user_id: string;
  mood_score: 1 | 2 | 3 | 4 | 5;
  tags: string[] | null;
  journal_note: string | null;
  logged_on: string; // YYYY-MM-DD
  created_at: string;
}

export interface HealthLog {
  id: string;
  user_id: string;
  logged_on: string; // YYYY-MM-DD
  water_glasses: number;
  sleep_hours: number;
  workout_minutes: number;
  workout_type: string | null;
  created_at: string;
}

export interface Streak {
  id: string;
  user_id: string;
  category: CategoryType;
  current_streak: number;
  longest_streak: number;
  last_logged_on: string | null;
}

export interface Milestone {
  id: string;
  user_id: string;
  category: CategoryType;
  milestone_type: string; // '7_day_streak', '30_day_streak', '100_day_streak'
  achieved_on: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      habits: { Row: Habit; Insert: Partial<Habit>; Update: Partial<Habit> };
      habit_logs: { Row: HabitLog; Insert: Partial<HabitLog>; Update: Partial<HabitLog> };
      expense_categories: { Row: ExpenseCategory; Insert: Partial<ExpenseCategory>; Update: Partial<ExpenseCategory> };
      expenses: { Row: Expense; Insert: Partial<Expense>; Update: Partial<Expense> };
      mood_logs: { Row: MoodLog; Insert: Partial<MoodLog>; Update: Partial<MoodLog> };
      health_logs: { Row: HealthLog; Insert: Partial<HealthLog>; Update: Partial<HealthLog> };
      streaks: { Row: Streak; Insert: Partial<Streak>; Update: Partial<Streak> };
      milestones: { Row: Milestone; Insert: Partial<Milestone>; Update: Partial<Milestone> };
    };
  };
}

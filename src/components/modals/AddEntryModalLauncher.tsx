import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useUIStore } from "@/store/useUIStore";
import { useAuth } from "@/hooks/useAuth";
import { useHabits } from "@/hooks/useHabits";
import { useExpenses } from "@/hooks/useExpenses";
import { useMoodLogs } from "@/hooks/useMoodLogs";
import { useHealthLogs } from "@/hooks/useHealthLogs";
import { HabitForm } from "@/components/entry-forms/HabitForm";
import { ExpenseForm } from "@/components/entry-forms/ExpenseForm";
import { MoodForm } from "@/components/entry-forms/MoodForm";
import { HealthForm } from "@/components/entry-forms/HealthForm";
import { Activity, CreditCard, Smile, HeartPulse } from "lucide-react";
import { CategoryType } from "@/types/database";

export const AddEntryModalLauncher: React.FC = () => {
  const { isAddModalOpen, closeAddModal, selectedAddCategory } = useUIStore();
  const { user } = useAuth();
  const userId = user?.id || "";

  const [activeTab, setActiveTab] = useState<CategoryType>(selectedAddCategory);

  useEffect(() => {
    if (selectedAddCategory) setActiveTab(selectedAddCategory);
  }, [selectedAddCategory]);

  const { createHabit } = useHabits(userId);
  const { categories, addExpense } = useExpenses(userId);
  const { addMoodLog } = useMoodLogs(userId);
  const { upsertHealthLog } = useHealthLogs(userId);

  const handleCreateHabit = async (data: { name: string; frequency?: "daily" | "weekly"; reminder_time?: string }) => {
    await createHabit({ name: data.name, frequency: data.frequency, reminder_time: data.reminder_time });
    closeAddModal();
  };

  const handleCreateExpense = async (data: { amount: number; category_id: string; note?: string; spent_on: string }) => {
    await addExpense({ amount: data.amount, categoryId: data.category_id, note: data.note, dateStr: data.spent_on });
    closeAddModal();
  };

  const handleCreateMood = async (data: { mood_score: number; tags: string[]; journal_note?: string; logged_on: string }) => {
    await addMoodLog({ moodScore: data.mood_score as any, tags: data.tags, journalNote: data.journal_note, dateStr: data.logged_on });
    closeAddModal();
  };

  const handleCreateHealth = async (data: { water_glasses: number; sleep_hours: number; workout_minutes: number; workout_type?: string; logged_on: string }) => {
    await upsertHealthLog({ waterGlasses: data.water_glasses, sleepHours: data.sleep_hours, workoutMinutes: data.workout_minutes, workoutType: data.workout_type, dateStr: data.logged_on });
    closeAddModal();
  };

  return (
    <Modal isOpen={isAddModalOpen} onClose={closeAddModal} title="Quick Add Entry">
      {/* Category Tab Switcher */}
      <div className="grid grid-cols-4 gap-2 mb-6 p-1 bg-surface-level2 rounded-2xl border border-white/5">
        <button
          onClick={() => setActiveTab("habits")}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "habits"
              ? "bg-habit/20 text-habit border border-habit/40 shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Habit
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "expenses"
              ? "bg-expense/20 text-expense border border-expense/40 shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" /> Expense
        </button>
        <button
          onClick={() => setActiveTab("mood")}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "mood"
              ? "bg-mood/20 text-mood border border-mood/40 shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Smile className="w-3.5 h-3.5" /> Mood
        </button>
        <button
          onClick={() => setActiveTab("health")}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "health"
              ? "bg-health/20 text-health border border-health/40 shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <HeartPulse className="w-3.5 h-3.5" /> Health
        </button>
      </div>

      {activeTab === "habits" && <HabitForm onSubmit={handleCreateHabit} onCancel={closeAddModal} />}
      {activeTab === "expenses" && <ExpenseForm categories={categories} onSubmit={handleCreateExpense} onCancel={closeAddModal} />}
      {activeTab === "mood" && <MoodForm onSubmit={handleCreateMood} onCancel={closeAddModal} />}
      {activeTab === "health" && <HealthForm onSubmit={handleCreateHealth} onCancel={closeAddModal} />}
    </Modal>
  );
};

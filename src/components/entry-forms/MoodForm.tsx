import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { moodValidationSchema } from "@/lib/validationSchemas";
import { z } from "zod";
import { Button } from "@/components/ui/Button";

type MoodFormData = z.infer<typeof moodValidationSchema>;

interface MoodFormProps {
  onSubmit: (data: MoodFormData & { tags: string[] }) => Promise<void>;
  onCancel?: () => void;
}

export const MoodForm: React.FC<MoodFormProps> = ({ onSubmit, onCancel }) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedTags, setSelectedTags] = useState<string[]>(["Focus", "Calm"]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MoodFormData>({
    resolver: zodResolver(moodValidationSchema),
    defaultValues: {
      mood_score: 4,
      journal_note: "",
      logged_on: todayStr,
    },
  });

  const selectedScore = watch("mood_score");

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleFormSubmit = async (data: MoodFormData) => {
    await onSubmit({ ...data, tags: selectedTags });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-on-surface-variant mb-2">
          How are you feeling today?
        </label>
        <div className="grid grid-cols-5 gap-2">
          {[
            { score: 1, emoji: "😫", label: "Terrible" },
            { score: 2, emoji: "🙁", label: "Bad" },
            { score: 3, emoji: "😐", label: "Okay" },
            { score: 4, emoji: "😊", label: "Good" },
            { score: 5, emoji: "🤩", label: "Great" },
          ].map((item) => (
            <button
              key={item.score}
              type="button"
              onClick={() => setValue("mood_score", item.score)}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                selectedScore === item.score
                  ? "bg-mood/20 border-mood scale-105 shadow-glow-mood"
                  : "bg-surface-level2 border-outline/30 opacity-70 hover:opacity-100"
              }`}
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-[10px] font-semibold text-on-surface">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-on-surface-variant mb-2">
          Driver Tags & Factors
        </label>
        <div className="flex flex-wrap gap-2">
          {["Work", "Workout", "Calm", "Family", "Friends", "Focus", "Creative", "Sleep", "Nature"].map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  isSelected
                    ? "bg-mood/20 border-mood text-mood"
                    : "bg-surface-level2 border-outline/30 text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {isSelected ? "✓ " : ""}{tag}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-on-surface-variant mb-1">
          Journal Note / Reflections
        </label>
        <textarea
          rows={3}
          placeholder="What made today feel this way?"
          {...register("journal_note")}
          className="w-full p-3 rounded-xl bg-surface-level2 border border-outline/40 text-xs text-on-surface focus:outline-none focus:border-mood resize-none placeholder:text-on-surface-variant/50"
        />
        {errors.journal_note && (
          <p className="text-xs text-mood mt-1">{errors.journal_note.message}</p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" variant="mood" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Saving..." : "Save Mood Log"}
        </Button>
      </div>
    </form>
  );
};

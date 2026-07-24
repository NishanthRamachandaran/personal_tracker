import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { habitValidationSchema } from "@/lib/validationSchemas";
import { z } from "zod";
import { Button } from "@/components/ui/Button";

type HabitFormData = z.infer<typeof habitValidationSchema>;

interface HabitFormProps {
  onSubmit: (data: HabitFormData) => Promise<void>;
  onCancel?: () => void;
}

export const HabitForm: React.FC<HabitFormProps> = ({ onSubmit, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<HabitFormData>({
    resolver: zodResolver(habitValidationSchema),
    defaultValues: {
      frequency: "daily",
      reminder_time: "08:00",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
          Habit Name
        </label>
        <input
          type="text"
          placeholder="e.g. 10k Daily Steps Walk"
          {...register("name")}
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-level2 border border-outline/40 text-sm text-on-surface focus:outline-none focus:border-habit placeholder:text-on-surface-variant/50"
        />
        {errors.name && (
          <p className="text-xs text-mood mt-1">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
            Frequency
          </label>
          <select
            {...register("frequency")}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-level2 border border-outline/40 text-xs text-on-surface focus:outline-none"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
            Reminder Time
          </label>
          <input
            type="time"
            {...register("reminder_time")}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-level2 border border-outline/40 text-xs text-on-surface focus:outline-none"
          />
          {errors.reminder_time && (
            <p className="text-xs text-mood mt-1">{errors.reminder_time.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" variant="habit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Saving..." : "Create Habit"}
        </Button>
      </div>
    </form>
  );
};

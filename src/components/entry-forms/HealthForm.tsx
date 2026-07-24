import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { healthValidationSchema } from "@/lib/validationSchemas";
import { z } from "zod";
import { Button } from "@/components/ui/Button";

type HealthFormData = z.infer<typeof healthValidationSchema>;

interface HealthFormProps {
  onSubmit: (data: HealthFormData) => Promise<void>;
  onCancel?: () => void;
}

export const HealthForm: React.FC<HealthFormProps> = ({ onSubmit, onCancel }) => {
  const todayStr = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<HealthFormData>({
    resolver: zodResolver(healthValidationSchema),
    defaultValues: {
      water_glasses: 8,
      sleep_hours: 7.5,
      workout_minutes: 45,
      workout_type: "Cardio & HIIT",
      logged_on: todayStr,
    },
  });

  const waterGlasses = watch("water_glasses");
  const sleepHours = watch("sleep_hours");
  const workoutMins = watch("workout_minutes");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Water Hydration */}
      <div className="p-4 rounded-2xl bg-surface-level2 border border-outline/30 space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-on-surface flex items-center gap-1.5">💧 Water Hydration</span>
          <span className="text-health font-bold">{waterGlasses} Glasses ({(waterGlasses * 0.25).toFixed(1)}L)</span>
        </div>
        <input
          type="range"
          min="0"
          max="20"
          step="1"
          {...register("water_glasses")}
          className="w-full accent-health cursor-pointer"
        />
        {errors.water_glasses && (
          <p className="text-xs text-mood">{errors.water_glasses.message}</p>
        )}
      </div>

      {/* Sleep Duration */}
      <div className="p-4 rounded-2xl bg-surface-level2 border border-outline/30 space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-on-surface flex items-center gap-1.5">💤 Sleep Duration</span>
          <span className="text-health font-bold">{sleepHours} Hours</span>
        </div>
        <input
          type="range"
          min="0"
          max="14"
          step="0.5"
          {...register("sleep_hours")}
          className="w-full accent-health cursor-pointer"
        />
        {errors.sleep_hours && (
          <p className="text-xs text-mood">{errors.sleep_hours.message}</p>
        )}
      </div>

      {/* Workout Session */}
      <div className="p-4 rounded-2xl bg-surface-level2 border border-outline/30 space-y-3">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-on-surface flex items-center gap-1.5">🏃 Workout Session</span>
          <span className="text-health font-bold">{workoutMins} Minutes</span>
        </div>
        <input
          type="range"
          min="0"
          max="180"
          step="5"
          {...register("workout_minutes")}
          className="w-full accent-health cursor-pointer"
        />
        <input
          type="text"
          placeholder="Workout Type (e.g. HIIT, Running, Yoga)"
          {...register("workout_type")}
          className="w-full px-3 py-2 rounded-xl bg-surface border border-outline/40 text-xs text-on-surface focus:outline-none focus:border-health placeholder:text-on-surface-variant/50"
        />
        {errors.workout_type && (
          <p className="text-xs text-mood">{errors.workout_type.message}</p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" variant="health" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Saving..." : "Log Health Metrics"}
        </Button>
      </div>
    </form>
  );
};

import { z } from "zod";

// Strict Regex Patterns
const SAFE_TEXT_REGEX = /^[^<>&]*$/; // Rejects HTML tag angle brackets
const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

// 1. Auth Schemas
export const emailAuthSchema = z.object({
  email: z
    .string()
    .trim()
    .min(5, "Email must be at least 5 characters")
    .max(254, "Email length limit exceeded")
    .email("Please provide a valid email address")
    .transform((val) => val.toLowerCase()),
});

// 2. Habit Schema
export const habitValidationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Habit name must be at least 2 characters")
    .max(80, "Habit name cannot exceed 80 characters")
    .regex(SAFE_TEXT_REGEX, "Invalid characters in habit name"),
  frequency: z.enum(["daily", "weekly"]),
  reminder_time: z
    .string()
    .regex(TIME_24H_REGEX, "Time must be in 24-hour HH:MM format")
    .optional()
    .or(z.literal("")),
});

// 3. Expense Schema
export const expenseValidationSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Amount must be greater than $0.00")
    .max(1000000, "Amount exceeds maximum permitted limit ($1,000,000.00)")
    .refine((val) => Number(val.toFixed(2)) === val, "Maximum 2 decimal places allowed"),
  category_id: z.string().min(1, "Please select a valid expense category"),
  note: z
    .string()
    .trim()
    .max(250, "Note cannot exceed 250 characters")
    .regex(SAFE_TEXT_REGEX, "Invalid characters in note")
    .optional()
    .or(z.literal("")),
  spent_on: z
    .string()
    .min(10, "Date is required")
    .max(10, "Invalid date format"),
});

// 4. Mood Schema
export const moodValidationSchema = z.object({
  mood_score: z.coerce
    .number()
    .int("Mood score must be an integer")
    .min(1, "Score must be between 1 and 5")
    .max(5, "Score must be between 1 and 5"),
  tags: z
    .array(z.string().trim().max(30))
    .max(10, "Maximum 10 tags allowed")
    .optional(),
  journal_note: z
    .string()
    .trim()
    .max(1000, "Journal reflection cannot exceed 1000 characters")
    .regex(SAFE_TEXT_REGEX, "Invalid characters in journal note")
    .optional()
    .or(z.literal("")),
  logged_on: z
    .string()
    .min(10, "Date is required")
    .max(10, "Invalid date format"),
});

// 5. Health Schema
export const healthValidationSchema = z.object({
  water_glasses: z.coerce
    .number()
    .int("Water glasses must be an integer")
    .min(0, "Glasses cannot be negative")
    .max(30, "Water glasses exceeds daily safety limit"),
  sleep_hours: z.coerce
    .number()
    .min(0, "Sleep hours cannot be negative")
    .max(24, "Sleep hours cannot exceed 24 hours per day"),
  workout_minutes: z.coerce
    .number()
    .int("Workout minutes must be an integer")
    .min(0, "Workout duration cannot be negative")
    .max(300, "Workout duration exceeds 300 minutes limit"),
  workout_type: z
    .string()
    .trim()
    .max(60, "Workout type cannot exceed 60 characters")
    .regex(SAFE_TEXT_REGEX, "Invalid characters in workout type")
    .optional()
    .or(z.literal("")),
  logged_on: z
    .string()
    .min(10, "Date is required")
    .max(10, "Invalid date format"),
});

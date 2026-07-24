import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseValidationSchema } from "@/lib/validationSchemas";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { ExpenseCategory } from "@/types/database";
import { getStoredCurrency } from "@/utils/currencyFormatter";

type ExpenseFormData = z.infer<typeof expenseValidationSchema>;

interface ExpenseFormProps {
  categories: ExpenseCategory[];
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel?: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ categories, onSubmit, onCancel }) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const currency = getStoredCurrency();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseValidationSchema),
    defaultValues: {
      amount: 0,
      category_id: categories[0]?.id || "",
      note: "",
      spent_on: todayStr,
    },
  });

  const selectedCatId = watch("category_id");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-on-surface-variant mb-1">
          Amount ({currency.symbol} {currency.code})
        </label>
        <input
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register("amount")}
          className="w-full px-4 py-3 rounded-2xl bg-surface-level2 border border-expense/40 text-2xl font-extrabold text-expense focus:outline-none placeholder:text-on-surface-variant/40 text-center"
        />
        {errors.amount && (
          <p className="text-xs text-mood mt-1 text-center">{errors.amount.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-on-surface-variant mb-2">
          Category
        </label>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setValue("category_id", cat.id)}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                selectedCatId === cat.id
                  ? "bg-expense/20 border-expense text-expense"
                  : "bg-surface-level2 border-outline/30 text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        {errors.category_id && (
          <p className="text-xs text-mood mt-1">{errors.category_id.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
          Note / Merchant
        </label>
        <input
          type="text"
          placeholder="e.g. Starbucks Coffee"
          {...register("note")}
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-level2 border border-outline/40 text-xs text-on-surface focus:outline-none focus:border-expense placeholder:text-on-surface-variant/50"
        />
        {errors.note && (
          <p className="text-xs text-mood mt-1">{errors.note.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
          Date
        </label>
        <input
          type="date"
          {...register("spent_on")}
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-level2 border border-outline/40 text-xs text-on-surface focus:outline-none"
        />
        {errors.spent_on && (
          <p className="text-xs text-mood mt-1">{errors.spent_on.message}</p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" variant="expense" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Saving..." : "Log Expense"}
        </Button>
      </div>
    </form>
  );
};

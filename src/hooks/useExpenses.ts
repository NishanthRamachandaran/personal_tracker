import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Expense, ExpenseCategory } from "@/types/database";

const getTodayStr = () => new Date().toISOString().split("T")[0];

const INITIAL_CATEGORIES: ExpenseCategory[] = [
  { id: "cat-1", name: "Food", icon: "utensils" },
  { id: "cat-2", name: "Transport", icon: "car" },
  { id: "cat-3", name: "Shopping", icon: "shopping-bag" },
  { id: "cat-4", name: "Bills", icon: "receipt" },
  { id: "cat-5", name: "Entertainment", icon: "film" },
  { id: "cat-6", name: "Other", icon: "more-horizontal" },
];

const INITIAL_EXPENSES: Expense[] = [
  { id: "exp-1", user_id: "demo-user-id-001", category_id: "cat-1", amount: 14.50, note: "Artisanal Coffee & Muffin", spent_on: getTodayStr(), created_at: new Date().toISOString(), expense_categories: INITIAL_CATEGORIES[0] },
  { id: "exp-2", user_id: "demo-user-id-001", category_id: "cat-2", amount: 48.00, note: "Subway Pass", spent_on: getTodayStr(), created_at: new Date().toISOString(), expense_categories: INITIAL_CATEGORIES[1] },
  { id: "exp-3", user_id: "demo-user-id-001", category_id: "cat-3", amount: 89.99, note: "Wireless Ergonomic Mouse", spent_on: getTodayStr(), created_at: new Date().toISOString(), expense_categories: INITIAL_CATEGORIES[2] },
];

export function useExpenses(userId: string) {
  const queryClient = useQueryClient();

  // 1. Fetch Expense Categories
  const categoriesQuery = useQuery({
    queryKey: ["expense_categories"],
    queryFn: async (): Promise<ExpenseCategory[]> => {
      const { data, error } = await (supabase.from("expense_categories") as any).select("*");
      if (error || !data || data.length === 0) return INITIAL_CATEGORIES;
      return data as ExpenseCategory[];
    },
  });

  // 2. Fetch User Expenses
  const expensesQuery = useQuery({
    queryKey: ["expenses", userId],
    queryFn: async (): Promise<Expense[]> => {
      const { data, error } = await (supabase.from("expenses") as any)
        .select("*, expense_categories(*)")
        .eq("user_id", userId)
        .order("spent_on", { ascending: false });

      if (error || !data || data.length === 0) return INITIAL_EXPENSES;
      return data as Expense[];
    },
  });

  // 3. Add Expense Mutation
  const addExpenseMutation = useMutation({
    mutationFn: async ({ amount, categoryId, note, dateStr = getTodayStr() }: { amount: number; categoryId?: string; note?: string; dateStr?: string }) => {
      const { data, error } = await (supabase.from("expenses") as any)
        .insert({ user_id: userId, category_id: categoryId, amount, note, spent_on: dateStr })
        .select("*, expense_categories(*)")
        .single();

      // Trigger streak calculation
      await (supabase as any).rpc("update_streak", { p_user_id: userId, p_category: "expenses" });

      if (error || !data) {
        const catObj = (categoriesQuery.data || INITIAL_CATEGORIES).find((c) => c.id === categoryId);
        const fallback: Expense = {
          id: "exp-" + Date.now(),
          user_id: userId,
          category_id: categoryId || null,
          amount,
          note: note || null,
          spent_on: dateStr,
          created_at: new Date().toISOString(),
          expense_categories: catObj || null,
        };
        return fallback;
      }
      return data as Expense;
    },
    onSuccess: (newExpense) => {
      queryClient.setQueryData<Expense[]>(["expenses", userId], (old) => [newExpense, ...(old || [])]);
      queryClient.invalidateQueries({ queryKey: ["streaks", userId] });
    },
  });

  // 4. Delete Expense Mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      await (supabase.from("expenses") as any).delete().eq("id", id);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<Expense[]>(["expenses", userId], (old) => (old || []).filter((e) => e.id !== deletedId));
    },
  });

  return {
    categories: categoriesQuery.data || INITIAL_CATEGORIES,
    expenses: expensesQuery.data || INITIAL_EXPENSES,
    isLoading: expensesQuery.isLoading,
    addExpense: addExpenseMutation.mutateAsync,
    deleteExpense: deleteExpenseMutation.mutate,
  };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Expense, ExpenseCategory } from "@/types/database";

const getTodayStr = () => new Date().toISOString().split("T")[0];
const DEMO_USER_ID = "demo-user-id-001";

const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  { id: "cat-1", name: "Food", color: "#EC4899", icon: "utensils" },
  { id: "cat-2", name: "Transport", color: "#3B82F6", icon: "car" },
  { id: "cat-3", name: "Shopping", color: "#A855F7", icon: "shopping-bag" },
  { id: "cat-4", name: "Bills", color: "#EF4444", icon: "file-text" },
  { id: "cat-5", name: "Entertainment", color: "#84CC16", icon: "tv" },
  { id: "cat-6", name: "Other", color: "#6B7280", icon: "more-horizontal" },
];

const INITIAL_EXPENSES: Expense[] = [
  { id: "e-1", user_id: DEMO_USER_ID, category_id: "cat-1", amount: 42.50, note: "Whole Foods Organic Groceries", spent_on: getTodayStr(), created_at: new Date().toISOString(), expense_categories: DEFAULT_CATEGORIES[0] },
  { id: "e-2", user_id: DEMO_USER_ID, category_id: "cat-2", amount: 15.00, note: "Uber Ride Downtown", spent_on: getTodayStr(), created_at: new Date().toISOString(), expense_categories: DEFAULT_CATEGORIES[1] },
  { id: "e-3", user_id: DEMO_USER_ID, category_id: "cat-3", amount: 94.99, note: "Running Shoes Sale", spent_on: getTodayStr(), created_at: new Date().toISOString(), expense_categories: DEFAULT_CATEGORIES[2] },
];

export function useExpenses(userId: string) {
  const queryClient = useQueryClient();
  const isDemo = !userId || userId === DEMO_USER_ID;

  // 1. Fetch Expense Categories
  const categoriesQuery = useQuery({
    queryKey: ["expense_categories"],
    queryFn: async (): Promise<ExpenseCategory[]> => {
      const { data, error } = await (supabase.from("expense_categories") as any).select("*").order("name");
      if (error || !data || data.length === 0) return DEFAULT_CATEGORIES;
      return data as ExpenseCategory[];
    },
  });

  // 2. Fetch Expenses List
  const expensesQuery = useQuery({
    queryKey: ["expenses", userId],
    queryFn: async (): Promise<Expense[]> => {
      if (isDemo) return INITIAL_EXPENSES;

      const { data, error } = await (supabase.from("expenses") as any)
        .select("*, expense_categories(*)")
        .eq("user_id", userId)
        .order("spent_on", { ascending: false });

      if (error || !data) return [];
      return data as Expense[];
    },
  });

  // 3. Add Expense
  const addExpenseMutation = useMutation({
    mutationFn: async ({ amount, categoryId, note, dateStr = getTodayStr() }: { amount: number; categoryId: string; note?: string; dateStr?: string }) => {
      if (!isDemo) {
        const { data, error } = await (supabase.from("expenses") as any)
          .insert({
            user_id: userId,
            category_id: categoryId,
            amount,
            note,
            spent_on: dateStr,
          })
          .select("*, expense_categories(*)")
          .single();

        await (supabase as any).rpc("update_streak", { p_user_id: userId, p_category: "expenses" });
        if (!error && data) return data as Expense;
      }

      const catObj = (categoriesQuery.data || DEFAULT_CATEGORIES).find((c) => c.id === categoryId);
      const fallback: Expense = {
        id: "e-" + Date.now(),
        user_id: userId,
        category_id: categoryId,
        amount,
        note: note || null,
        spent_on: dateStr,
        created_at: new Date().toISOString(),
        expense_categories: catObj,
      };
      return fallback;
    },
    onSuccess: (newExpense) => {
      queryClient.setQueryData<Expense[]>(["expenses", userId], (old) => [newExpense, ...(old || [])]);
      queryClient.invalidateQueries({ queryKey: ["streaks", userId] });
    },
  });

  // 4. Delete Expense
  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      if (!isDemo) {
        await (supabase.from("expenses") as any).delete().eq("id", expenseId);
      }
      return expenseId;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<Expense[]>(["expenses", userId], (old) => (old || []).filter((e) => e.id !== deletedId));
    },
  });

  return {
    categories: categoriesQuery.data || DEFAULT_CATEGORIES,
    expenses: expensesQuery.data || (isDemo ? INITIAL_EXPENSES : []),
    isLoading: expensesQuery.isLoading,
    addExpense: addExpenseMutation.mutateAsync,
    deleteExpense: deleteExpenseMutation.mutateAsync,
  };
}

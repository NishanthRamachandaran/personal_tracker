import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Expense, ExpenseCategory } from "@/types/database";

const getTodayStr = () => new Date().toISOString().split("T")[0];
const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  { id: "10000000-0000-4000-8000-000000000001", name: "Food", color: "#EC4899", icon: "utensils" },
  { id: "10000000-0000-4000-8000-000000000002", name: "Transport", color: "#3B82F6", icon: "car" },
  { id: "10000000-0000-4000-8000-000000000003", name: "Shopping", color: "#A855F7", icon: "shopping-bag" },
  { id: "10000000-0000-4000-8000-000000000004", name: "Bills", color: "#EF4444", icon: "file-text" },
  { id: "10000000-0000-4000-8000-000000000005", name: "Entertainment", color: "#84CC16", icon: "tv" },
  { id: "10000000-0000-4000-8000-000000000006", name: "Other", color: "#6B7280", icon: "more-horizontal" },
];

const INITIAL_EXPENSES: Expense[] = [
  { id: "e1111111-1111-4111-8111-111111111111", user_id: DEMO_USER_ID, category_id: "10000000-0000-4000-8000-000000000001", amount: 42.50, note: "Whole Foods Organic Groceries", spent_on: getTodayStr(), created_at: new Date().toISOString(), expense_categories: DEFAULT_CATEGORIES[0] },
  { id: "e2222222-2222-4222-8222-222222222222", user_id: DEMO_USER_ID, category_id: "10000000-0000-4000-8000-000000000002", amount: 15.00, note: "Uber Ride Downtown", spent_on: getTodayStr(), created_at: new Date().toISOString(), expense_categories: DEFAULT_CATEGORIES[1] },
  { id: "e3333333-3333-4333-8333-333333333333", user_id: DEMO_USER_ID, category_id: "10000000-0000-4000-8000-000000000003", amount: 94.99, note: "Running Shoes Sale", spent_on: getTodayStr(), created_at: new Date().toISOString(), expense_categories: DEFAULT_CATEGORIES[2] },
];

function getLocalExpenses(userId: string): Expense[] {
  try {
    const raw = localStorage.getItem(`pulse_expenses_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalExpenses(userId: string, expenses: Expense[]) {
  try {
    localStorage.setItem(`pulse_expenses_${userId}`, JSON.stringify(expenses));
  } catch (e) {
    console.error("Failed to save local expenses", e);
  }
}

export function useExpenses(userId: string) {
  const queryClient = useQueryClient();
  const isDemo = !userId || userId === DEMO_USER_ID || userId === "demo-user-id-001";

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

      const localExpenses = getLocalExpenses(userId);

      const { data, error } = await (supabase.from("expenses") as any)
        .select("*, expense_categories(*)")
        .eq("user_id", userId)
        .order("spent_on", { ascending: false });

      if (error) {
        console.error("[SUPABASE_EXPENSES_FETCH_ERROR]", error);
        return localExpenses;
      }

      const expenses = (data as Expense[]) || [];
      const combinedMap = new Map<string, Expense>();
      [...localExpenses, ...expenses].forEach((e) => combinedMap.set(e.id, e));
      const combined = Array.from(combinedMap.values());

      saveLocalExpenses(userId, combined);
      return combined;
    },
    enabled: !!userId,
  });

  // 3. Add Expense
  const addExpenseMutation = useMutation({
    mutationFn: async ({ amount, categoryId, note, dateStr = getTodayStr() }: { amount: number; categoryId: string; note?: string; dateStr?: string }) => {
      const catObj = (categoriesQuery.data || DEFAULT_CATEGORIES).find((c) => c.id === categoryId);
      const newExpenseId = crypto.randomUUID();

      const fallback: Expense = {
        id: newExpenseId,
        user_id: userId,
        category_id: categoryId,
        amount,
        note: note || null,
        spent_on: dateStr,
        created_at: new Date().toISOString(),
        expense_categories: catObj,
      };

      const currentExpenses = expensesQuery.data || (isDemo ? INITIAL_EXPENSES : getLocalExpenses(userId));
      const updatedExpenses = [fallback, ...currentExpenses];

      if (!isDemo) {
        saveLocalExpenses(userId, updatedExpenses);
        const { data, error } = await (supabase.from("expenses") as any)
          .insert({
            id: newExpenseId,
            user_id: userId,
            category_id: categoryId.includes("-") ? categoryId : null,
            amount,
            note,
            spent_on: dateStr,
          })
          .select("*, expense_categories(*)")
          .single();

        if (error) {
          console.error("[SUPABASE_ADD_EXPENSE_ERROR]", error);
        } else {
          await (supabase as any).rpc("update_streak", { p_user_id: userId, p_category: "expenses" });
          if (data) {
            const finalExpenses = [data as Expense, ...currentExpenses.filter(e => e.id !== newExpenseId)];
            saveLocalExpenses(userId, finalExpenses);
            return data as Expense;
          }
        }
      }

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
      const currentExpenses = expensesQuery.data || getLocalExpenses(userId);
      const updatedExpenses = currentExpenses.filter((e) => e.id !== expenseId);

      if (!isDemo) {
        saveLocalExpenses(userId, updatedExpenses);
        const { error } = await (supabase.from("expenses") as any).delete().eq("id", expenseId);
        if (error) console.error("[SUPABASE_DELETE_EXPENSE_ERROR]", error);
      }
      return expenseId;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<Expense[]>(["expenses", userId], (old) => (old || []).filter((e) => e.id !== deletedId));
    },
  });

  return {
    categories: categoriesQuery.data || DEFAULT_CATEGORIES,
    expenses: expensesQuery.data || (isDemo ? INITIAL_EXPENSES : getLocalExpenses(userId)),
    isLoading: expensesQuery.isLoading,
    addExpense: addExpenseMutation.mutateAsync,
    deleteExpense: deleteExpenseMutation.mutateAsync,
  };
}

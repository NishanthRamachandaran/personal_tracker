import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useHabits } from "@/hooks/useHabits";
import { useExpenses } from "@/hooks/useExpenses";
import { useMoodLogs } from "@/hooks/useMoodLogs";
import { useHealthLogs } from "@/hooks/useHealthLogs";
import { useStreaks } from "@/hooks/useStreaks";
import { Bot, Sparkles, Send, X, ChevronRight, RefreshCw, CheckCircle2, Zap, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/utils/currencyFormatter";
import { playCheckmarkSound, playSuccessFanfare } from "@/utils/audioFeedback";
import { supabase } from "@/lib/supabaseClient";

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
  actionExecuted?: {
    type: "create_habit" | "log_expense" | "log_mood" | "log_health";
    detail: string;
  };
}

export const PulseAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "ai",
      text: "🤖 **Autonomous Pulse AI Agent Active**\n\nI can answer questions AND execute tasks directly for you! Try commanding me:\n• *'Add a habit called Read 20 Pages'*\n• *'Log an expense of ₹250 for Coffee'*\n• *'Record my mood as 5/5 feeling great'*\n• *'I slept 8 hours and drank 8 glasses of water'*",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const userId = user?.id || "";

  const { habits, habitLogs, createHabit, toggleHabit } = useHabits(userId);
  const { expenses, categories, addExpense } = useExpenses(userId);
  const { moodLogs, addMoodLog } = useMoodLogs(userId);
  const { healthLogs, upsertHealthLog } = useHealthLogs(userId);
  const { activeStreakCount } = useStreaks(userId);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isExecuting]);

  const quickActionCommands = [
    "➕ Add habit: Read 30m Books",
    "💸 Log ₹350 spent on Dinner",
    "😊 Record mood: 5/5 Super Focused",
    "💧 Log health: 8 glasses water & 8h sleep",
    "📊 Summarize my overall daily progress",
  ];

  // Full Autonomous Agent Action Parser & Execution Engine
  const processAgentCommand = async (input: string): Promise<{ text: string; actionExecuted?: Message["actionExecuted"] }> => {
    const q = input.trim();
    const lower = q.toLowerCase();

    // 1. ACTION TOOL: Create Habit
    if (lower.includes("add habit") || lower.includes("create habit") || lower.includes("new habit")) {
      let habitName = q
        .replace(/add habit[:\s]*/i, "")
        .replace(/create habit[:\s]*/i, "")
        .replace(/new habit[:\s]*/i, "")
        .trim();

      if (!habitName) habitName = "Daily Goal";

      await createHabit({ name: habitName, frequency: "daily" });
      playCheckmarkSound();

      return {
        text: `✅ **Action Executed**: Created new daily habit **"${habitName}"**! It is now active on your Dashboard checklist.`,
        actionExecuted: { type: "create_habit", detail: habitName },
      };
    }

    // 2. ACTION TOOL: Log Expense
    if (lower.includes("expense") || lower.includes("spent") || lower.includes("paid") || lower.includes("log ₹") || lower.includes("log $")) {
      const amountMatch = q.match(/(?:₹|\$|inr|usd)?\s*(\d+(?:\.\d+)?)/i);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 100;

      let matchedCategory = categories[0]?.id || "";
      let catName = "Other";

      if (lower.includes("food") || lower.includes("dinner") || lower.includes("lunch") || lower.includes("starbucks") || lower.includes("coffee") || lower.includes("grocery")) {
        const found = categories.find((c) => c.name.toLowerCase().includes("food"));
        if (found) { matchedCategory = found.id; catName = found.name; }
      } else if (lower.includes("uber") || lower.includes("cab") || lower.includes("transport") || lower.includes("fuel") || lower.includes("bus")) {
        const found = categories.find((c) => c.name.toLowerCase().includes("transport"));
        if (found) { matchedCategory = found.id; catName = found.name; }
      } else if (lower.includes("shopping") || lower.includes("amazon") || lower.includes("clothes") || lower.includes("shoes")) {
        const found = categories.find((c) => c.name.toLowerCase().includes("shopping"));
        if (found) { matchedCategory = found.id; catName = found.name; }
      }

      await addExpense({
        amount,
        categoryId: matchedCategory,
        note: `AI Agent log: ${q}`,
      });
      playCheckmarkSound();

      return {
        text: `✅ **Action Executed**: Recorded expense of **${formatCurrency(amount)}** under category **"${catName}"**.`,
        actionExecuted: { type: "log_expense", detail: `${formatCurrency(amount)} - ${catName}` },
      };
    }

    // 3. ACTION TOOL: Log Mood
    if (lower.includes("mood") || lower.includes("feeling") || lower.includes("feel") || lower.includes("rating")) {
      let score = 4;
      if (lower.includes("5") || lower.includes("great") || lower.includes("amazing") || lower.includes("excellent")) score = 5;
      else if (lower.includes("3") || lower.includes("okay")) score = 3;
      else if (lower.includes("2") || lower.includes("bad")) score = 2;
      else if (lower.includes("1") || lower.includes("terrible")) score = 1;

      await addMoodLog({
        moodScore: score,
        journalNote: q,
        tags: ["AI-Logged"],
      });
      playCheckmarkSound();

      return {
        text: `✅ **Action Executed**: Recorded your **${score}/5** mood status with note: "${q}".`,
        actionExecuted: { type: "log_mood", detail: `Score ${score}/5` },
      };
    }

    // 4. ACTION TOOL: Log Health (Water & Sleep & Workout)
    if (lower.includes("water") || lower.includes("sleep") || lower.includes("workout") || lower.includes("health")) {
      const waterMatch = q.match(/(\d+)\s*(?:glasses|glass|l|liters)/i);
      const sleepMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:hours|hour|h)/i);
      const workoutMatch = q.match(/(\d+)\s*(?:mins|min|minutes|m)/i);

      const glasses = waterMatch ? parseInt(waterMatch[1], 10) : 8;
      const sleep = sleepMatch ? parseFloat(sleepMatch[1]) : 7.5;
      const workout = workoutMatch ? parseInt(workoutMatch[1], 10) : 30;

      await upsertHealthLog({
        waterGlasses: glasses,
        sleepHours: sleep,
        workoutMinutes: workout,
        workoutType: "General Exercise",
      });
      playCheckmarkSound();

      return {
        text: `✅ **Action Executed**: Logged **${(glasses * 0.25).toFixed(1)}L Water**, **${sleep}h Sleep**, and **${workout}m Workout** into health metrics!`,
        actionExecuted: { type: "log_health", detail: `${glasses} glasses, ${sleep}h sleep` },
      };
    }

    // Erase History Command
    if (lower.includes("erase history") || lower.includes("clear history") || lower.includes("delete history")) {
      localStorage.removeItem(`pulse_habit_logs_${userId}`);
      localStorage.removeItem(`pulse_expenses_${userId}`);
      localStorage.removeItem(`pulse_mood_${userId}`);
      localStorage.removeItem(`pulse_health_${userId}`);

      if (userId) {
        await (supabase.from("habit_logs") as any).delete().eq("user_id", userId);
        await (supabase.from("expenses") as any).delete().eq("user_id", userId);
        await (supabase.from("mood_logs") as any).delete().eq("user_id", userId);
        await (supabase.from("health_logs") as any).delete().eq("user_id", userId);
      }

      setTimeout(() => window.location.reload(), 1500);

      return {
        text: `✅ **Action Executed**: Erased all logged tracking history! Page will refresh now.`,
      };
    }

    // 5. QUERY: Summarize
    if (lower.includes("summary") || lower.includes("summarize") || lower.includes("today") || lower.includes("progress")) {
      const completedCount = habitLogs.filter((l) => l.completed_on === todayStr).length;
      const totalCount = habits.length;
      const totalSpentToday = expenses
        .filter((e) => e.spent_on === todayStr)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      return {
        text: `📊 **Live Progress Summary**:
• Completed Habits: **${completedCount} / ${totalCount}**
• Expenses Logged Today: **${formatCurrency(totalSpentToday)}**
• Active Streak: **${activeStreakCount} Days** 🔥

Commands you can give me:
1. *"Add habit [Name]"*
2. *"Log expense [Amount] [Category]"*
3. *"Record mood [1-5]"*
4. *"Log health [Water] [Sleep]"*`,
      };
    }

    // Default Intelligence Response
    return {
      text: `🤖 I evaluated your input: "${q}".

I can execute actions directly on your database! Try issuing an action command:
• *"Add habit Read 30m"*
• *"Log expense ₹450 Dinner"*
• *"Record mood 5/5"*
• *"Log 8 glasses water and 7.5h sleep"*`,
    };
  };

  const handleSend = async (commandText?: string) => {
    const text = commandText || inputQuery;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!commandText) setInputQuery("");
    setIsExecuting(true);

    try {
      const reply = await processAgentCommand(text);
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        sender: "ai",
        text: reply.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionExecuted: reply.actionExecuted,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error("Agent execution error", e);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 px-4 py-3 rounded-full bg-gradient-to-r from-habit via-expense to-health text-background font-extrabold text-xs flex items-center gap-2 shadow-2xl hover:scale-105 active:scale-95 transition-all shadow-glow-habit"
      >
        <Bot className="w-4 h-4 stroke-[2.5]" />
        <span>Pulse Agent</span>
      </button>

      {/* Floating Autonomous Agent Window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-[#0D0D12]/75 backdrop-blur-md flex items-end sm:items-center justify-center p-2 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-surface-level1 border border-outline/30 rounded-3xl shadow-2xl glass-modal flex flex-col h-[580px] max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-level2/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-habit via-expense to-health flex items-center justify-center text-background shadow-glow-habit">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-on-surface flex items-center gap-1.5">
                    Pulse AI Autonomous Agent <ShieldCheck className="w-4 h-4 text-health" />
                  </h3>
                  <p className="text-[10px] text-on-surface-variant font-semibold">Action-Capable Assistant • Database Tool Integration</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl bg-surface-level3 hover:bg-surface-bright text-on-surface-variant hover:text-on-surface transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Trigger Chips */}
            <div className="p-3 border-b border-outline-variant/20 bg-surface-level2/40 overflow-x-auto flex items-center gap-2">
              {quickActionCommands.map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(cmd)}
                  className="px-3 py-1.5 rounded-full bg-surface-level2 hover:bg-habit/20 border border-outline/30 text-[11px] font-bold text-on-surface whitespace-nowrap transition-all flex items-center gap-1"
                >
                  <span>{cmd}</span>
                  <ChevronRight className="w-3 h-3 text-habit-primary" />
                </button>
              ))}
            </div>

            {/* Messages View */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl whitespace-pre-wrap ${
                      msg.sender === "user"
                        ? "bg-habit text-background font-bold rounded-tr-none shadow-glow-habit"
                        : "bg-surface-level2 border border-outline/30 text-on-surface rounded-tl-none font-medium leading-relaxed"
                    }`}
                  >
                    {msg.text}

                    {msg.actionExecuted && (
                      <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1.5 text-[10px] font-bold text-health">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Executed database tool: {msg.actionExecuted.detail}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-on-surface-variant mt-1 font-semibold px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {isExecuting && (
                <div className="flex items-center gap-2 text-habit-primary text-xs font-bold p-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Agent executing tool mutation on database...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 border-t border-outline-variant/30 bg-surface-level2/80 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Issue an agent command (e.g. 'Log ₹250 for Coffee')..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-surface-level1 border border-outline/30 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-habit"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim()}
                className="p-2.5 rounded-2xl bg-habit hover:bg-habit-primary disabled:opacity-40 text-background font-bold transition-all shadow-glow-habit"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

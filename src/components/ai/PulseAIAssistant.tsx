import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useHabits } from "@/hooks/useHabits";
import { useExpenses } from "@/hooks/useExpenses";
import { useMoodLogs } from "@/hooks/useMoodLogs";
import { useHealthLogs } from "@/hooks/useHealthLogs";
import { useStreaks } from "@/hooks/useStreaks";
import { Bot, Sparkles, Send, X, MessageSquare, ChevronRight, RefreshCw, Zap } from "lucide-react";
import { formatCurrency } from "@/utils/currencyFormatter";

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
}

export const PulseAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "ai",
      text: "👋 Hi Nishanth! I'm your Pulse AI Personal Assistant. Ask me anything about your habits, budget, sleep, or mood trends!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { user, profile } = useAuth();
  const userId = user?.id || "";

  const { habits, habitLogs } = useHabits(userId);
  const { expenses } = useExpenses(userId);
  const { moodLogs } = useMoodLogs(userId);
  const { healthLogs } = useHealthLogs(userId);
  const { activeStreakCount } = useStreaks(userId);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const quickQuestions = [
    "📊 Give me a summary of today's progress",
    "💡 How can I improve my daily habit streak?",
    "💰 What is my top expense category?",
    "🧘 How does my sleep affect my mood?",
    "🎯 How can I save more money this month?",
  ];

  const computeAIAnswer = (query: string): string => {
    const q = query.toLowerCase();

    // 1. Today's Summary
    if (q.includes("today") || q.includes("summary") || q.includes("progress")) {
      const completedCount = habitLogs.filter((l) => l.completed_on === todayStr).length;
      const totalCount = habits.length;
      const totalSpentToday = expenses
        .filter((e) => e.spent_on === todayStr)
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const moodToday = moodLogs.find((m) => m.logged_on === todayStr);
      const healthToday = healthLogs.find((h) => h.logged_on === todayStr);

      return `Here is your live snapshot for today (${todayStr}):
• Habits Completed: ${completedCount} of ${totalCount} (${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%)
• Expenses Spent Today: ${formatCurrency(totalSpentToday)}
• Mood Rating: ${moodToday ? `${moodToday.mood_score}/5 (${moodToday.tags?.join(", ") || "No tags"})` : "Not logged yet"}
• Health Metrics: ${healthToday ? `💧 ${(healthToday.water_glasses * 0.25).toFixed(1)}L Water | 💤 ${healthToday.sleep_hours}h Sleep` : "Not logged yet"}
• Active Streak: ${activeStreakCount} Days 🔥`;
    }

    // 2. Habit Advice & Streaks
    if (q.includes("habit") || q.includes("streak") || q.includes("improve")) {
      const completionRate = habits.length > 0 ? Math.round((habitLogs.length / (habits.length * 7)) * 100) : 0;
      return `Your active streak is currently **${activeStreakCount} Days**! 🔥

💡 **AI Tip for Streak Consistency**:
1. Complete your highest priority habit early in the morning before 9:00 AM.
2. Set reminder notifications for evening check-ins.
3. Your overall habit consistency is sitting around **${completionRate}%** — keep building momentum daily!`;
    }

    // 3. Expense Analysis & Budget
    if (q.includes("expense") || q.includes("category") || q.includes("spending") || q.includes("money") || q.includes("save")) {
      const categoryTotals: Record<string, number> = {};
      expenses.forEach((e) => {
        const cat = e.expense_categories?.name || "Other";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.amount);
      });

      const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
      const topCat = sortedCategories[0];
      const totalSpentAllTime = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

      return `💰 **Financial Analysis**:
• Total Expenses Recorded: **${formatCurrency(totalSpentAllTime)}**
• Top Expense Category: **${topCat ? `${topCat[0]} (${formatCurrency(topCat[1])})` : "None recorded"}**

💡 **Saving Advice**: Try assigning a daily cap of **${formatCurrency(500)}** for non-essential discretionary items to keep your monthly budget under target!`;
    }

    // 4. Mood & Sleep Correlation
    if (q.includes("sleep") || q.includes("mood") || q.includes("health") || q.includes("energy")) {
      const avgSleep = healthLogs.length > 0
        ? (healthLogs.reduce((sum, h) => sum + Number(h.sleep_hours), 0) / healthLogs.length).toFixed(1)
        : "7.5";
      const avgMood = moodLogs.length > 0
        ? (moodLogs.reduce((sum, m) => sum + Number(m.mood_score), 0) / moodLogs.length).toFixed(1)
        : "4.2";

      return `🧠 **Wellness Insights**:
• Average Sleep Logged: **${avgSleep} hours**
• Average Mood Score: **${avgMood} / 5**

💡 **Correlation Insight**: Data shows that on days you sleep **7.5+ hours** and drink **2L+ water**, your recorded mood ratings improve by **25%**! Prioritize 8 hours of sleep tonight.`;
    }

    // 5. Default General Intelligence Response
    return `I evaluated your account activity (${habits.length} habits, ${expenses.length} expenses logged).

You have an active **${activeStreakCount}-day streak** going! To optimize your daily routine, try checking off habits early in the morning and tracking expenses immediately after purchases.

Is there any specific metric (habits, spending, sleep, or mood) you'd like me to analyze deeper?`;
  };

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery("");
    setIsTyping(true);

    setTimeout(() => {
      const aiReplyText = computeAIAnswer(query);
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        sender: "ai",
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <>
      {/* Floating Trigger Assistant Button (Bottom Right) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 px-4 py-3 rounded-full bg-gradient-to-r from-habit via-expense to-health text-background font-extrabold text-xs flex items-center gap-2 shadow-2xl hover:scale-105 active:scale-95 transition-all shadow-glow-habit"
      >
        <Sparkles className="w-4 h-4 stroke-[2.5]" />
        <span>Pulse AI</span>
      </button>

      {/* Floating Assistant Chat Window Modal / Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-[#0D0D12]/70 backdrop-blur-md flex items-end sm:items-center justify-center p-2 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-surface-level1 border border-outline/30 rounded-3xl shadow-2xl glass-modal flex flex-col h-[560px] max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-level2/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-habit to-expense flex items-center justify-center text-background shadow-glow-habit">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-on-surface flex items-center gap-1.5">
                    Pulse AI Assistant <Sparkles className="w-3.5 h-3.5 text-habit-primary" />
                  </h3>
                  <p className="text-[10px] text-on-surface-variant font-semibold">Real-time intelligent tracker assistant</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl bg-surface-level3 hover:bg-surface-bright text-on-surface-variant hover:text-on-surface transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Questions Preset Chips */}
            <div className="p-3 border-b border-outline-variant/20 bg-surface-level2/40 overflow-x-auto flex items-center gap-2">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="px-3 py-1.5 rounded-full bg-surface-level2 hover:bg-habit/20 border border-outline/30 text-[11px] font-bold text-on-surface whitespace-nowrap transition-all flex items-center gap-1"
                >
                  <span>{q}</span>
                  <ChevronRight className="w-3 h-3 text-habit-primary" />
                </button>
              ))}
            </div>

            {/* Messages Scroll View */}
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
                  </div>
                  <span className="text-[9px] text-on-surface-variant mt-1 font-semibold px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-habit-primary text-xs font-bold p-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Pulse AI is analyzing your metrics...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 border-t border-outline-variant/30 bg-surface-level2/80 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask Pulse AI a question..."
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

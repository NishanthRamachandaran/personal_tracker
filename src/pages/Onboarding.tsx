import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Zap, Check, Activity, CreditCard, Smile, HeartPulse, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CategoryType } from "@/types/database";

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateCategories } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCats, setSelectedCats] = useState<CategoryType[]>(
    profile?.active_categories || ["habits", "expenses", "mood", "health"]
  );

  const toggleCategory = (cat: CategoryType) => {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleFinish = () => {
    updateCategories(selectedCats);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0D0D12] text-on-surface relative overflow-hidden">
      <div className="w-full max-w-lg glass-modal p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl relative z-10 space-y-6">
        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                step >= s ? "bg-gradient-to-r from-habit to-expense" : "bg-surface-level2"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6 text-center animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-habit via-expense to-health p-0.5 shadow-glow-habit flex items-center justify-center">
              <div className="w-full h-full bg-[#0D0D12] rounded-[22px] flex items-center justify-center">
                <Zap className="w-10 h-10 text-habit-primary stroke-[2.5]" />
              </div>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-habit-primary px-3 py-1 rounded-full bg-habit/10 border border-habit/30">
                Welcome to Pulse
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight mt-3 text-on-surface">
                All-in-One Personal Tracker
              </h1>
              <p className="text-sm text-on-surface-variant mt-2 max-w-md mx-auto">
                Track Habits, Expenses, Mood, and Health seamlessly in one unified dark-mode dashboard.
              </p>
            </div>

            <Button onClick={() => setStep(2)} variant="habit" className="w-full py-4 text-sm">
              Get Started <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-expense-secondary px-3 py-1 rounded-full bg-expense/10 border border-expense/30">
                Step 2 of 3
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight mt-2 text-on-surface">
                Choose Categories to Track
              </h2>
            </div>

            <div className="space-y-3">
              {[
                { id: "habits" as CategoryType, name: "Habits & Routines", desc: "Daily checklists, streak multipliers", icon: Activity, color: "text-habit", border: "border-habit/40", bg: "bg-habit/10" },
                { id: "expenses" as CategoryType, name: "Expenses & Budget", desc: "Categorized spending, visual breakdown", icon: CreditCard, color: "text-expense", border: "border-expense/40", bg: "bg-expense/10" },
                { id: "mood" as CategoryType, name: "Mood & Energy", desc: "5-point emoji scale, driver tags", icon: Smile, color: "text-mood", border: "border-mood/40", bg: "bg-mood/10" },
                { id: "health" as CategoryType, name: "Health & Fitness", desc: "Water hydration, sleep, workouts", icon: HeartPulse, color: "text-health", border: "border-health/40", bg: "bg-health/10" },
              ].map((cat) => {
                const isSelected = selectedCats.includes(cat.id);
                const Icon = cat.icon;

                return (
                  <div
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected ? `${cat.bg} ${cat.border} text-on-surface` : "bg-surface-level1 border-outline/30 text-on-surface-variant hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center ${cat.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-on-surface">{cat.name}</h4>
                        <p className="text-xs text-on-surface-variant">{cat.desc}</p>
                      </div>
                    </div>

                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                      isSelected ? "bg-habit border-habit text-background" : "border-outline/40"
                    }`}>
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep(1)} variant="ghost" className="w-1/3 py-3">Back</Button>
              <Button onClick={() => setStep(3)} variant="expense" className="w-2/3 py-3">Continue <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 text-center animate-fadeIn">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-health-tertiary px-3 py-1 rounded-full bg-health/10 border border-health/30">
                Final Step
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight mt-2 text-on-surface">
                Ready to Enter Pulse
              </h2>
              <p className="text-xs text-on-surface-variant mt-2 max-w-sm mx-auto">
                Your trackers have been initialized. You can modify these settings anytime in your profile.
              </p>
            </div>

            <Button onClick={handleFinish} variant="health" className="w-full py-4 text-sm">
              Enter Pulse Command Center
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { Trophy, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStreaks } from "@/hooks/useStreaks";

export const MilestoneModalLauncher: React.FC = () => {
  const { user } = useAuth();
  const { milestones } = useStreaks(user?.id || "");
  const [activeMilestone, setActiveMilestone] = useState<any | null>(null);

  useEffect(() => {
    if (milestones && milestones.length > 0) {
      const latest = milestones[milestones.length - 1];
      setActiveMilestone(latest);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#A855F7", "#22D3EE", "#84CC16", "#EC4899"],
      });
    }
  }, [milestones]);

  if (!activeMilestone) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-xl animate-fadeIn">
      <div className="w-full max-w-md bg-[#0D0D12] border-2 border-habit p-6 rounded-3xl shadow-glow-habit text-center relative overflow-hidden">
        <button
          onClick={() => setActiveMilestone(null)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-level2 text-on-surface-variant hover:text-on-surface"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-habit via-expense to-health p-0.5 shadow-2xl flex items-center justify-center">
          <div className="w-full h-full bg-[#0D0D12] rounded-[22px] flex items-center justify-center">
            <Trophy className="w-10 h-10 text-habit stroke-[2]" />
          </div>
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-habit/20 border border-habit/40 text-habit-primary font-bold text-xs uppercase tracking-wider mb-2">
          Milestone Unlocked!
        </span>

        <h2 className="text-2xl font-extrabold text-on-surface tracking-tight mb-2">
          {activeMilestone.milestone_type.replace(/_/g, " ").toUpperCase()}
        </h2>

        <p className="text-sm text-on-surface-variant mb-6 px-4">
          Incredible consistency! You reached a milestone achievement in your {activeMilestone.category} tracker.
        </p>

        <button
          onClick={() => setActiveMilestone(null)}
          className="w-full py-3.5 rounded-2xl bg-habit text-background font-extrabold text-sm shadow-glow-habit hover:opacity-95 transition-all"
        >
          Keep Building Momentum!
        </button>
      </div>
    </div>
  );
};

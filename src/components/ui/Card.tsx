import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowCategory?: "habits" | "expenses" | "mood" | "health";
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  glowCategory,
  hoverable = false,
  ...props
}) => {
  const glowBorder = {
    habits: "border-habit/30 hover:border-habit/60 shadow-glow-habit/20",
    expenses: "border-expense/30 hover:border-expense/60 shadow-glow-expense/20",
    mood: "border-mood/30 hover:border-mood/60 shadow-glow-mood/20",
    health: "border-health/30 hover:border-health/60 shadow-glow-health/20",
  };

  return (
    <div
      className={twMerge(
        clsx(
          "glass-card p-5 rounded-3xl border border-white/10 relative overflow-hidden",
          hoverable && "glass-card-hover cursor-pointer",
          glowCategory && glowBorder[glowCategory],
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

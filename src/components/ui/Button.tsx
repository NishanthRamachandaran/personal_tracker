import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "habit" | "expense" | "mood" | "health" | "ghost" | "surface";
  size?: "sm" | "md" | "lg";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "habit",
  size = "md",
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

  const variantStyles = {
    habit: "bg-habit text-background shadow-glow-habit hover:opacity-95",
    expense: "bg-expense text-background shadow-glow-expense hover:opacity-95",
    mood: "bg-mood text-background shadow-glow-mood hover:opacity-95",
    health: "bg-health text-background shadow-glow-health hover:opacity-95",
    ghost: "bg-transparent hover:bg-surface-level2 text-on-surface-variant hover:text-on-surface",
    surface: "bg-surface-level2 hover:bg-surface-level3 text-on-surface border border-outline/30",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base",
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variantStyles[variant], sizeStyles[size], className))}
      {...props}
    >
      {children}
    </button>
  );
};

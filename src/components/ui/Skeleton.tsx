import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={twMerge(clsx("animate-pulse rounded-2xl bg-surface-level2/80", className))}
      {...props}
    />
  );
};

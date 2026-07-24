import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card } from "@/components/ui/Card";

interface BarChartCardProps {
  title: string;
  subtitle: string;
  data: { day: string; completionRate: number }[];
}

export const BarChartCard: React.FC<BarChartCardProps> = ({ title, subtitle, data }) => {
  return (
    <Card glowCategory="habits" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-on-surface">{title}</h3>
          <p className="text-xs text-on-surface-variant">{subtitle}</p>
        </div>
        <span className="text-xs font-extrabold text-habit-primary px-2.5 py-1 rounded-full bg-habit/20">
          Habits
        </span>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A36" vertical={false} />
            <XAxis dataKey="day" stroke="#a099a8" fontSize={11} />
            <YAxis stroke="#a099a8" fontSize={11} unit="%" domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: "#16161D", borderColor: "#A855F7", borderRadius: "12px", color: "#eadfed" }}
            />
            <Bar dataKey="completionRate" fill="#A855F7" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

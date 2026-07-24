import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card } from "@/components/ui/Card";

interface ComboChartCardProps {
  title: string;
  subtitle: string;
  data: { day: string; waterLiters: number; sleepHours: number }[];
}

export const ComboChartCard: React.FC<ComboChartCardProps> = ({ title, subtitle, data }) => {
  return (
    <Card glowCategory="health" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-on-surface">{title}</h3>
          <p className="text-xs text-on-surface-variant">{subtitle}</p>
        </div>
        <span className="text-xs font-extrabold text-health px-2.5 py-1 rounded-full bg-health/20">
          Health
        </span>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A36" vertical={false} />
            <XAxis dataKey="day" stroke="#a099a8" fontSize={11} />
            <YAxis stroke="#a099a8" fontSize={11} />
            <Tooltip
              contentStyle={{ backgroundColor: "#16161D", borderColor: "#84CC16", borderRadius: "12px", color: "#F3F4F6" }}
              itemStyle={{ color: "#84CC16", fontWeight: "bold", fontSize: "12px" }}
              labelStyle={{ color: "#F3F4F6", fontWeight: "bold", fontSize: "12px" }}
            />
            <Line type="monotone" dataKey="waterLiters" stroke="#22D3EE" strokeWidth={2.5} name="Water (L)" />
            <Line type="monotone" dataKey="sleepHours" stroke="#84CC16" strokeWidth={2.5} name="Sleep (h)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

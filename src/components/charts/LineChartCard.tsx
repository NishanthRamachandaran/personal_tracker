import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card } from "@/components/ui/Card";

interface LineChartCardProps {
  title: string;
  subtitle: string;
  data: { day: string; rating: number }[];
}

export const LineChartCard: React.FC<LineChartCardProps> = ({ title, subtitle, data }) => {
  return (
    <Card glowCategory="mood" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-on-surface">{title}</h3>
          <p className="text-xs text-on-surface-variant">{subtitle}</p>
        </div>
        <span className="text-xs font-extrabold text-mood px-2.5 py-1 rounded-full bg-mood/20">
          Mood
        </span>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EC4899" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#EC4899" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A36" vertical={false} />
            <XAxis dataKey="day" stroke="#a099a8" fontSize={11} />
            <YAxis stroke="#a099a8" fontSize={11} domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
            <Tooltip
              contentStyle={{ backgroundColor: "#16161D", borderColor: "#EC4899", borderRadius: "12px", color: "#F3F4F6" }}
              itemStyle={{ color: "#EC4899", fontWeight: "bold", fontSize: "12px" }}
              labelStyle={{ color: "#F3F4F6", fontWeight: "bold", fontSize: "12px" }}
            />
            <Area type="monotone" dataKey="rating" stroke="#EC4899" strokeWidth={3} fillOpacity={1} fill="url(#moodGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

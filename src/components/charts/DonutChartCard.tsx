import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/utils/currencyFormatter";

interface DonutChartCardProps {
  title: string;
  subtitle: string;
  data: { name: string; value: number }[];
}

const COLORS = ["#22D3EE", "#A855F7", "#84CC16", "#EC4899", "#F59E0B", "#3B82F6"];

export const DonutChartCard: React.FC<DonutChartCardProps> = ({ title, subtitle, data }) => {
  return (
    <Card glowCategory="expenses" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-on-surface">{title}</h3>
          <p className="text-xs text-on-surface-variant">{subtitle}</p>
        </div>
        <span className="text-xs font-extrabold text-expense-secondary px-2.5 py-1 rounded-full bg-expense/20">
          Expenses
        </span>
      </div>

      <div className="h-64 w-full flex items-center justify-center pt-2">
        {data.length === 0 ? (
          <p className="text-xs text-on-surface-variant">No expense entries recorded yet</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#16161D",
                  borderColor: "#22D3EE",
                  borderRadius: "14px",
                  color: "#F3F4F6",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                }}
                itemStyle={{ color: "#22D3EE", fontWeight: "bold", fontSize: "12px" }}
                labelStyle={{ color: "#F3F4F6", fontWeight: "bold", fontSize: "12px" }}
                formatter={(val: any) => [formatCurrency(parseFloat(val)), "Total Spend"]}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category Color Legend */}
      {data.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-semibold">
          {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-on-surface">{entry.name}</span>
              <span className="text-on-surface-variant text-[10px]">({formatCurrency(entry.value)})</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

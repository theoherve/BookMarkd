"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer, CHART_COLORS } from "@/components/admin/shared/chart-container";
import type { ChartDataPoint } from "@/types/admin";

type AnalyticsViewsChartProps = {
  data: ChartDataPoint[];
};

export const AnalyticsViewsChart = ({ data }: AnalyticsViewsChartProps) => {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
  }));

  return (
    <ChartContainer title="Pages vues (30 derniers jours)">
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="fill-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="fill-muted-foreground" allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
            <Area type="monotone" dataKey="value" name="Pages vues" stroke={CHART_COLORS[2]} fill={CHART_COLORS[2]} fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
};

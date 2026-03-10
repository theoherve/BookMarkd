"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer, CHART_COLORS } from "@/components/admin/shared/chart-container";

type BookRatingsChartProps = {
  distribution: { rating: number; count: number }[];
};

export const BookRatingsChart = ({ distribution }: BookRatingsChartProps) => {
  const data = distribution.map((d) => ({
    name: `${d.rating}★`,
    count: d.count,
  }));

  return (
    <ChartContainer title="Distribution des notes">
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
            <Bar dataKey="count" name="Notes" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
};

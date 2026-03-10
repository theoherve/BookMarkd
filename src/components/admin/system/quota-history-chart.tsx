"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  ChartContainer,
  CHART_COLORS,
} from "@/components/admin/shared/chart-container";

type QuotaHistoryChartProps = {
  data: { date: string; count: number }[];
};

export const QuotaHistoryChart = ({ data }: QuotaHistoryChartProps) => {
  const chartData = [...data].reverse().map((item) => ({
    date: new Date(item.date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    }),
    count: item.count,
  }));

  return (
    <ChartContainer title="Historique du quota Google Books API (30 jours)">
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              domain={[0, 1000]}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid var(--border)",
                backgroundColor: "var(--popover)",
                color: "var(--popover-foreground)",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((value: any) => [`${value} requêtes`, "Utilisation"]) as any}
            />
            <ReferenceLine
              y={950}
              stroke="var(--destructive)"
              strokeDasharray="4 4"
              label={{
                value: "Limite (950)",
                position: "insideTopRight",
                fill: "var(--destructive)",
                fontSize: 11,
              }}
            />
            <ReferenceLine
              y={700}
              stroke="var(--chart-4)"
              strokeDasharray="4 4"
              label={{
                value: "Attention (700)",
                position: "insideTopRight",
                fill: "var(--chart-4)",
                fontSize: 11,
              }}
            />
            <Bar
              dataKey="count"
              fill={CHART_COLORS[0]}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
};

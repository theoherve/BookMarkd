"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, CHART_COLORS } from "@/components/admin/shared/chart-container";

type PopularBook = {
  bookId: string;
  title: string;
  author: string;
  readersCount: number;
};

type PopularBooksChartProps = {
  books: PopularBook[];
};

export const PopularBooksChart = ({ books }: PopularBooksChartProps) => {
  const data = books.map((b) => ({
    name: b.title.length > 20 ? b.title.slice(0, 20) + "…" : b.title,
    lecteurs: b.readersCount,
  }));

  return (
    <ChartContainer title="Livres les plus lus">
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 11 }}
              width={120}
              className="fill-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="lecteurs" fill={CHART_COLORS[3]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
};

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type ChartContainerProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
};

export const ChartContainer = ({
  title,
  children,
  className,
  action,
}: ChartContainerProps) => {
  return (
    <Card className={cn("gap-0", className)}>
      {title && (
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {action}
        </CardHeader>
      )}
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
};

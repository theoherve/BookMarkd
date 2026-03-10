import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, type LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  className?: string;
};

export const StatCard = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  className,
}: StatCardProps) => {
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card className={cn("gap-0 py-4", className)}>
      <CardContent className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 text-xs">
              {isPositive ? (
                <ArrowUp className="size-3 text-green-600" />
              ) : (
                <ArrowDown className="size-3 text-red-500" />
              )}
              <span
                className={cn(
                  "font-medium",
                  isPositive ? "text-green-600" : "text-red-500"
                )}
              >
                {isPositive ? "+" : ""}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className="rounded-md bg-muted p-2">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

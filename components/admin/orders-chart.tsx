"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

export interface DailyStat {
  /** UTC day, YYYY-MM-DD. */
  date: string;
  orders: number;
  revenue: number;
}

type Metric = "orders" | "revenue";

const chartConfig = {
  orders: { label: "Orders", color: "var(--chart-2)" },
  revenue: { label: "Revenue (£)", color: "var(--chart-3)" },
} satisfies ChartConfig;

function dayLabel(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** Orders/revenue over the last 14 days (rendered only when data exists). */
export function OrdersChart({ data }: { data: DailyStat[] }) {
  const [metric, setMetric] = useState<Metric>("orders");
  const color =
    metric === "orders" ? "var(--color-orders)" : "var(--color-revenue)";

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>Last 14 days — cash on delivery</CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={metric}
            onValueChange={(value) => {
              if (value) setMetric(value as Metric);
            }}
            variant="outline"
          >
            <ToggleGroupItem value="orders">Orders</ToggleGroupItem>
            <ToggleGroupItem value="revenue">Revenue</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={data} margin={{ left: 4, right: 8 }}>
            <defs>
              <linearGradient id="fillMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.9} />
                <stop offset="95%" stopColor={color} stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={dayLabel}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(value) => dayLabel(String(value))}
                />
              }
            />
            <Area
              dataKey={metric}
              type="monotone"
              fill="url(#fillMetric)"
              stroke={color}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

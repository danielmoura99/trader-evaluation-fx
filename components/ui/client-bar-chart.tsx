"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ClientBarChartProps {
  data: { name: string; total: number }[];
  title: string;
  description?: string;
}

export function ClientBarChart({
  data,
  title,
  description,
}: ClientBarChartProps) {
  const chartConfig = {
    total: {
      label: "Total",
      theme: {
        light: "hsl(216 100% 50%)",
        dark: "hsl(216 100% 60%)",
      },
    },
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100">{title}</CardTitle>
        {description && (
          <CardDescription className="text-zinc-400">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="[&_.recharts-cartesian-grid-horizontal]:stroke-zinc-800 [&_.recharts-cartesian-grid-vertical]:stroke-zinc-800"
        >
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 20,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={true}
              vertical={false}
              className="stroke-zinc-800"
            />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              padding={{ left: 20, right: 20 }}
              tick={{ fill: "#71717a" }} // text-zinc-500
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tick={{ fill: "#71717a" }} // text-zinc-500
            />
            <ChartTooltip
              cursor={{ fill: "rgba(39, 39, 42, 0.4)" }} // bg-zinc-800/40
              content={({ active, payload }) => {
                if (!active || !payload) return null;

                return (
                  <ChartTooltipContent
                    active={active}
                    payload={payload}
                    labelKey="name"
                    hideLabel
                    className="bg-zinc-900 border-zinc-800"
                  />
                );
              }}
            />
            <Bar
              dataKey="total"
              fill="var(--color-total)"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            >
              <LabelList
                dataKey="total"
                position="top"
                className="fill-zinc-100 text-xs"
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

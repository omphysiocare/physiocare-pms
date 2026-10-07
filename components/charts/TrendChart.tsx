"use client";

import { Box, Typography } from "@mui/material";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

import { chartColors, colors } from "@/theme/theme";

export interface TrendSeries<K extends string> {
  key: K;
  label: string;
  /** Defaults to the categorical palette in fixed order. */
  color?: string;
}

interface TrendChartProps<K extends string> {
  data: ReadonlyArray<{ label: string } & Partial<Record<K | string, string | number>>>;
  series: TrendSeries<K>[];
  variant?: "bar" | "line";
  height?: number;
  valueFormatter?: (value: number) => string;
  axisFormatter?: (value: number) => string;
  /** Use whole-number ticks (for counts). */
  integerAxis?: boolean;
}

/** Time-series chart with a single y-axis, legend and hover tooltip. */
export default function TrendChart<K extends string>({
  data,
  series,
  variant = "bar",
  height = 300,
  valueFormatter = (value) => value.toLocaleString("en-IN"),
  axisFormatter,
  integerAxis = false,
}: TrendChartProps<K>) {
  if (data.length === 0) {
    return (
      <Box sx={{ height, display: "grid", placeItems: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No data for this period
        </Typography>
      </Box>
    );
  }

  const withColor = series.map((item, index) => ({ ...item, color: item.color ?? chartColors[index] }));
  const common = {
    data: data as unknown as Record<string, string | number>[],
    responsive: true,
    style: { width: "100%", height },
    margin: { top: 8, right: 8, bottom: 0, left: 0 },
  };

  const axes = (
    <>
      <CartesianGrid vertical={false} stroke={colors.border} strokeDasharray="0" />
      <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: colors.border }} tick={{ fill: colors.textSecondary, fontSize: 12 }} minTickGap={8} />
      <YAxis
        tickLine={false}
        axisLine={false}
        width={56}
        allowDecimals={!integerAxis}
        tick={{ fill: colors.textSecondary, fontSize: 12 }}
        tickFormatter={(value: number) => (axisFormatter ?? valueFormatter)(value)}
      />
      <Tooltip
        formatter={(value) => valueFormatter(Number(value))}
        cursor={{ fill: "rgba(15, 23, 42, 0.04)", stroke: colors.borderStrong }}
        contentStyle={{ borderRadius: 8, borderColor: colors.border, fontSize: 13, boxShadow: "0 8px 24px rgba(15,23,42,0.08)" }}
        labelStyle={{ color: colors.text, fontWeight: 600, marginBottom: 4 }}
      />
      {withColor.length > 1 && (
        <Legend itemSorter={null} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13, color: colors.textSecondary, paddingTop: 8 }} />
      )}
    </>
  );

  if (variant === "line") {
    return (
      <LineChart {...common}>
        {axes}
        {withColor.map((item) => (
          <Line
            key={item.key}
            type="monotone"
            dataKey={item.key}
            name={item.label}
            stroke={item.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
          />
        ))}
      </LineChart>
    );
  }

  return (
    <BarChart {...common} barGap={2} barCategoryGap="24%">
      {axes}
      {withColor.map((item) => (
        <Bar key={item.key} dataKey={item.key} name={item.label} fill={item.color} radius={[4, 4, 0, 0]} maxBarSize={28} />
      ))}
    </BarChart>
  );
}

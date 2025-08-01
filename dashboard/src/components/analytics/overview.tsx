"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface OverviewProps {
  data: {
    date: string;
    memorized: number;
    reviewed: number;
  }[];
}

export function Overview({ data }: OverviewProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <XAxis
          dataKey="date"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="memorized"
          stroke="#8884d8"
          strokeWidth={2}
          name="الأحاديث المحفوظة"
        />
        <Line
          type="monotone"
          dataKey="reviewed"
          stroke="#82ca9d"
          strokeWidth={2}
          name="الأحاديث المراجعة"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

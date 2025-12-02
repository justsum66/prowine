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

interface TopWinesChartProps {
  data: Array<{ name: string; inquiries: number }>;
}

/**
 * 熱門酒款圖表
 */
export default function TopWinesChart({ data }: TopWinesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="inquiries" fill="#722f37" />
      </BarChart>
    </ResponsiveContainer>
  );
}


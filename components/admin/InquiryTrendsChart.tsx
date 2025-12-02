"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface InquiryTrendsChartProps {
  data: Array<{ date: string; count: number }>;
}

/**
 * 詢價單趨勢圖表
 */
export default function InquiryTrendsChart({ data }: InquiryTrendsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#722f37" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}


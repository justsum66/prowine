"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface InquiryTrendsChartProps {
  data: Array<{ date: string; count: number }>;
}

export function InquiryTrendsChart({ data }: InquiryTrendsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#8b5cf6"
          strokeWidth={2}
          name="詢價數"
          dot={{ fill: "#8b5cf6", r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface StatusDistributionChartProps {
  data: Array<{ name: string; value: number }>;
}

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Bar dataKey="value" fill="#8b5cf6" name="數量" />
      </BarChart>
    </ResponsiveContainer>
  );
}


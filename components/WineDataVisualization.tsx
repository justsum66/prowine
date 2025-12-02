"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

interface RatingData {
  name: string;
  decanter?: number;
  jamesSuckling?: number;
  robertParker?: number;
  wineSpectator?: number;
}

interface PriceTrend {
  year: number;
  price: number;
}

interface RegionDistribution {
  name: string;
  value: number;
  color: string;
}

interface WineDataVisualizationProps {
  ratings?: RatingData[];
  priceTrends?: PriceTrend[];
  regionDistribution?: RegionDistribution[];
}

const COLORS = ["#8B4513", "#D4AF37", "#C9A961", "#6B4423", "#A0522D"];

export default function WineDataVisualization({
  ratings,
  priceTrends,
  regionDistribution,
}: WineDataVisualizationProps) {
  return (
    <div className="space-y-12 py-12 bg-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-serif font-bold text-neutral-900 mb-4">
            數據視覺化
          </h2>
          <p className="text-neutral-600 text-lg">
            專業的數據分析與視覺呈現
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 評分對比圖表 */}
          {ratings && ratings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg p-6 border border-neutral-200 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-neutral-900 mb-6">
                評分對比
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ratings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  {ratings[0]?.decanter !== undefined && (
                    <Bar dataKey="decanter" fill="#8B4513" name="Decanter" />
                  )}
                  {ratings[0]?.jamesSuckling !== undefined && (
                    <Bar
                      dataKey="jamesSuckling"
                      fill="#D4AF37"
                      name="James Suckling"
                    />
                  )}
                  {ratings[0]?.robertParker !== undefined && (
                    <Bar
                      dataKey="robertParker"
                      fill="#C9A961"
                      name="Robert Parker"
                    />
                  )}
                  {ratings[0]?.wineSpectator !== undefined && (
                    <Bar
                      dataKey="wineSpectator"
                      fill="#6B4423"
                      name="Wine Spectator"
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* 價格趨勢圖 */}
          {priceTrends && priceTrends.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg p-6 border border-neutral-200 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-neutral-900 mb-6">
                價格趨勢
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={priceTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => `NT$ ${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#8B4513"
                    strokeWidth={2}
                    name="價格"
                    dot={{ fill: "#8B4513", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* 產區分布圖 */}
          {regionDistribution && regionDistribution.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg p-6 border border-neutral-200 shadow-sm lg:col-span-2"
            >
              <h3 className="text-xl font-semibold text-neutral-900 mb-6">
                產區分布
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={regionDistribution as Array<{ name: string; value: number; color?: string; [key: string]: unknown }>}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: { name?: string; percent?: number }) => {
                      const name = entry.name || "";
                      const percent = entry.percent || 0;
                      return `${name} ${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {regionDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}


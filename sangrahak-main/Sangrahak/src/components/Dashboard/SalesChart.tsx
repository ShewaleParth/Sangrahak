// src/components/Dashboard/SalesChart.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Extended mock data for demonstration
const fullMockData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sales: Math.floor(25000 + Math.random() * 10000),
    predicted: Math.floor(24000 + Math.random() * 10000)
  };
});

const SalesChart: React.FC = () => {
  const [period, setPeriod] = React.useState<1 | 7 | 30>(7);

  const chartData = React.useMemo(() => {
    return fullMockData.slice(-period);
  }, [period]);

  const summary = React.useMemo(() => {
    const totalSales = chartData.reduce((acc, curr) => acc + curr.sales, 0);
    const totalPredicted = chartData.reduce((acc, curr) => acc + curr.predicted, 0);
    const accuracy = 100 - (Math.abs(totalSales - totalPredicted) / totalSales * 100);
    return { totalSales, totalPredicted, accuracy };
  }, [chartData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sales vs Predicted Demand</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Performance overview</p>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[1, 7, 30].map((days) => (
            <button
              key={days}
              onClick={() => setPeriod(days as 1 | 7 | 30)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${period === days
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total Sales</p>
          <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
            ₹{(summary.totalSales / 1000).toFixed(1)}k
          </p>
        </div>
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Predicted</p>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
            ₹{(summary.totalPredicted / 1000).toFixed(1)}k
          </p>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
          <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Accuracy</p>
          <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
            {summary.accuracy.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-800" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval={period === 30 ? 5 : 0} // Show fewer ticks for 30 days
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                color: '#1f2937'
              }}
              formatter={(value: number, name: string) => [
                `₹${value.toLocaleString()}`,
                name === 'sales' ? 'Actual Sales' : 'Predicted'
              ]}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={period !== 30 ? { fill: '#3b82f6', strokeWidth: 2, r: 4 } : false}
              activeDot={{ r: 6 }}
              name="sales"
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#10b981"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 6 }}
              name="predicted"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default SalesChart;
// src/components/Dashboard/TopSKUsChart.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TopSKU } from '../../types';

interface TopSKUsChartProps {
  topSKUs?: TopSKU[];
}

const TopSKUsChart: React.FC<TopSKUsChartProps> = ({ topSKUs = [] }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top 5 SKUs by Predicted Demand</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">This month's forecast</p>
        </div>
      </div>
      
      {topSKUs.length > 0 ? (
        <>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSKUs} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  type="number" 
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  type="category"
                  dataKey="name"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={140}
                  tickFormatter={(value) => value.length > 20 ? value.substring(0, 20) + '...' : value}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [`${value} units`, 'Predicted Demand']}
                  labelFormatter={(label) => `Product: ${label}`}
                />
                <Bar 
                  dataKey="predictedDemand" 
                  fill="#6366f1" 
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topSKUs.slice(0, 3).map((sku, index) => (
              <div key={sku.sku} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{sku.sku}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Stock: {sku.currentStock}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-indigo-600 dark:text-indigo-400">{sku.predictedDemand}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">units</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400">No data available</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TopSKUsChart;
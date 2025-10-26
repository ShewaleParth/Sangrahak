import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { KPI } from '../../types';

interface KPICardProps {
  kpi: KPI;
  index: number;
}

const KPICard: React.FC<KPICardProps> = ({ kpi, index }) => {
  const Icon = Icons[kpi.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300"
      whileHover={{ y: -4 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">{kpi.title}</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{kpi.value}</p>
          </div>
        </div>
        
        <motion.div
          className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${
            kpi.changeType === 'positive'
              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : kpi.changeType === 'negative'
              ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.1 + 0.3 }}
        >
          {kpi.changeType === 'positive' ? (
            <Icons.TrendingUp className="w-3 h-3" />
          ) : kpi.changeType === 'negative' ? (
            <Icons.TrendingDown className="w-3 h-3" />
          ) : (
            <Icons.Minus className="w-3 h-3" />
          )}
          <span>{Math.abs(kpi.change)}%</span>
        </motion.div>
      </div>
      
      <div className="mt-4">
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <span>vs last week</span>
        </div>
      </div>
    </motion.div>
  );
};

export default KPICard;
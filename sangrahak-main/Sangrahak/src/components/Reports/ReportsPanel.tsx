import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

const ReportsPanel: React.FC = () => {
  const reports = [
    {
      id: 1,
      title: 'Inventory Summary Report',
      description: 'Complete overview of current inventory levels and valuation',
      type: 'PDF',
      lastGenerated: '2025-01-15',
      icon: 'Package',
      color: 'blue'
    },
    {
      id: 2,
      title: 'Top 10 Understocked SKUs',
      description: 'Products requiring immediate attention for restocking',
      type: 'Excel',
      lastGenerated: '2025-01-14',
      icon: 'TrendingDown',
      color: 'red'
    },
    {
      id: 3,
      title: 'Top 10 Overstocked SKUs',
      description: 'Products with excess inventory for optimization',
      type: 'PDF',
      lastGenerated: '2025-01-14',
      icon: 'TrendingUp',
      color: 'yellow'
    },
    {
      id: 4,
      title: 'Forecast Accuracy Report',
      description: 'Analysis of prediction accuracy and model performance',
      type: 'PDF',
      lastGenerated: '2025-01-13',
      icon: 'Target',
      color: 'green'
    },
    {
      id: 5,
      title: 'Depot Utilization Report',
      description: 'Warehouse capacity analysis and optimization suggestions',
      type: 'Excel',
      lastGenerated: '2025-01-12',
      icon: 'Warehouse',
      color: 'purple'
    },
    {
      id: 6,
      title: 'Supplier Performance Report',
      description: 'Vendor reliability and delivery performance metrics',
      type: 'PDF',
      lastGenerated: '2025-01-11',
      icon: 'Users',
      color: 'indigo'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      red: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
      yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
      green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      indigo: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">Generate and download comprehensive business reports</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Icons.Settings className="w-4 h-4" />
            <span>Configure Alerts</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Icons.Plus className="w-4 h-4" />
            <span>Custom Report</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Icons.FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">24</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Reports Generated</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Icons.Download className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">156</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Downloads</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Icons.Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">8</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Active Alerts</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Icons.Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">2h</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Generation</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {reports.map((report, index) => {
          const Icon = Icons[report.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
          
          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300"
              whileHover={{ y: -4 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${getColorClasses(report.color)}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded">
                  {report.type}
                </span>
              </div>
              
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{report.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{report.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span>Last generated</span>
                <span>{new Date(report.lastGenerated).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                  <Icons.Play className="w-4 h-4" />
                  <span>Generate</span>
                </button>
                <button className="flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <Icons.Download className="w-4 h-4" />
                </button>
                <button className="flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <Icons.Share className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Auto-Alert Setup */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Auto-Alert Configuration</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Set up automated notifications for key metrics</p>
          </div>
          <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
            Manage All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Low Stock Alerts', description: 'Get notified when inventory falls below reorder point', enabled: true },
            { title: 'Demand Spike Warnings', description: 'Alert when predicted demand exceeds 40% variance', enabled: true },
            { title: 'Depot Capacity Alerts', description: 'Notification when depot utilization exceeds 90%', enabled: false },
            { title: 'Forecast Accuracy', description: 'Weekly accuracy reports for demand predictions', enabled: true },
            { title: 'Supplier Performance', description: 'Monthly reports on vendor delivery performance', enabled: false },
            { title: 'Revenue Insights', description: 'Daily revenue and sales performance summaries', enabled: true }
          ].map((alert, index) => (
            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">{alert.title}</h4>
                <div className={`w-10 h-6 rounded-full relative transition-colors ${
                  alert.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    alert.enabled ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">{alert.description}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ReportsPanel;
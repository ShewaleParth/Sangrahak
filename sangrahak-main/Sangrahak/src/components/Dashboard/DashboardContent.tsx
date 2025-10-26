// src/components/Dashboard/DashboardContent.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import WelcomeBanner from './WelcomeBanner';
import KPICard from './KPICard';
import SalesChart from './SalesChart';
import TopSKUsChart from './TopSKUsChart';
import AlertsPanel from './AlertsPanel';
import  { dashboardAPI } from '../../services/api';
import { KPI, TopSKU } from '../../types';

const DashboardContent: React.FC = () => {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [topSKUs, setTopSKUs] = useState<TopSKU[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, skusResponse] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getTopSKUs()
        ]);

        setKpis(statsResponse.kpis);
        setTopSKUs(skusResponse.topSKUs);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <WelcomeBanner />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                  <div>
                    <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
                <div className="w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="w-48 h-6 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="w-48 h-6 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
          <div className="w-32 h-6 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <WelcomeBanner />
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <WelcomeBanner />
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <KPICard key={index} kpi={kpi} index={index} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <SalesChart />
        <TopSKUsChart topSKUs={topSKUs} />
      </div>

      {/* Alerts Panel */}
      <AlertsPanel />
    </motion.div>
  );
};

export default DashboardContent;
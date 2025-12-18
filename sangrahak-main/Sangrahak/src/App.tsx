// src/App.tsx - Refactored with React Router
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Navbar from './components/Layout/Navbar';
import InventoryTable from './components/Inventory/InventoryTable';
import DepotGrid from './components/Depots/DepotGrid';
import ForecastChart from './components/Forecasts/ForecastChart';
import ReportsPanel from './components/Reports/ReportsPanel';
import DashboardContent from './components/Dashboard/DashboardContent';
import { healthAPI } from './services/api';

interface ConnectionStatus {
  status: 'checking' | 'connected' | 'error';
  message?: string;
}

const AppContent: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ status: 'checking' });

  const navigate = useNavigate();
  const location = useLocation();

  // Extract active module from path, removing leading slash
  const activeModule = location.pathname.substring(1) || 'dashboard';

  // Check backend connection on app start
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await healthAPI.check();
        setConnectionStatus({
          status: 'connected',
          message: `Backend connected - Database: ${response.database}`
        });
        console.log('✅ Backend connection established:', response);
      } catch (error: any) {
        setConnectionStatus({
          status: 'error',
          message: error?.message || 'Failed to connect to backend server'
        });
        console.error('❌ Backend connection failed:', error);
      }
    };

    checkConnection();

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle retry connection
  const handleRetryConnection = (): void => {
    setConnectionStatus({ status: 'checking' });
    window.location.reload();
  };

  // Show loading while checking connection
  if (connectionStatus.status === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Connecting to backend...</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            Checking server health at localhost:5000
          </p>
        </motion.div>
      </div>
    );
  }

  // Handle Sidebar Navigation
  const handleNavigation = (itemId: string) => {
    navigate(`/${itemId}`);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Connection Status Indicator */}
      {connectionStatus.status === 'connected' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-1">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 dark:text-green-400 text-xs font-medium">
                Backend Connected
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Connection Error Banner */}
      {connectionStatus.status === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 right-4 z-50 max-w-sm w-full"
        >
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Backend Disconnected
                </h3>
                <div className="mt-1 text-xs text-red-700 dark:text-red-300">
                  <p>{connectionStatus.message}</p>
                </div>
                <div className="mt-2">
                  <button
                    onClick={handleRetryConnection}
                    className="text-xs font-medium text-red-700 dark:text-red-300 hover:text-red-600 dark:hover:text-red-200"
                  >
                    Retry connection &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeItem={activeModule}
        onItemClick={handleNavigation}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route
                  path="/dashboard"
                  element={
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                      <DashboardContent />
                    </motion.div>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                      <InventoryTable />
                    </motion.div>
                  }
                />
                <Route
                  path="/depots"
                  element={
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                      <DepotGrid />
                    </motion.div>
                  }
                />
                <Route
                  path="/forecasts"
                  element={
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                      <ForecastChart />
                    </motion.div>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                      <ReportsPanel />
                    </motion.div>
                  }
                />
                <Route
                  path="/alerts"
                  element={
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center mr-4">
                          <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Alerts Management</h2>
                          <p className="text-gray-600 dark:text-gray-400">System alerts and notifications</p>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">Detailed alerts management interface coming soon. Currently showing alerts in the dashboard.</p>
                    </motion.div>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mr-4">
                          <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
                          <p className="text-gray-600 dark:text-gray-400">Advanced analytics and insights</p>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">Advanced analytics features and detailed insights coming soon.</p>
                    </motion.div>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mr-4">
                          <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
                          <p className="text-gray-600 dark:text-gray-400">Application configuration</p>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Connection Status</h3>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-700 dark:text-green-400 text-sm">
                              {connectionStatus.message || 'Connected to backend'}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">Additional application settings and configuration options will be available here.</p>
                      </div>
                    </motion.div>
                  }
                />
              </Routes>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppContent;
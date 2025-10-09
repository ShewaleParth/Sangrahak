// src/App.tsx - NO AUTHENTICATION VERSION
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ status: 'checking' });

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

  // Show connection error if backend is not available
  if (connectionStatus.status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-8 h-8 text-red-600 dark:text-red-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Backend Connection Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {connectionStatus.message}
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mb-6">
            Make sure your backend server is running on <br />
            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
              http://localhost:5000
            </code>
          </p>
          <button
            onClick={handleRetryConnection}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            <details>
              <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                Troubleshooting
              </summary>
              <div className="mt-2 text-left space-y-1">
                <p>1. Start your backend server:</p>
                <code className="block bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs">
                  cd Major-/Backend/servers<br />
                  npm run dev
                </code>
                <p>2. Check if database is connected</p>
                <p>3. Verify API URL in environment</p>
              </div>
            </details>
          </div>
        </motion.div>
      </div>
    );
  }

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

  const renderMainContent = () => {
    switch (activeModule) {
      case 'inventory':
        return (
          <motion.div
            key="inventory"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <InventoryTable />
          </motion.div>
        );
      case 'depots':
        return (
          <motion.div
            key="depots"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <DepotGrid />
          </motion.div>
        );
      case 'forecasts':
        return (
          <motion.div
            key="forecasts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ForecastChart />
          </motion.div>
        );
      case 'reports':
        return (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ReportsPanel />
          </motion.div>
        );
      case 'alerts':
        return (
          <motion.div
            key="alerts"
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
        );
      case 'analytics':
        return (
          <motion.div
            key="analytics"
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
        );
      case 'settings':
        return (
          <motion.div
            key="settings"
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
        );
      default:
        return <DashboardContent />;
    }
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
      
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeItem={activeModule}
        onItemClick={setActiveModule}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {renderMainContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

// Main App component - No AuthProvider needed
export default AppContent;
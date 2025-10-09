import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { mockAlerts } from '../../data/mockData';
import { useTheme } from '../../hooks/useTheme';

const Navbar: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const unreadCount = mockAlerts.filter(alert => !alert.isRead).length;

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search inventory, SKUs, or reports..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4 ml-6">
          {/* Theme Toggle */}
          <motion.button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {theme === 'light' ? (
              <Icons.Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Icons.Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </motion.button>

          {/* Notifications */}
          <div className="relative">
            <motion.button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icons.Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
                >
                  {unreadCount}
                </motion.span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-4 max-h-96 overflow-y-auto"
                >
                  <div className="px-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  </div>
                  {mockAlerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-l-4 ${
                        alert.severity === 'high' 
                          ? 'border-l-red-500' 
                          : alert.severity === 'medium' 
                          ? 'border-l-yellow-500' 
                          : 'border-l-blue-500'
                      } ${!alert.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          alert.severity === 'high' 
                            ? 'bg-red-500' 
                            : alert.severity === 'medium' 
                            ? 'bg-yellow-500' 
                            : 'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">{alert.title}</h4>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{alert.description}</p>
                          <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
                            {new Date(alert.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile */}
          <div className="relative">
            <motion.button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">SC</span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="font-medium text-gray-900 dark:text-white text-sm">Sarah Chen</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Admin</p>
              </div>
              <Icons.ChevronDown className="w-4 h-4 text-gray-400" />
            </motion.button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2"
                >
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center space-x-3">
                    <Icons.User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">Profile</span>
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center space-x-3">
                    <Icons.Settings className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">Settings</span>
                  </button>
                  <hr className="my-2 border-gray-200 dark:border-gray-700" />
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center space-x-3 text-red-600 dark:text-red-400">
                    <Icons.LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
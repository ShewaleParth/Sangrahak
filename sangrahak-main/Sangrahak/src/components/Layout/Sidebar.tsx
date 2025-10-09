import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { navItems } from '../../data/mockData';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeItem: string;
  onItemClick: (itemId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, activeItem, onItemClick }) => {
  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen sticky top-0"
    >
      {/* Logo & Toggle */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <motion.div
          animate={{ opacity: isCollapsed ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="flex items-center space-x-3"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <Icons.Package className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-lg text-gray-900 dark:text-white">InventroOps</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Console</p>
            </div>
          )}
        </motion.div>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Icons.Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = Icons[item.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
          const isActive = activeItem === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-700 dark:text-blue-300' : ''}`} />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="font-medium"
                >
                  {item.label}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className={`flex items-center space-x-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">SC</span>
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex-1 min-w-0"
            >
              <p className="font-medium text-gray-900 dark:text-white text-sm truncate">Sarah Chen</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Admin</p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
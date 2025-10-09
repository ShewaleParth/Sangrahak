import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

const WelcomeBanner: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-8 text-white mb-8 relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-6 h-6 bg-white rounded-full"></div>
        <div className="absolute top-1/4 right-1/3 w-4 h-4 bg-white rounded-full"></div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold mb-2"
            >
              Good morning, Sarah! 👋
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-blue-100 text-lg"
            >
              Here's what's happening with your inventory today
            </motion.p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="hidden lg:flex items-center space-x-6"
          >
            <div className="text-center">
              <div className="flex items-center space-x-2 mb-1">
                <Icons.Package className="w-5 h-5 text-blue-200" />
                <span className="text-2xl font-bold">1,247</span>
              </div>
              <p className="text-blue-200 text-sm">Total Items</p>
            </div>
            <div className="w-px h-12 bg-blue-400/30"></div>
            <div className="text-center">
              <div className="flex items-center space-x-2 mb-1">
                <Icons.TrendingUp className="w-5 h-5 text-blue-200" />
                <span className="text-2xl font-bold">89%</span>
              </div>
              <p className="text-blue-200 text-sm">Forecast Accuracy</p>
            </div>
            <div className="w-px h-12 bg-blue-400/30"></div>
            <div className="text-center">
              <div className="flex items-center space-x-2 mb-1">
                <Icons.Clock className="w-5 h-5 text-blue-200" />
                <span className="text-2xl font-bold">24h</span>
              </div>
              <p className="text-blue-200 text-sm">Last Update</p>
            </div>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex flex-wrap items-center gap-4"
        >
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
            <Icons.Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <div className="flex items-center space-x-2 bg-green-500/20 backdrop-blur-sm rounded-lg px-4 py-2">
            <Icons.CheckCircle className="w-4 h-4 text-green-300" />
            <span className="text-sm font-medium">All Systems Operational</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WelcomeBanner;
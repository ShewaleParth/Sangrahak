import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { depotsAPI } from '../../services/api';
import { Depot } from '../../types';
import AddDepotModal from './AddDepotModel';
import EditDepotModal from './EditDepotModel';
import DepotInventory from './DepotInventory';

interface DepotStats {
  totalDepots: number;
  totalCapacity: number;
  totalUtilization: number;
  totalItems: number;
  avgUtilization: string;
  criticalCount: number;
  warningCount: number;
  normalCount: number;
  needsAttention: number;
}

const DepotGrid: React.FC = () => {
  const [depots, setDepots] = useState<Depot[]>([]);
  const [stats, setStats] = useState<DepotStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDepot, setEditingDepot] = useState<Depot | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedDepot, setSelectedDepot] = useState<Depot | null>(null);

  useEffect(() => {
    fetchDepots();
    fetchStats();
  }, []);

  const fetchDepots = async () => {
    try {
      setLoading(true);
      const response = await depotsAPI.getAll();
      setDepots(response.depots);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch depots');
      console.error('Error fetching depots:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await depotsAPI.getStats();
      setStats(response.stats);
    } catch (err) {
      console.error('Error fetching depot stats:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this depot?')) {
      return;
    }

    try {
      setDeletingId(id);
      await depotsAPI.delete(id);
      await fetchDepots();
      await fetchStats();
    } catch (err: any) {
      alert(err.message || 'Failed to delete depot');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    fetchDepots();
    fetchStats();
  };

  const handleEditSuccess = () => {
    setEditingDepot(null);
    fetchDepots();
    fetchStats();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      default:
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'bg-red-500';
    if (utilization >= 80) return 'bg-yellow-500';
    if (utilization >= 60) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Icons.AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
        <button
          onClick={fetchDepots}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (selectedDepot) {
    return (
      <DepotInventory
        depotName={selectedDepot.name}
        onBack={() => setSelectedDepot(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Depot Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Monitor capacity and manage depot operations</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Icons.Plus className="w-4 h-4" />
          <span>Add Depot</span>
        </button>
      </div>

      {depots.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center">
          <Icons.Warehouse className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Depots Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Get started by adding your first depot</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Icons.Plus className="w-4 h-4" />
            <span>Add Depot</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {depots.map((depot, index) => {
            const utilizationPercentage = (depot.currentUtilization / depot.capacity) * 100;

            return (
              <motion.div
                key={depot.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Icons.Warehouse className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{depot.name}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center">
                        <Icons.MapPin className="w-3 h-3 mr-1" />
                        {depot.location}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(depot.status)}`}>
                    {depot.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Capacity Utilization</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {utilizationPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        className={`h-2 rounded-full ${getUtilizationColor(utilizationPercentage)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${utilizationPercentage}%` }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Icons.Package className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Items Stored</span>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">{depot.itemsStored.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Icons.Maximize className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Max Capacity</span>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">{depot.capacity.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => setSelectedDepot(depot)}
                      className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors mb-3 shadow-md shadow-indigo-100 dark:shadow-none"
                    >
                      <Icons.Eye className="w-4 h-4" />
                      <span>View & Forecast Items</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingDepot(depot)}
                        className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        <Icons.Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(depot.id)}
                        disabled={deletingId === depot.id}
                        className="flex items-center justify-center p-2 text-red-500 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingId === depot.id ? (
                          <Icons.Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Icons.Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Depot Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
              <Icons.Warehouse className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDepots}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Depots</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
              <Icons.Package className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalItems.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg">
              <Icons.TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgUtilization}%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Utilization</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
              <Icons.AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.needsAttention}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Need Attention</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddDepotModal onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />
      )}

      {editingDepot && (
        <EditDepotModal
          depot={editingDepot}
          onClose={() => setEditingDepot(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default DepotGrid;
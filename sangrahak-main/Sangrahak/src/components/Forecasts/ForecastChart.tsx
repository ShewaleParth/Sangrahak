import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  Brain, Loader, Package, RefreshCw, X, Zap, Search,
  TrendingUp, Activity, ShieldCheck, AlertCircle, BarChart3,
  Database, Cpu, Clock, Calendar, ArrowUpRight, ArrowUpDown,
  ChevronUp, ChevronDown, CheckCircle2
} from 'lucide-react';
import { depotsAPI, forecastsAPI } from '../../services/api';
import { useLocation } from 'react-router-dom';
import { Product as GlobalProduct, Forecast as GlobalForecast } from '../../types';

const ForecastChart: React.FC = () => {
  const location = useLocation();
  const [products, setProducts] = useState<GlobalProduct[]>([]);
  const [depots, setDepots] = useState<{ id: string; name: string }[]>([]);
  const [selectedDepot, setSelectedDepot] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<GlobalProduct | null>(null);
  const [allForecasts, setAllForecasts] = useState<GlobalForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInputForm, setShowInputForm] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedForecast, setSelectedForecast] = useState<GlobalForecast | null>(null);
  const [bulkStatus, setBulkStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [sortBy, setSortBy] = useState<string>('eta_days');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [formData, setFormData] = useState<any>({
    currentStock: '',
    dailySales: '',
    weeklySales: '',
    reorderLevel: '',
    leadTime: '',
    brand: '',
    category: '',
    location: '',
    supplierName: '',
    forecastDays: 30
  });

  useEffect(() => {
    loadProducts();
    loadDepots();
  }, []);

  const loadDepots = async () => {
    try {
      const response = await depotsAPI.getAll();
      if (response.depots) setDepots(response.depots);
    } catch (err) {
      console.error('Error loading depots:', err);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsRes = await fetch('http://localhost:5001/api/ml/products');
      const productsData = await productsRes.json();
      const forecastsData = await forecastsAPI.getAll();
      const existingForecasts = forecastsData.forecasts || [];

      if (productsData.success) {
        setProducts(productsData.products);
        setAllForecasts(existingForecasts);

        const routerState = location.state as { selectedSku?: string; selectedDepot?: string } | null;
        if (routerState?.selectedDepot) setSelectedDepot(routerState.selectedDepot);
        if (routerState?.selectedSku) {
          const productToSelect = productsData.products.find((p: GlobalProduct) => p.sku === routerState.selectedSku);
          if (productToSelect) setTimeout(() => handleProductSelect(productToSelect), 100);
        }
      }
    } catch (err) {
      console.error('❌ Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: GlobalProduct) => {
    setSelectedProduct(product);
    const estimatedDailySales = product.stock ? Math.max(1, Math.round(product.stock * 0.05)) : 5;
    setFormData({
      currentStock: product.stock !== undefined ? product.stock.toString() : '0',
      dailySales: estimatedDailySales.toString(),
      weeklySales: (estimatedDailySales * 7).toString(),
      reorderLevel: '10',
      leadTime: '7',
      brand: product.brand || 'Generic',
      category: product.category || '',
      location: product.location || 'Warehouse A',
      supplierName: product.supplier || '',
      forecastDays: 30
    });
    setShowInputForm(true);
  };

  const handleBulkForecast = async () => {
    try {
      setBulkStatus('running');
      await forecastsAPI.precomputeAll();
      const refreshed = await forecastsAPI.getAll();
      if (refreshed.forecasts) setAllForecasts(refreshed.forecasts);
      setBulkStatus('done');
      setTimeout(() => setBulkStatus('idle'), 3000);
    } catch (err) {
      console.error('Bulk forecast failed:', err);
      setBulkStatus('idle');
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleRunPrediction = async () => {
    if (!selectedProduct) return;
    try {
      setPredicting(true);
      const payload = { ...formData, sku: selectedProduct.sku, productName: selectedProduct.name };
      const response = await fetch('http://localhost:5001/api/ml/predict/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success && data.forecast) {
        setAllForecasts(prev => [...prev.filter(f => f.sku !== data.forecast.sku), data.forecast]);
        setShowInputForm(false);
        setSelectedForecast(data.forecast);
        setShowResultModal(true);
      } else {
        throw new Error(data.error || 'Prediction failed');
      }
    } catch (err: any) {
      alert(`Forecast engine error: ${err.message}`);
    } finally {
      setPredicting(false);
    }
  };

  const getProcessedData = () => {
    return products
      .filter(p => (selectedDepot === 'all' || p.location === selectedDepot) &&
        (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase())))
      .map(p => {
        const fc = allForecasts.find(f => f.sku === p.sku);
        const eta_days = fc?.aiInsights?.eta_days ?? 999;
        let riskLevel: 'Critical' | 'Watch' | 'Safe' = 'Safe';
        if (eta_days < 7 || p.stock === 0) riskLevel = 'Critical';
        else if (eta_days < 15) riskLevel = 'Watch';

        return {
          ...p,
          forecast: fc,
          eta_days,
          burn_rate: fc?.inputParams?.dailySales ?? 0,
          riskLevel,
          recommendedAction: fc?.aiInsights?.message || 'Stable - No action needed'
        };
      })
      .sort((a, b) => {
        let valA: any = a[sortBy as keyof typeof a];
        let valB: any = b[sortBy as keyof typeof b];

        if (sortBy === 'eta_days') {
          valA = a.eta_days;
          valB = b.eta_days;
        }

        if (sortOrder === 'asc') return valA > valB ? 1 : -1;
        return valA < valB ? 1 : -1;
      });
  };

  const processedItems = getProcessedData();
  const criticalCount = processedItems.filter(p => p.riskLevel === 'Critical').length;
  const watchCount = processedItems.filter(p => p.riskLevel === 'Watch').length;

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400" />;
    return sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 text-blue-500" /> : <ChevronDown className="w-3 h-3 ml-1 text-blue-500" />;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium">Syncing Intelligence Engine...</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">Demand Intelligence</h2>
          <p className="text-gray-500 text-sm mt-1">Real-time stock-out predictions and ARIMA-powered reorder insights.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleBulkForecast}
            disabled={bulkStatus === 'running'}
            className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50"
          >
            {bulkStatus === 'running' ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            <span>{bulkStatus === 'running' ? 'Broadcasting Predictions...' : 'Generalized Forecast (All)'}</span>
          </button>

          <div className="flex items-center h-10 px-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
            <span className="text-xs font-bold text-red-700 dark:text-red-400">{criticalCount} High Risk</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
          <div className="relative w-full sm:w-80 group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-medium outline-none text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedDepot}
              onChange={(e) => setSelectedDepot(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 outline-none"
            >
              <option value="all">Global Catalog</option>
              {depots.map((d: any) => <option key={d._id || d.id} value={d.name}>{d.name}</option>)}
            </select>
            <button onClick={loadProducts} className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest cursor-pointer" onClick={() => handleSort('name')}>
                  <div className="flex items-center">Item {renderSortIcon('name')}</div>
                </th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center cursor-pointer" onClick={() => handleSort('riskLevel')}>
                  <div className="flex items-center justify-center">Risk {renderSortIcon('riskLevel')}</div>
                </th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest cursor-pointer" onClick={() => handleSort('stock')}>
                  <div className="flex items-center">Stock {renderSortIcon('stock')}</div>
                </th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {processedItems.map((p) => (
                <tr key={p.sku} className="hover:bg-blue-50/20 dark:hover:bg-blue-900/5 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400"><Package className="w-5 h-5" /></div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{p.name}</p>
                        <p className="text-[10px] font-mono text-gray-400">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${p.riskLevel === 'Critical' ? 'bg-red-100 text-red-600' :
                        p.riskLevel === 'Watch' ? 'bg-orange-100 text-orange-600' :
                          'bg-green-100 text-green-600'
                      }`}>
                      {p.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900 dark:text-white mb-1">{p.stock} units</span>
                      <div className="w-20 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full ${p.stock < 10 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, (p.stock / 100) * 100)}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleProductSelect(p)}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Compute AI Forecast</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RESULT MODAL - FIXED WHITE SCREEN & FONT ISSUES */}
      <AnimatePresence>
        {showResultModal && selectedForecast && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowResultModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 pb-4 flex items-start justify-between border-b border-gray-50 dark:border-gray-800">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Forecast Results</h3>
                    <p className="text-sm text-gray-500 font-medium">{selectedForecast.productName} • {selectedForecast.sku}</p>
                  </div>
                </div>
                <button onClick={() => setShowResultModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Summary Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`p-6 rounded-3xl border ${selectedForecast.aiInsights?.risk_level === 'Critical'
                      ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
                      : 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30'
                    }`}>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                    <p className={`text-lg font-bold ${selectedForecast.aiInsights?.risk_level === 'Critical' ? 'text-red-600' : 'text-green-600'}`}>
                      {selectedForecast.aiInsights?.status || 'Analyzing...'}
                    </p>
                  </div>
                  <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Stock Depth</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedForecast.aiInsights?.eta_days ?? 0} Days Remaining</p>
                  </div>
                  <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Recommended Order</p>
                    <p className="text-lg font-bold text-blue-600">{selectedForecast.aiInsights?.recommended_reorder || 0} Units</p>
                  </div>
                </div>

                {/* AI Text Block */}
                <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                  <div className="flex items-center space-x-2 mb-3">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Intelligence Summary</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium italic">
                    "{selectedForecast.alert || 'Confidence score indicates high accuracy for this prediction model.'}"
                  </p>
                </div>

                {/* Graph */}
                <div className="space-y-4">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">30-Day Projected Demand</p>
                  <div className="h-64 w-full bg-gray-50 dark:bg-gray-800/30 rounded-[2rem] border border-gray-100 dark:border-gray-800 p-6">
                    {selectedForecast.forecastData && selectedForecast.forecastData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={selectedForecast.forecastData}>
                          <defs>
                            <linearGradient id="chartColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.2} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1F2937', color: '#FFF', borderRadius: '12px', border: 'none', fontWeight: 'bold' }}
                            itemStyle={{ color: '#3b82f6' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="predicted"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#chartColor)"
                            animationDuration={1000}
                          />
                          <XAxis dataKey="date" hide />
                          <YAxis hide />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 italic">No forecast data generated</div>
                    )}
                  </div>
                </div>

                {/* Modal Footer Buttons */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => { setShowResultModal(false); logoutTimeout(); }}
                    className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-xl"
                  >
                    Approve & Close
                  </button>
                  <button
                    onClick={() => { setShowResultModal(false); setTimeout(() => setShowInputForm(true), 200); }}
                    className="px-8 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-2xl font-bold text-sm hover:bg-gray-200"
                  >
                    Adjust Input
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIG MODAL */}
      <AnimatePresence>
        {showInputForm && selectedProduct && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl relative z-[201] border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Configure AI Pipeline</h3>
                  <p className="text-sm text-gray-500 mt-1">Adjust neurons for <span className="text-blue-600 font-bold">{selectedProduct.name}</span></p>
                </div>
                <button onClick={() => setShowInputForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all active:scale-90"><X className="w-6 h-6 text-gray-400" /></button>
              </div>

              <div className="grid grid-cols-2 gap-6 pb-8">
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Stock Level</label><input type="number" name="currentStock" value={formData.currentStock} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500/10 text-gray-900 dark:text-white font-bold" /></div>
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Daily Sales</label><input type="number" name="dailySales" value={formData.dailySales} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500/10 text-gray-900 dark:text-white font-bold" /></div>
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Lead Time</label><input type="number" name="leadTime" value={formData.leadTime} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500/10 text-gray-900 dark:text-white font-bold" /></div>
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Epoch</label><select name="forecastDays" value={formData.forecastDays} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500/10 text-gray-900 dark:text-white font-bold"><option value={30}>30 Days</option><option value={60}>60 Days</option></select></div>
              </div>

              <button
                onClick={handleRunPrediction} disabled={predicting}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {predicting ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>{predicting ? 'Processing...' : 'Run Analysis Protocol'}</span>
              </button>
            </motion.div>
            <div onClick={() => setShowInputForm(false)} className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForecastChart;
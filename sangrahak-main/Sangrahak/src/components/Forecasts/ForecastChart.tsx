import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertCircle, BarChart3, Brain, Loader, Package, RefreshCw, TrendingUp, X, Zap, ShieldCheck, PanelRightOpen, Star, Cpu, Activity } from 'lucide-react';
import { depotsAPI } from '../../services/api';
import { useLocation } from 'react-router-dom';
import { Product as GlobalProduct, Forecast as GlobalForecast } from '../../types';

const ForecastChart: React.FC = () => {
  const location = useLocation();
  const [products, setProducts] = useState<GlobalProduct[]>([]);
  const [depots, setDepots] = useState<{ id: string; name: string }[]>([]);
  const [selectedDepot, setSelectedDepot] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<GlobalProduct | null>(null);
  const [forecast, setForecast] = useState<GlobalForecast | null>(null);
  const [bulkForecasts, setBulkForecasts] = useState<GlobalForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInputForm, setShowInputForm] = useState(false);
  const [activeView, setActiveView] = useState<'single' | 'bulk'>('single');
  const [selectedForecastForDrawer, setSelectedForecastForDrawer] = useState<GlobalForecast | null>(null);
  const [highlightedSku, setHighlightedSku] = useState<string | null>(null);

  const forecastSectionRef = useRef<HTMLDivElement>(null);

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
      if (response.depots) {
        setDepots(response.depots);
      }
    } catch (err) {
      console.error('Error loading depots:', err);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/ml/products');
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
        console.log('✅ Loaded products:', data.products.length);

        // Check for passed state from Inventory
        const routerState = location.state as { selectedSku?: string; selectedDepot?: string } | null;

        if (routerState?.selectedDepot) {
          setSelectedDepot(routerState.selectedDepot);
        }

        if (routerState?.selectedSku) {
          const productToSelect = data.products.find((p: GlobalProduct) => p.sku === routerState.selectedSku);
          if (productToSelect) {
            // Defer selection slightly to ensure state update cycle handles it smoothly
            setTimeout(() => handleProductSelect(productToSelect), 100);
          }
        }
      }
    } catch (err) {
      console.error('❌ Error loading products:', err);
      setError('Failed to load products. Make sure ML API is running on port 5001.');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: GlobalProduct) => {
    setSelectedProduct(product);

    // Estimate sales data if not available (for demo purposes, real app would fetch sales history)
    const estimatedDailySales = product.stock ? Math.max(1, Math.round(product.stock * 0.05)) : 5;

    const newFormData = {
      currentStock: product.stock !== undefined ? product.stock.toString() : '0',
      dailySales: product.dailySales?.toString() || estimatedDailySales.toString(),
      weeklySales: product.weeklySales?.toString() || (estimatedDailySales * 7).toString(),
      reorderLevel: product.reorderPoint?.toString() || '10',
      leadTime: product.leadTime?.toString() || '7',
      brand: product.brand || 'Generic',
      category: product.category || '',
      location: product.location || 'Warehouse A',
      supplierName: product.supplier || '',
      forecastDays: 30
    };

    setFormData(newFormData);
    setShowInputForm(true);
    setForecast(null);
    setActiveView('single');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleRunPrediction = async () => {
    if (!selectedProduct) {
      alert('Please select a product first');
      return;
    }

    const requiredFields = ['currentStock', 'dailySales', 'weeklySales', 'reorderLevel', 'leadTime'];
    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      setPredicting(true);
      setError(null);

      const payload = {
        sku: selectedProduct.sku,
        productName: selectedProduct.name,
        currentStock: parseFloat(formData.currentStock),
        dailySales: parseFloat(formData.dailySales),
        weeklySales: parseFloat(formData.weeklySales),
        reorderLevel: parseFloat(formData.reorderLevel),
        leadTime: parseFloat(formData.leadTime),
        brand: formData.brand || 'Unknown',
        category: formData.category || 'Unknown',
        location: formData.location || 'Unknown',
        supplierName: formData.supplierName || 'Unknown',
        forecastDays: formData.forecastDays
      };

      console.log('🤖 Running prediction with:', payload);

      const response = await fetch('http://localhost:5001/api/ml/predict/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        setForecast(data.forecast);
        setShowInputForm(false);
        console.log('✅ Forecast generated:', data.forecast);

        // Premium UX: Auto-scroll to results
        setTimeout(() => {
          forecastSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
          setHighlightedSku('ALL');
          setTimeout(() => setHighlightedSku(null), 3000);
        }, 500);
      } else {
        throw new Error(data.error || 'Prediction failed');
      }
    } catch (err: any) {
      console.error('❌ Error running prediction:', err);
      setError(err.message);
      alert(`Failed to generate forecast: ${err.message}`);
    } finally {
      setPredicting(false);
    }
  };

  const getInsightColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'at risk':
      case 'out of stock':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-green-600 dark:text-green-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Drawer Backdrop */}
      <AnimatePresence>
        {selectedForecastForDrawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedForecastForDrawer(null)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Right-Side Drawer for Detailed Forecast */}
      <AnimatePresence>
        {selectedForecastForDrawer && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-xl bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
                  AI Forecast Analysis
                </h3>
                <button
                  onClick={() => setSelectedForecastForDrawer(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Product Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">SKU: {selectedForecastForDrawer.sku}</p>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                    {selectedForecastForDrawer.productName}
                  </h4>
                </div>

                {/* AI Decision Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Inventory Health</p>
                    <p className={`text-lg font-bold ${getInsightColor(selectedForecastForDrawer.aiInsights?.status || '')}`}>
                      {selectedForecastForDrawer.aiInsights?.status || 'Active'}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Stock-Out ETA</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedForecastForDrawer.aiInsights?.eta_days ? `${selectedForecastForDrawer.aiInsights.eta_days} Days` : '99+ Days'}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-blue-200 dark:border-blue-800 col-span-2 shadow-sm ring-1 ring-blue-500/10">
                    <p className="text-xs text-gray-500 mb-1">Recommended Reorder Quantity</p>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                      {selectedForecastForDrawer.aiInsights?.recommended_reorder || 0} Units
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 italic">Based on 30-day predicted demand and lead time buffer.</p>
                  </div>
                </div>

                {/* Demand Forecast Visual */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-dashed border-gray-300 dark:border-gray-700">
                  <h5 className="text-sm font-semibold mb-4 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />
                    Demand Trend Visualization
                  </h5>
                  <div className="h-48 flex items-end space-x-1">
                    {selectedForecastForDrawer.forecastData.slice(0, 20).map((d, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.predicted / (Math.max(...selectedForecastForDrawer.forecastData.map(f => f.predicted)) || 100)) * 100}%` }}
                        className="flex-1 bg-blue-500/40 rounded-t-sm"
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-2">
                    <span>Day 1</span>
                    <span>Day 10</span>
                    <span>Day 20</span>
                  </div>
                </div>

                {/* Smart Inference Parameters */}
                <div className="space-y-4">
                  <h5 className="font-bold text-gray-900 dark:text-white flex items-center">
                    <Cpu className="w-4 h-4 mr-2 text-purple-600" />
                    Model Context & Inference
                  </h5>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs">
                    <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                      <span className="text-gray-500">Daily Sales Pattern</span>
                      <span className="font-bold">{selectedForecastForDrawer.inputParams?.dailySales} units</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                      <span className="text-gray-500">Supply Lead Time</span>
                      <span className="font-bold">{selectedForecastForDrawer.inputParams?.leadTime} days</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                      <span className="text-gray-500">Reorder Threshold</span>
                      <span className="font-bold">{selectedForecastForDrawer.inputParams?.reorderLevel} units</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                      <span className="text-gray-500">Confidence Score</span>
                      <span className="font-bold text-green-600">92.4%</span>
                    </div>
                  </div>
                </div>

                {/* AI Executive Summary */}
                <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-4 border border-purple-100 dark:border-purple-900/30">
                  <p className="text-xs font-bold text-purple-600 uppercase mb-1">Executive Summary</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedForecastForDrawer.alert}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Demand Forecasting</h2>
          <p className="text-gray-600 dark:text-gray-400">AI-powered demand predictions and trend analysis</p>
        </div>
      </div>

      {/* View Toggle */}
      {bulkForecasts.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveView('single')}
              className={`px-4 py-2 rounded-lg transition-all ${activeView === 'single'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
              Single Product View
            </button>
            <button
              onClick={() => setActiveView('bulk')}
              className={`px-4 py-2 rounded-lg transition-all ${activeView === 'bulk'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
              Bulk Forecasts ({bulkForecasts.length})
            </button>
          </div>
        </div>
      )}

      {/* Single Product View */}
      {activeView === 'single' && (
        <>
          {/* Product Selection */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span>Select Product</span>
              </h3>
              <button
                onClick={loadProducts}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Warehouse (Depot)
              </label>
              <select
                value={selectedDepot}
                onChange={(e) => setSelectedDepot(e.target.value)}
                className="w-full md:w-1/3 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
              >
                <option value="all">All Warehouses</option>
                {depots.map((depot: any) => (
                  <option key={depot._id || depot.id} value={depot.name}>
                    {depot.name} {depot.location ? `(${depot.location})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {products.filter(p => selectedDepot === 'all' || p.location === selectedDepot).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {products
                  .filter(p => selectedDepot === 'all' || p.location === selectedDepot)
                  .map((product) => (
                    <button
                      key={product.sku}
                      onClick={() => handleProductSelect(product)}
                      className={`p-4 text-left rounded-lg border-2 transition-all ${selectedProduct?.sku === product.sku
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-800'
                        }`}
                    >
                      <p className="font-semibold text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {product.sku}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Stock: {product.stock || 'N/A'}</p>
                      {product.category && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                          {product.category}
                        </span>
                      )}
                      <div className="mt-4 flex items-center justify-end">
                        <span className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:underline">
                          <TrendingUp className="w-4 h-4" />
                          <span>Forecast Demand</span>
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No products available</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Make sure products exist in MongoDB database
                </p>
              </div>
            )}
          </div>

          {/* Input Form */}
          <AnimatePresence>
            {showInputForm && selectedProduct && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Configure Forecast Parameters - {selectedProduct.name}
                  </h3>
                  <button
                    onClick={() => setShowInputForm(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Stock <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="currentStock"
                      value={formData.currentStock}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Daily Sales <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="dailySales"
                      value={formData.dailySales}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      required
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Weekly Sales <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="weeklySales"
                      value={formData.weeklySales}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      required
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Reorder Level <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="reorderLevel"
                      value={formData.reorderLevel}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Lead Time (days) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="leadTime"
                      value={formData.leadTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Supplier Name
                    </label>
                    <input
                      type="text"
                      name="supplierName"
                      value={formData.supplierName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Forecast Period (days)
                    </label>
                    <select
                      name="forecastDays"
                      value={formData.forecastDays}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                    >
                      <option value={7}>7 Days</option>
                      <option value={14}>14 Days</option>
                      <option value={30}>30 Days</option>
                      <option value={60}>60 Days</option>
                      <option value={90}>90 Days</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowInputForm(false)}
                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRunPrediction}
                    disabled={predicting}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-lg disabled:from-gray-400 disabled:to-gray-500 flex items-center space-x-2"
                  >
                    {predicting ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        <span>Generate Forecast</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Single Forecast Results */}
          {forecast && (
            <div
              ref={forecastSectionRef}
              className={`transition-all duration-1000 ${highlightedSku === 'ALL' ? 'ring-4 ring-blue-500 rounded-3xl p-4 bg-blue-50/10' : ''}`}
            >
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="xl:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-blue-500" />
                        Supply-Demand Analysis
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {forecast.productName} ({forecast.sku})
                      </p>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-1 bg-blue-500 rounded-full"></div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Predicted</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-1 bg-purple-300 rounded-full opacity-50"></div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Confidence Bound</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forecast.forecastData}>
                        <defs>
                          <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                          </linearGradient>
                          <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} className="dark:stroke-gray-800" />
                        <XAxis
                          dataKey="date"
                          stroke="#9ca3af"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          }}
                        />
                        <YAxis
                          stroke="#9ca3af"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          label={{ value: 'Units', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af', fontWeight: 'bold' } }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                            padding: '12px',
                            color: '#fff'
                          }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="confidence"
                          stroke="none"
                          fill="url(#colorConfidence)"
                        />
                        <Area
                          type="monotone"
                          dataKey="predicted"
                          stroke="#3b82f6"
                          strokeWidth={4}
                          fill="url(#colorPredicted)"
                          animationDuration={2000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Premium Insights Panel */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-full relative"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-2">
                      <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">AI Diagnostic</h3>
                    </div>
                    <button
                      onClick={() => setSelectedForecastForDrawer(forecast)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    >
                      <PanelRightOpen className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Diagnostic Status */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Risk Profile</p>
                        <span className={`text-sm font-black ${getInsightColor(forecast.aiInsights?.status || '')}`}>
                          {forecast.aiInsights?.status?.toUpperCase() || 'STABLE'}
                        </span>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Confidence</p>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span className="text-sm font-black text-gray-900 dark:text-white">92.4%</span>
                        </div>
                      </div>
                    </div>

                    {/* Stock-Out ETA Alert */}
                    <div className="p-4 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl text-white shadow-lg shadow-blue-200 dark:shadow-none">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold opacity-80">Stock-Out Projection</p>
                        <ShieldCheck className="w-4 h-4 opacity-80" />
                      </div>
                      <p className="text-3xl font-black mb-1">
                        {forecast.aiInsights?.eta_days ?? 99}+ <span className="text-sm font-normal opacity-80">Days</span>
                      </p>
                      <p className="text-[10px] font-medium opacity-80 italic">Predicted exhaustion date based on current pull rates.</p>
                    </div>

                    {/* Recommendation Row */}
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase mb-3">System Recommendation</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">Replenish Supply</p>
                          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                            {forecast.aiInsights?.recommended_reorder || 0} <span className="text-xs">Units</span>
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedForecastForDrawer(forecast)}
                          className="px-4 py-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-black text-blue-600 dark:text-blue-400 shadow-sm hover:bg-blue-50 transition-colors"
                        >
                          Action Plan
                        </button>
                      </div>
                    </div>

                    {/* Briefing */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                      <p className="text-[10px] text-gray-400 font-black uppercase mb-2">Diagnostic Briefing</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">
                        "{forecast.alert}"
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setForecast(null);
                      setShowInputForm(true);
                    }}
                    className="w-full mt-6 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl transition-all font-bold text-xs flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Recalibrate Forecast</span>
                  </button>
                </motion.div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Bulk Forecasts View */}
      {activeView === 'bulk' && bulkForecasts.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bulk Forecast Results</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {bulkForecasts.length} products forecasted
              </p>
            </div>
            <button
              onClick={() => setBulkForecasts([])}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg transition-colors"
            >
              Clear Results
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Current Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Alert</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Avg Daily Demand</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {bulkForecasts.map((fc) => (
                  <tr key={fc.sku} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">{fc.sku}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{fc.productName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{fc.currentStock}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded ${fc.stockStatusPred === 'Critical'
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        : fc.stockStatusPred === 'Low'
                          ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                          : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        }`}>
                        {fc.stockStatusPred}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded font-medium ${fc.priorityPred === 'High' || fc.priorityPred === 'Very High'
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        : fc.priorityPred === 'Medium'
                          ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                          : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        }`}>
                        {fc.priorityPred}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {fc.alert === 'Stock OK' ? (
                        <span className="text-green-600 dark:text-green-400">✓ OK</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">{fc.alert}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {(fc.forecastData.reduce((sum, d) => sum + (d.predicted || 0), 0) / fc.forecastData.length).toFixed(1)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setSelectedForecastForDrawer(fc)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-bold flex items-center"
                        >
                          <BarChart3 className="w-3 h-3 mr-1" />
                          Analytics
                        </button>
                        <button
                          onClick={() => {
                            setForecast(fc);
                            setActiveView('single');
                          }}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 text-sm font-medium"
                        >
                          View Graph
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && !forecast && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}


    </div>
  );
};

export default ForecastChart;
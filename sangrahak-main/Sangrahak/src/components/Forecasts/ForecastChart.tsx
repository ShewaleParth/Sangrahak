import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend } from 'recharts';
import { TrendingUp, Loader, AlertCircle, RefreshCw, Zap, Package, Brain, CheckCircle, AlertTriangle, BarChart3, X, ChevronDown, FileSpreadsheet } from 'lucide-react';
import ForecastCSVUpload from './ForecastCSVUpload';

interface ForecastDataPoint {
  date: string;
  predicted: number;
  actual?: number | null;
  confidence?: number;
}

interface InputParams {
  dailySales: number;
  weeklySales: number;
  reorderLevel: number;
  leadTime: number;
  brand?: string;
  category?: string;
  location?: string;
  supplierName?: string;
}

interface Forecast {
  itemId: string;
  productName: string;
  sku: string;
  currentStock: number;
  stockStatusPred: string;
  priorityPred: string;
  alert: string;
  forecastData: ForecastDataPoint[];
  inputParams?: InputParams;
  updatedAt?: string;
}

interface Product {
  sku: string;
  name: string;
  category?: string;
  stock?: number;
  supplier?: string;
}

interface FormData {
  currentStock: string;
  dailySales: string;
  weeklySales: string;
  reorderLevel: string;
  leadTime: string;
  brand: string;
  category: string;
  location: string;
  supplierName: string;
  forecastDays: number;
}

const ForecastChart: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [bulkForecasts, setBulkForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInputForm, setShowInputForm] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [activeView, setActiveView] = useState<'single' | 'bulk'>('single');
  
  const [formData, setFormData] = useState<FormData>({
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
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/ml/products');
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products);
        console.log('✅ Loaded products:', data.products.length);
      }
    } catch (err) {
      console.error('❌ Error loading products:', err);
      setError('Failed to load products. Make sure ML API is running on port 5001.');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      currentStock: product.stock?.toString() || '',
      dailySales: '',
      weeklySales: '',
      reorderLevel: '',
      leadTime: '',
      brand: '',
      category: product.category || '',
      location: '',
      supplierName: product.supplier || '',
      forecastDays: 30
    });
    setShowInputForm(true);
    setForecast(null);
    setActiveView('single');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRunPrediction = async () => {
    if (!selectedProduct) {
      alert('Please select a product first');
      return;
    }

    const requiredFields: (keyof FormData)[] = ['currentStock', 'dailySales', 'weeklySales', 'reorderLevel', 'leadTime'];
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

  const handleBulkForecastComplete = (forecasts: Forecast[]) => {
    setBulkForecasts(forecasts);
    setActiveView('bulk');
    setShowCSVUpload(false);
    console.log('✅ Bulk forecasts completed:', forecasts.length);
  };

  const getSeverityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'very high':
      case 'high':
        return 'from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400';
      case 'medium':
        return 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400';
      default:
        return 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400';
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Demand Forecasting</h2>
          <p className="text-gray-600 dark:text-gray-400">AI-powered demand predictions and trend analysis</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCSVUpload(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-lg"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Bulk Forecast (CSV)</span>
          </button>
        </div>
      </div>

      {/* View Toggle */}
      {bulkForecasts.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveView('single')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeView === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Single Product View
            </button>
            <button
              onClick={() => setActiveView('bulk')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeView === 'bulk'
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

            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {products.map((product) => (
                  <button
                    key={product.sku}
                    onClick={() => handleProductSelect(product)}
                    className={`p-4 text-left rounded-lg border-2 transition-all ${
                      selectedProduct?.sku === product.sku
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
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Main Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="xl:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Demand Forecast</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {forecast.productName} ({forecast.sku})
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Predicted</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-300 rounded-full opacity-50"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Confidence</span>
                    </div>
                  </div>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecast.forecastData}>
                      <defs>
                        <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                        </linearGradient>
                        <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9ca3af"
                        fontSize={12}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                      />
                      <YAxis 
                        stroke="#9ca3af"
                        fontSize={12}
                        label={{ value: 'Units', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                          padding: '12px'
                        }}
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          });
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="confidence"
                        stroke="none"
                        fill="url(#colorConfidence)"
                        fillOpacity={1}
                      />
                      <Area
                        type="monotone"
                        dataKey="predicted"
                        stroke="#10b981"
                        strokeWidth={3}
                        fill="url(#colorPredicted)"
                        fillOpacity={1}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Insights Panel */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 overflow-y-auto max-h-[600px]"
              >
                <div className="flex items-center space-x-2 mb-6">
                  <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Insights</h3>
                </div>

                <div className="space-y-4">
                  {/* Stock Status */}
                  <div className={`p-4 bg-gradient-to-r rounded-lg border ${getSeverityColor(forecast.priorityPred)}`}>
                    <div className="flex items-center space-x-2 mb-2">
                      {forecast.priorityPred === 'High' || forecast.priorityPred === 'Very High' ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      <span className="font-medium">{forecast.stockStatusPred}</span>
                    </div>
                    <p className="text-sm">
                      Priority: <strong>{forecast.priorityPred}</strong>
                    </p>
                    <p className="text-sm mt-1">
                      Current Stock: <strong>{forecast.currentStock}</strong>
                    </p>
                  </div>

                  {/* Alert */}
                  {forecast.alert !== 'Stock OK' && (
                    <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <span className="font-medium text-red-800 dark:text-red-300">Action Required</span>
                      </div>
                      <p className="text-red-700 dark:text-red-400 text-sm">
                        {forecast.alert}
                      </p>
                    </div>
                  )}

                  {/* Forecast Summary */}
                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-center space-x-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-medium text-indigo-800 dark:text-indigo-300">Forecast Summary</span>
                    </div>
                    <div className="space-y-2 text-sm text-indigo-700 dark:text-indigo-400">
                      <div className="flex justify-between">
                        <span>Total Predicted Demand:</span>
                        <strong>
                          {forecast.forecastData.reduce((sum, d) => sum + (d.predicted || 0), 0).toFixed(0)} units
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Daily Demand:</span>
                        <strong>
                          {(forecast.forecastData.reduce((sum, d) => sum + (d.predicted || 0), 0) / forecast.forecastData.length).toFixed(1)} units
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Forecast Period:</span>
                        <strong>{forecast.forecastData.length} days</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Confidence:</span>
                        <strong>
                          {(forecast.forecastData.reduce((sum, d) => sum + (d.confidence || 0), 0) / forecast.forecastData.length * 100).toFixed(0)}%
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Input Parameters */}
                  {forecast.inputParams && (
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2 mb-3">
                        <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <span className="font-medium text-gray-800 dark:text-gray-300">Input Parameters</span>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                        <p>Daily Sales: <strong>{forecast.inputParams.dailySales}</strong></p>
                        <p>Weekly Sales: <strong>{forecast.inputParams.weeklySales}</strong></p>
                        <p>Reorder Level: <strong>{forecast.inputParams.reorderLevel}</strong></p>
                        <p>Lead Time: <strong>{forecast.inputParams.leadTime} days</strong></p>
                        {forecast.inputParams.brand && <p>Brand: <strong>{forecast.inputParams.brand}</strong></p>}
                        {forecast.inputParams.location && <p>Location: <strong>{forecast.inputParams.location}</strong></p>}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setForecast(null);
                    setShowInputForm(true);
                  }}
                  className="w-full mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Generate New Forecast</span>
                </button>
              </motion.div>
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
                      <span className={`px-2 py-1 text-xs rounded ${
                        fc.stockStatusPred === 'Critical'
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                          : fc.stockStatusPred === 'Low'
                          ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                          : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      }`}>
                        {fc.stockStatusPred}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded font-medium ${
                        fc.priorityPred === 'High' || fc.priorityPred === 'Very High'
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
                      <button
                        onClick={() => {
                          setForecast(fc);
                          setActiveView('single');
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        View Details
                      </button>
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

      {/* CSV Upload Modal */}
      {showCSVUpload && (
        <ForecastCSVUpload
          onClose={() => setShowCSVUpload(false)}
          onForecastComplete={handleBulkForecastComplete}
        />
      )}
    </div>
  );
};

export default ForecastChart;
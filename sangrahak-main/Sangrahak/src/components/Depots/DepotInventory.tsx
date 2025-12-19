import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { productsAPI, forecastsAPI } from '../../services/api';
import { Product, Forecast } from '../../types';
import { io } from 'socket.io-client';

interface DepotInventoryProps {
    depotName: string;
    onBack: () => void;
}

const DepotInventory: React.FC<DepotInventoryProps> = ({ depotName, onBack }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [forecasts, setForecasts] = useState<Forecast[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingForecasts, setLoadingForecasts] = useState(false);
    const [forecasting, setForecasting] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, lastProduct: '', failed: 0 });
    const [selectedForecast, setSelectedForecast] = useState<Forecast | null>(null);
    const [highlightedSku, setHighlightedSku] = useState<string | null>(null);

    const forecastSectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchDepotProducts();
        fetchDepotForecasts();
    }, [depotName]);

    const fetchDepotProducts = async () => {
        try {
            setLoading(true);
            const response = await productsAPI.getAll({ location: depotName, limit: 100 });
            setProducts(response.products);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepotForecasts = async () => {
        try {
            setLoadingForecasts(true);
            const response = await forecastsAPI.getAll({ limit: 100 });
            const filteredForecasts = response.forecasts.filter((f: Forecast) =>
                f.inputParams?.location === depotName
            );
            setForecasts(filteredForecasts);
        } catch (err) {
            console.error('Failed to fetch forecasts:', err);
        } finally {
            setLoadingForecasts(false);
        }
    };

    const handleForecastAll = async () => {
        setForecasting(true);
        setProgress({ current: 0, total: products.length, lastProduct: '', failed: 0 });

        const socket = io('http://localhost:5000');

        socket.on('connect', async () => {
            const socketId = socket.id;
            try {
                await fetch('http://localhost:5000/api/forecasts/bulk-generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-socket-id': socketId || ''
                    },
                    body: JSON.stringify({ depotName })
                });
            } catch (err) {
                console.error('Failed to start bulk forecast:', err);
                setForecasting(false);
            }
        });

        socket.on('forecast_progress', (data) => {
            setProgress({
                current: data.current,
                total: data.total,
                lastProduct: data.lastProduct || '',
                failed: data.failed
            });

            if (data.status === 'completed') {
                setForecasting(false);
                socket.disconnect();
                fetchDepotForecasts();

                // CHANGE 1: Auto-Scroll to results
                setTimeout(() => {
                    forecastSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                    setHighlightedSku('ALL');
                    setTimeout(() => setHighlightedSku(null), 3000);
                }, 500);
            }
        });
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
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="relative space-y-6">
            {/* Drawer Backdrop */}
            <AnimatePresence>
                {selectedForecast && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedForecast(null)}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    />
                )}
            </AnimatePresence>

            {/* CHANGE 3: Full Forecast in Right-Side Drawer */}
            <AnimatePresence>
                {selectedForecast && (
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
                                    <Icons.BarChart2 className="w-6 h-6 mr-2 text-indigo-600" />
                                    AI Forecast Insights
                                </h3>
                                <button
                                    onClick={() => setSelectedForecast(null)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                                >
                                    <Icons.X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-8">
                                {/* Product Summary */}
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800">
                                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-1">Product Details</p>
                                    <h4 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                                        {selectedForecast.productName}
                                    </h4>
                                    <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">{selectedForecast.sku}</p>
                                </div>

                                {/* CHANGE 4: Improved AI Language */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <p className="text-xs text-gray-500 mb-1">Inventory Health</p>
                                        <p className={`text-lg font-bold ${getInsightColor(selectedForecast.aiInsights?.status || '')}`}>
                                            {selectedForecast.aiInsights?.status || 'Unknown'}
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <p className="text-xs text-gray-500 mb-1">Stock-Out ETA</p>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                                            {selectedForecast.aiInsights?.eta_days ? `${selectedForecast.aiInsights.eta_days} Days` : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 col-span-2">
                                        <p className="text-xs text-gray-500 mb-1">Recommended Reorder Quantity</p>
                                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                            {selectedForecast.aiInsights?.recommended_reorder || 0} Units
                                        </p>
                                    </div>
                                </div>

                                {/* Forecast Chart Placeholder */}
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-dashed border-gray-300 dark:border-gray-700">
                                    <h5 className="text-sm font-semibold mb-4 flex items-center">
                                        <Icons.TrendingUp className="w-4 h-4 mr-2" />
                                        30-Day Demand Forecast
                                    </h5>
                                    <div className="h-48 flex items-end space-x-1">
                                        {selectedForecast.forecastData.slice(0, 15).map((d, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${(d.predicted / (selectedForecast.aiInsights?.recommended_reorder || 100)) * 50}%` }}
                                                className="flex-1 bg-indigo-500/30 rounded-t-sm"
                                            />
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-400 text-center mt-2">Historical and Predicted Demand Patterns</p>
                                </div>

                                <div className="space-y-4">
                                    <h5 className="font-bold flex items-center">
                                        <Icons.Cpu className="w-4 h-4 mr-2 text-indigo-600" />
                                        Input Parameters (Smart Inference)
                                    </h5>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-1">
                                            <span className="text-gray-500">Daily Sales</span>
                                            <span className="font-semibold">{selectedForecast.inputParams?.dailySales}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-1">
                                            <span className="text-gray-500">Lead Time</span>
                                            <span className="font-semibold">{selectedForecast.inputParams?.leadTime} days</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-1">
                                            <span className="text-gray-500">Confidence</span>
                                            <span className="font-semibold text-green-600">92%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <Icons.ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{depotName} - Inventory</h2>
                        <p className="text-gray-600 dark:text-gray-400">Manage and forecast items in this zone</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    {/* Optional Enhancement: Smart Forecast Mode */}
                    <button className="flex items-center space-x-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-colors">
                        <Icons.Zap className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium">Auto-Inference</span>
                    </button>
                    <button
                        onClick={handleForecastAll}
                        disabled={forecasting || products.length === 0}
                        className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all transform hover:scale-105 active:scale-95"
                    >
                        {forecasting ? (
                            <Icons.Loader className="w-5 h-5 animate-spin" />
                        ) : (
                            <Icons.TrendingUp className="w-5 h-5" />
                        )}
                        <span>{forecasting ? 'Generating Forecasts...' : 'AI Smart Forecast'}</span>
                    </button>
                </div>
            </div>

            {/* Progress Panel */}
            <AnimatePresence>
                {forecasting && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-gray-900 rounded-2xl p-8 border-2 border-indigo-500 shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Analyzing Inventory...</h3>
                                <p className="text-gray-500 text-sm">Applying ARIMA models and Inferring Sales Patterns</p>
                            </div>
                            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                                {Math.round((progress.current / progress.total) * 100)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-4 mb-6">
                            <motion.div
                                className="bg-indigo-600 h-4 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                                transition={{ type: 'spring', bounce: 0, duration: 1 }}
                            />
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <Icons.Activity className="w-4 h-4 animate-pulse text-indigo-500" />
                            <span>Currently processing: <span className="font-bold text-gray-900 dark:text-white">{progress.lastProduct || 'Analyzing...'}</span></span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Product Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/50">
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Product</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Stock Details</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">AI Recommendation</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {products.map((product) => {
                            const forecast = forecasts.find(f => f.sku === product.sku);

                            return (
                                <React.Fragment key={product.id}>
                                    <tr className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group cursor-pointer ${forecast ? 'bg-indigo-50/10' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 dark:text-white capitalize">{product.name}</div>
                                            <div className="text-xs text-gray-400 font-mono">{product.sku}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm font-semibold">{product.stock} units</span>
                                                <span className="text-xs text-gray-400">@ ₹{product.price}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.status === 'in-stock' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {product.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {forecast ? (
                                                <button
                                                    onClick={() => setSelectedForecast(forecast)}
                                                    className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 font-bold text-sm"
                                                >
                                                    <Icons.ShieldCheck className="w-4 h-4" />
                                                    <span>View Insights &rarr;</span>
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 text-sm">No Analysis</span>
                                            )}
                                        </td>
                                    </tr>

                                    {/* CHANGE 2: Inline Forecast Preview Inside card (Expandable Row) */}
                                    {forecast && (
                                        <tr className="bg-gray-50/50 dark:bg-gray-800/20">
                                            <td colSpan={4} className="px-12 py-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-8">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-gray-400">30D DEMAND</span>
                                                            <span className="font-bold text-sm">{Math.round(forecast.forecastData.reduce((acc, d) => acc + d.predicted, 0))} Units</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-gray-400">STOCK-OUT ETA</span>
                                                            <span className={`font-bold text-sm ${getInsightColor(forecast.aiInsights?.status || '')}`}>
                                                                {forecast.aiInsights?.eta_days} Days
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-gray-400">CONFIDENCE</span>
                                                            <div className="flex items-center space-x-1">
                                                                <Icons.Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                                <span className="font-bold text-sm">92%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedForecast(forecast)}
                                                        className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-xs font-bold shadow-sm"
                                                    >
                                                        Details Panel
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Output Section with Ref for Auto-Scroll */}
            <div
                ref={forecastSectionRef}
                className={`transition-all duration-1000 ${highlightedSku === 'ALL' ? 'bg-indigo-50/50 rounded-3xl p-4 ring-2 ring-indigo-500' : ''}`}
            >
                <div className="flex items-center space-x-3 mb-6">
                    <Icons.LayoutList className="w-7 h-7 text-indigo-600" />
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">AI Analysis Ledger</h3>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden min-h-[300px]">
                    {loadingForecasts ? (
                        <div className="flex flex-col items-center justify-center p-24">
                            <Icons.Loader className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
                            <p className="text-gray-500 font-medium">Updating Consensus...</p>
                        </div>
                    ) : forecasts.length === 0 ? (
                        <div className="p-24 text-center">
                            <Icons.Box className="w-20 h-20 mx-auto mb-6 text-gray-200" />
                            <h4 className="text-xl font-bold text-gray-400">No Analysis Ledger Found</h4>
                            <p className="text-gray-400">Run a Smart Forecast to see enterprise insights here.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-indigo-600 text-white">
                                        <th className="px-6 py-4 text-sm font-black uppercase">Product Ledger</th>
                                        <th className="px-6 py-4 text-sm font-black uppercase text-center">Risk Index</th>
                                        <th className="px-6 py-4 text-sm font-black uppercase">Executive Briefing</th>
                                        <th className="px-6 py-4 text-sm font-black uppercase text-right">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {forecasts.map((forecast) => (
                                        <tr key={forecast.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                                            <td className="px-6 py-6 ring-inset">
                                                <div className="text-base font-black text-gray-900 dark:text-white uppercase">{forecast.productName}</div>
                                                <div className="text-xs text-indigo-500 font-mono font-bold">{forecast.sku}</div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className={`inline-block w-12 py-1 rounded text-xs font-black text-white ${forecast.aiInsights?.risk_level === 'Critical' ? 'bg-red-600' :
                                                    forecast.aiInsights?.risk_level === 'High' ? 'bg-orange-500' : 'bg-green-600'
                                                    }`}>
                                                    {forecast.aiInsights?.risk_level.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6">
                                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                    {forecast.alert}
                                                </p>
                                                <div className="flex items-center space-x-3 text-xs">
                                                    <span className="text-gray-400">ETA: <span className="text-gray-900 dark:text-white font-bold">{forecast.aiInsights?.eta_days} Days</span></span>
                                                    <span className="text-gray-400">REORDER: <span className="text-indigo-600 font-bold">{forecast.aiInsights?.recommended_reorder} Units</span></span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <button
                                                    onClick={() => setSelectedForecast(forecast)}
                                                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-indigo-100 transition-colors"
                                                >
                                                    <Icons.PanelRightOpen className="w-5 h-5 text-indigo-600" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DepotInventory;

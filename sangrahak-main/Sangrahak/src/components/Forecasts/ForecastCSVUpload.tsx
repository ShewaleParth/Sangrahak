import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, FileSpreadsheet, CheckCircle, AlertCircle, Loader, Download, Filter, Zap, Info } from 'lucide-react';
import Papa from 'papaparse'; // ✅ added for streaming CSV parsing

interface ForecastCSVUploadProps {
  onClose: () => void;
  onForecastComplete: (forecasts: any[]) => void;
}

interface CSVProduct {
  sku: string;
  productName: string;
  currentStock: number;
  dailySales: number;
  weeklySales: number;
  reorderLevel: number;
  leadTime: number;
  brand?: string;
  category?: string;
  location?: string;
  supplierName?: string;
}

interface ProcessingStatus {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  current: string;
}

const ForecastCSVUpload: React.FC<ForecastCSVUploadProps> = ({ onClose, onForecastComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [products, setProducts] = useState<CSVProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<CSVProduct[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileProcessed, setFileProcessed] = useState(false);

  const [filters, setFilters] = useState({
    category: 'all',
    location: 'all',
    brand: 'all',
    minStock: '',
    maxStock: ''
  });

  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [forecastDays, setForecastDays] = useState(30);

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];
  const locations = ['all', ...new Set(products.map(p => p.location).filter(Boolean))];
  const brands = ['all', ...new Set(products.map(p => p.brand).filter(Boolean))];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please select a valid CSV file');
        return;
      }
      setFile(selectedFile);
      setError(null);
      processCSV(selectedFile); // ✅ will now handle large files asynchronously
    }
  };

  // ✅ Optimized processCSV using PapaParse (streaming + worker-based)
  const processCSV = (file: File) => {
    setUploading(true);
    setError(null);
    setProcessingStatus({ total: 0, processed: 0, successful: 0, failed: 0, current: 'Initializing...' });

    const parsedProducts: CSVProduct[] = [];
    const errors: string[] = [];
    let rowCount = 0;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      worker: true, // runs parsing in a separate thread
      chunkSize: 1024 * 1024, // read 1MB at a time (safe for large files)
      step: (results: { data: any; }) => {
        const row = results.data as any;
        rowCount++;

        try {
          const sku = row.sku?.trim();
          const productName = row.productName?.trim();
          if (!sku || !productName) return;

          const product: CSVProduct = {
            sku,
            productName,
            currentStock: parseFloat(row.currentStock) || 0,
            dailySales: parseFloat(row.dailySales) || 0,
            weeklySales: parseFloat(row.weeklySales) || 0,
            reorderLevel: parseFloat(row.reorderLevel) || 0,
            leadTime: parseFloat(row.leadTime) || 0,
            brand: row.brand || 'Unknown',
            category: row.category || 'Uncategorized',
            location: row.location || 'Unknown',
            supplierName: row.supplierName || 'Unknown',
          };

          if (product.dailySales > 0 && product.weeklySales > 0) {
            parsedProducts.push(product);
          } else {
            errors.push(`Row ${rowCount}: Invalid sales values`);
          }

          if (rowCount % 5000 === 0) {
            setProcessingStatus({
              total: 0,
              processed: rowCount,
              successful: parsedProducts.length,
              failed: errors.length,
              current: `Reading row ${rowCount.toLocaleString()}`,
            });
          }
        } catch (err: any) {
          errors.push(`Row ${rowCount}: ${err.message}`);
        }
      },
      complete: () => {
        console.log(`✅ Parsed ${parsedProducts.length} rows successfully`);

        if (parsedProducts.length === 0) {
          setError('No valid products found in CSV. Please check the data format.');
        } else {
          setProducts(parsedProducts);
          setFilteredProducts(parsedProducts);
          setFileProcessed(true);
          setSelectedProducts(new Set(parsedProducts.map(p => p.sku)));

          if (errors.length)
            setError(`Loaded ${parsedProducts.length} products successfully. ${errors.length} rows had issues.`);
        }

        setUploading(false);
        setProcessingStatus(null);
      },
      error: (err: { message: string; }) => {
        setError('Failed to process CSV: ' + err.message);
        setUploading(false);
      },
    });
  };

  const applyFilters = () => {
    let filtered = [...products];

    if (filters.category !== 'all') {
      filtered = filtered.filter(p => p.category === filters.category);
    }
    if (filters.location !== 'all') {
      filtered = filtered.filter(p => p.location === filters.location);
    }
    if (filters.brand !== 'all') {
      filtered = filtered.filter(p => p.brand === filters.brand);
    }
    if (filters.minStock) {
      filtered = filtered.filter(p => p.currentStock >= parseFloat(filters.minStock));
    }
    if (filters.maxStock) {
      filtered = filtered.filter(p => p.currentStock <= parseFloat(filters.maxStock));
    }

    setFilteredProducts(filtered);
  };

  const toggleProductSelection = (sku: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(sku)) {
      newSelected.delete(sku);
    } else {
      newSelected.add(sku);
    }
    setSelectedProducts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.sku)));
    }
  };

  const runBulkForecasting = async () => {
    const productsToForecast = products.filter(p => selectedProducts.has(p.sku));
    
    if (productsToForecast.length === 0) {
      setError('Please select at least one product');
      return;
    }

    setProcessing(true);
    setError(null);

    const forecasts: any[] = [];
    let successCount = 0;
    let failCount = 0;
    const failedProducts: string[] = [];

    try {
      for (let i = 0; i < productsToForecast.length; i++) {
        const product = productsToForecast[i];
        
        setProcessingStatus({
          total: productsToForecast.length,
          processed: i,
          successful: successCount,
          failed: failCount,
          current: product.productName
        });

        try {
          const payload = {
            sku: product.sku,
            productName: product.productName,
            currentStock: product.currentStock,
            dailySales: product.dailySales,
            weeklySales: product.weeklySales,
            reorderLevel: product.reorderLevel,
            leadTime: product.leadTime,
            brand: product.brand || 'Unknown',
            category: product.category || 'Unknown',
            location: product.location || 'Unknown',
            supplierName: product.supplierName || 'Unknown',
            forecastDays: forecastDays
          };

          console.log(`🔄 Processing ${i + 1}/${productsToForecast.length}: ${product.sku}`);

          const response = await fetch('http://localhost:5001/api/ml/predict/custom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const data = await response.json();

          if (data.success && data.forecast) {
            forecasts.push(data.forecast);
            successCount++;
            console.log(`✅ Success: ${product.sku}`);
          } else {
            failCount++;
            failedProducts.push(`${product.sku}: ${data.error || 'Unknown error'}`);
            console.error(`❌ Failed: ${product.sku}`, data.error);
          }
        } catch (err: any) {
          failCount++;
          failedProducts.push(`${product.sku}: ${err.message}`);
          console.error(`❌ Error processing ${product.sku}:`, err);
        }

        // Small delay to prevent overwhelming the server
        if (i < productsToForecast.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Final status update
      setProcessingStatus({
        total: productsToForecast.length,
        processed: productsToForecast.length,
        successful: successCount,
        failed: failCount,
        current: 'Complete'
      });

      if (successCount > 0) {
        onForecastComplete(forecasts);
        
        let message = `Bulk forecast completed!\n\n✅ Successful: ${successCount}\n❌ Failed: ${failCount}`;
        if (failedProducts.length > 0 && failedProducts.length <= 5) {
          message += `\n\nFailed products:\n${failedProducts.join('\n')}`;
        }
        
        alert(message);
        
        // Close after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(`All ${failCount} forecasts failed. Please check:\n- API is running on port 5001\n- Data values are valid\n- Network connection`);
      }

    } catch (err: any) {
      console.error('❌ Bulk forecasting error:', err);
      setError('Bulk forecasting failed: ' + err.message);
    } finally {
      setProcessing(false);
      setTimeout(() => setProcessingStatus(null), 3000);
    }
  };

  const downloadTemplate = () => {
    const template = `sku,productName,currentStock,dailySales,weeklySales,reorderLevel,leadTime,brand,category,location,supplierName
SKU001,Premium Headphones,150,8,56,30,7,AudioTech,Electronics,Warehouse A,TechSupply Inc
SKU002,Wireless Mouse,200,12,84,40,5,PeripheralPro,Electronics,Warehouse A,TechSupply Inc
SKU003,USB-C Cable 2m,500,25,175,100,3,CableMax,Accessories,Warehouse B,ConnectCorp
SKU004,Laptop Stand,75,5,35,20,10,ErgoDesk,Furniture,Warehouse A,OfficeSupplies Ltd
SKU005,Blue T-Shirt L,100,15,105,25,14,FashionBrand,Clothing,Warehouse C,TextileWorld`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'forecast_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Bulk Forecast from CSV
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upload CSV and generate forecasts for multiple products
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!fileProcessed ? (
            <>
              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                      CSV Format Requirements
                    </h3>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                      <li><strong>Required columns:</strong> sku, productName, currentStock, dailySales, weeklySales, reorderLevel, leadTime</li>
                      <li><strong>Optional columns:</strong> brand, category, location, supplierName</li>
                      <li>Column names are case-insensitive and can use spaces, underscores, or hyphens</li>
                      <li>Daily sales and weekly sales must be greater than 0</li>
                      <li>All numeric fields should contain valid numbers</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Template Download */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-1">
                      Download Template
                    </h3>
                    <p className="text-sm text-purple-700 dark:text-purple-400">
                      Use this template to ensure your CSV is formatted correctly
                    </p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="ml-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Template</span>
                  </button>
                </div>
              </div>

              {/* File Upload */}
              <label className="block">
                <div className={`relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
                  file
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 bg-gray-50 dark:bg-gray-800'
                }`}>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center space-y-3">
                      <Loader className="w-12 h-12 text-purple-600 animate-spin" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Processing CSV file...
                      </p>
                    </div>
                  ) : file ? (
                    <div className="flex flex-col items-center space-y-2">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">Click to select a different file</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      <Upload className="w-12 h-12 text-gray-400" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">CSV files only</p>
                    </div>
                  )}
                </div>
              </label>
            </>
          ) : (
            <>
              {/* Filters Section */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Filter Products
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                  >
                    <option value="all">All Categories</option>
                    {categories.slice(1).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <select
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                  >
                    <option value="all">All Locations</option>
                    {locations.slice(1).map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>

                  <select
                    value={filters.brand}
                    onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
                    className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                  >
                    <option value="all">All Brands</option>
                    {brands.slice(1).map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="Min Stock"
                    value={filters.minStock}
                    onChange={(e) => setFilters(prev => ({ ...prev, minStock: e.target.value }))}
                    className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                  />

                  <input
                    type="number"
                    placeholder="Max Stock"
                    value={filters.maxStock}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxStock: e.target.value }))}
                    className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Apply Filters
                  </button>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {filteredProducts.length} of {products.length} products
                  </p>
                </div>
              </div>

              {/* Forecast Settings */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                      Forecast Period
                    </h3>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Select the number of days to forecast
                    </p>
                  </div>
                  <select
                    value={forecastDays}
                    onChange={(e) => setForecastDays(Number(e.target.value))}
                    className="px-4 py-2 bg-white dark:bg-gray-900 border border-blue-300 dark:border-blue-700 rounded-lg text-sm text-gray-900 dark:text-white"
                  >
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                    <option value={60}>60 Days</option>
                    <option value={90}>90 Days</option>
                  </select>
                </div>
              </div>

              {/* Products Table */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Select All ({selectedProducts.size} selected)
                    </span>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Select
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          SKU
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Product Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Daily Sales
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Location
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredProducts.map((product) => (
                        <tr
                          key={product.sku}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedProducts.has(product.sku)}
                              onChange={() => toggleProductSelection(product.sku)}
                              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                            {product.sku}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {product.productName}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {product.currentStock}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {product.dailySales}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {product.location}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Processing Status */}
          {processingStatus && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Loader className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  Processing Forecasts...
                </h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-blue-700 dark:text-blue-400">
                  <span>Progress:</span>
                  <span className="font-medium">
                    {processingStatus.processed} / {processingStatus.total}
                  </span>
                </div>
                
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                  <div
                    className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(processingStatus.processed / processingStatus.total) * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <p className="text-gray-500 dark:text-gray-400">Successful</p>
                    <p className="text-green-600 dark:text-green-400 font-semibold text-lg">
                      {processingStatus.successful}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <p className="text-gray-500 dark:text-gray-400">Failed</p>
                    <p className="text-red-600 dark:text-red-400 font-semibold text-lg">
                      {processingStatus.failed}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <p className="text-gray-500 dark:text-gray-400">Remaining</p>
                    <p className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
                      {processingStatus.total - processingStatus.processed}
                    </p>
                  </div>
                </div>

                {processingStatus.current && processingStatus.current !== 'Complete' && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    Currently processing: <strong>{processingStatus.current}</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className={`border rounded-lg p-4 ${
              error.includes('successfully') 
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start space-x-2">
                <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  error.includes('successfully')
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`} />
                <p className={`text-sm ${
                  error.includes('successfully')
                    ? 'text-yellow-700 dark:text-yellow-400'
                    : 'text-red-700 dark:text-red-400'
                }`}>
                  {error}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-900">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {fileProcessed && (
              <span>
                {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected for forecasting
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              disabled={processing}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Cancel'}
            </button>
            {fileProcessed && (
              <button
                onClick={runBulkForecasting}
                disabled={processing || selectedProducts.size === 0}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg"
              >
                {processing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Processing {selectedProducts.size} products...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Generate Forecasts</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ForecastCSVUpload;
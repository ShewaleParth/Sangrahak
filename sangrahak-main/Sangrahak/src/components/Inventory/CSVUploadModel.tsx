import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileSpreadsheet, CheckCircle, AlertCircle, Loader, Download } from 'lucide-react';

interface CSVUploadModalProps {
  onClose: () => void;
  onUploadComplete: () => void;
}

const CSVUploadModal: React.FC<CSVUploadModalProps> = ({ onClose, onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please select a valid CSV file');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        // Validate required columns
        const requiredColumns = ['sku', 'name', 'category', 'stock', 'price', 'supplier'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        
        if (missingColumns.length > 0) {
          setError(`Missing required columns: ${missingColumns.join(', ')}`);
          setUploading(false);
          return;
        }

        const products = [];
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(',').map(v => v.trim());
          const product: any = {};

          headers.forEach((header, index) => {
            product[header] = values[index];
          });

          // Validate and transform data
          if (!product.sku || !product.name) {
            errors.push(`Row ${i + 1}: Missing SKU or Name`);
            continue;
          }

          const transformedProduct = {
            sku: product.sku,
            name: product.name,
            category: product.category || 'Uncategorized',
            stock: parseInt(product.stock) || 0,
            price: parseFloat(product.price) || 0,
            supplier: product.supplier || 'Unknown',
            reorderPoint: parseInt(product.reorderpoint || product.reorder_point) || 10,
            location: product.location || 'Main Warehouse',
            brand: product.brand || 'Generic',
            lastSoldDate: product.lastsolddate || product.last_sold_date || new Date().toISOString(),
            description: product.description || ''
          };

          products.push(transformedProduct);
        }

        // Upload to backend
        try {
          const response = await fetch('http://localhost:5001/api/products/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products })
          });

          const data = await response.json();

          if (data.success) {
            setUploadResult({
              success: data.inserted || products.length,
              failed: errors.length,
              errors
            });
            onUploadComplete();
          } else {
            setError(data.error || 'Upload failed');
          }
        } catch (err: any) {
          setError(err.message || 'Failed to upload products');
        }
      };

      reader.readAsText(file);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `sku,name,category,stock,price,supplier,reorderPoint,location,brand,description
SKU001,Sample Product 1,Electronics,100,299.99,Supplier A,20,Warehouse 1,Brand X,Sample description
SKU002,Sample Product 2,Clothing,50,49.99,Supplier B,10,Warehouse 2,Brand Y,Another sample`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_template.csv';
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
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Upload CSV File
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Bulk import products from CSV
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
          {/* Template Download */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                  Need a template?
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Download our CSV template with the correct format and sample data
                </p>
              </div>
              <button
                onClick={downloadTemplate}
                className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Required Columns Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Required CSV Columns:
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-gray-700 dark:text-gray-300">sku</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-gray-700 dark:text-gray-300">name</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-gray-700 dark:text-gray-300">category</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-gray-700 dark:text-gray-300">stock</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-gray-700 dark:text-gray-300">price</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-gray-700 dark:text-gray-300">supplier</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Optional: reorderPoint, location, brand, description
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <label className="block">
              <div className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                file
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 bg-gray-50 dark:bg-gray-800'
              }`}>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {file ? (
                  <div className="flex flex-col items-center space-y-2">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
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
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start space-x-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 dark:text-green-300">
                    Upload Completed
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                    Successfully imported {uploadResult.success} products
                    {uploadResult.failed > 0 && ` (${uploadResult.failed} failed)`}
                  </p>
                </div>
              </div>
              {uploadResult.errors.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-green-900 dark:text-green-300">
                    Errors:
                  </p>
                  {uploadResult.errors.slice(0, 5).map((err, idx) => (
                    <p key={idx} className="text-xs text-green-700 dark:text-green-400">
                      • {err}
                    </p>
                  ))}
                  {uploadResult.errors.length > 5 && (
                    <p className="text-xs text-green-700 dark:text-green-400">
                      ...and {uploadResult.errors.length - 5} more
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            {uploadResult ? 'Close' : 'Cancel'}
          </button>
          {!uploadResult && (
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload CSV</span>
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CSVUploadModal;
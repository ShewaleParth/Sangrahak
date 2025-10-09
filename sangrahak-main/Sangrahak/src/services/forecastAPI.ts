// src/services/forecastAPI.ts
import axios from 'axios';

const EXPRESS_API_URL = 'http://localhost:5000/api';
const ML_API_URL = 'http://localhost:5001/api/ml';

export interface ForecastDataPoint {
  date: string;
  predicted: number;
  actual?: number | null;
  confidence?: number;
}

export interface InputParams {
  dailySales: number;
  weeklySales: number;
  reorderLevel: number;
  leadTime: number;
  brand?: string;
  category?: string;
  location?: string;
  supplierName?: string;
}

export interface Forecast {
  id: string;
  itemId: string;
  productName: string;
  sku: string;
  currentStock: number;
  stockStatusPred: string;
  priorityPred: string;
  alert: string;
  forecastData: ForecastDataPoint[];
  inputParams?: InputParams;
  updatedAt: string;
}

export interface Product {
  sku: string;
  name: string;
  category?: string;
  stock?: number;
  supplier?: string;
}

export interface CustomPredictionRequest {
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
  forecastDays?: number;
}

export interface PredictionResponse {
  success: boolean;
  message?: string;
  forecast?: Forecast;
  error?: string;
}

export interface MLStatus {
  ml_model_loaded: boolean;
  ml_model_type: string;
  encoders_loaded: boolean;
  arima_models_loaded: boolean;
  arima_models_count: number;
}

class ForecastAPI {
  // Get available products from ML API
  async getProducts(): Promise<{ success: boolean; products: Product[]; count: number }> {
    try {
      const response = await axios.get(`${ML_API_URL}/products`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching products:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch products');
    }
  }

  // Run custom prediction with user inputs
  async runCustomPrediction(data: CustomPredictionRequest): Promise<PredictionResponse> {
    try {
      const response = await axios.post(`${ML_API_URL}/predict/custom`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error running custom prediction:', error);
      throw new Error(error.response?.data?.error || 'Failed to run prediction');
    }
  }

  // Get all forecasts from Express API (MongoDB)
  async getAll(params?: { limit?: number; sortBy?: string }): Promise<{ forecasts: Forecast[]; total: number }> {
    try {
      const response = await axios.get(`${EXPRESS_API_URL}/forecasts`, { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching forecasts:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch forecasts');
    }
  }

  // Get forecast by SKU or Item ID from Express API
  async getById(identifier: string): Promise<Forecast> {
    try {
      const response = await axios.get(`${EXPRESS_API_URL}/forecasts/${identifier}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching forecast:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch forecast');
    }
  }

  // Check ML model status
  async getMLStatus(): Promise<MLStatus> {
    try {
      const response = await axios.get(`${ML_API_URL}/status`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching ML status:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch ML status');
    }
  }

  // Check ML API health
  async checkMLHealth(): Promise<{ status: string; timestamp: string; models_loaded: boolean }> {
    try {
      const response = await axios.get(`${ML_API_URL}/../health`);
      return response.data;
    } catch (error: any) {
      console.error('Error checking ML health:', error);
      throw new Error('ML API is not responding');
    }
  }
}

export default new ForecastAPI();
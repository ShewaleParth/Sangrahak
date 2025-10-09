export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  reorderPoint: number;
  supplier: string;
  lastSoldDate: string;
  price: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'overstock';
}

export interface Depot {
  id: string;
  name: string;
  location: string;
  capacity: number;
  currentUtilization: number;
  itemsStored: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface KPI {
  title: string;
  value: string;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
}

export interface Alert {
  id: string;
  type: 'low-stock' | 'demand-spike' | 'capacity-warning' | 'anomaly';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  isRead: boolean;
}

export interface ForecastData {
  date: string;
  actual: number;
  predicted: number;
  confidence?: number;
}

export interface SalesData {
  date: string;
  sales: number;
  predicted: number;
}

export interface TopSKU {
  sku: string;
  name: string;
  predictedDemand: number;
  currentStock: number;
  category: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  avatar?: string;
}

export type Theme = 'light' | 'dark';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  isActive?: boolean;
}
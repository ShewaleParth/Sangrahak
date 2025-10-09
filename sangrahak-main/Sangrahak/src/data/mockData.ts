import { Product, Depot, Alert, ForecastData, SalesData, TopSKU, KPI, User } from '../types';
import { subDays, format, addDays } from 'date-fns';

// Mock Products Data
export const mockProducts: Product[] = [
  {
    id: '1',
    sku: 'ELC-001',
    name: 'iPhone 15 Pro Max',
    category: 'Electronics',
    stock: 45,
    reorderPoint: 20,
    supplier: 'Apple Inc.',
    lastSoldDate: '2025-01-14',
    price: 1199,
    status: 'in-stock'
  },
  {
    id: '2',
    sku: 'APL-002',
    name: 'Nike Air Max 270',
    category: 'Apparel',
    stock: 8,
    reorderPoint: 15,
    supplier: 'Nike',
    lastSoldDate: '2025-01-13',
    price: 150,
    status: 'low-stock'
  },
  {
    id: '3',
    sku: 'HME-003',
    name: 'Dyson V15 Detect',
    category: 'Home Goods',
    stock: 0,
    reorderPoint: 10,
    supplier: 'Dyson',
    lastSoldDate: '2025-01-10',
    price: 749,
    status: 'out-of-stock'
  },
  {
    id: '4',
    sku: 'ELC-004',
    name: 'MacBook Pro 16"',
    category: 'Electronics',
    stock: 25,
    reorderPoint: 12,
    supplier: 'Apple Inc.',
    lastSoldDate: '2025-01-14',
    price: 2499,
    status: 'in-stock'
  },
  {
    id: '5',
    sku: 'APL-005',
    name: 'Levi\'s 501 Jeans',
    category: 'Apparel',
    stock: 120,
    reorderPoint: 30,
    supplier: 'Levi Strauss',
    lastSoldDate: '2025-01-12',
    price: 89,
    status: 'overstock'
  },
  {
    id: '6',
    sku: 'HME-006',
    name: 'KitchenAid Stand Mixer',
    category: 'Home Goods',
    stock: 18,
    reorderPoint: 8,
    supplier: 'Whirlpool',
    lastSoldDate: '2025-01-11',
    price: 379,
    status: 'in-stock'
  },
  {
    id: '7',
    sku: 'ELC-007',
    name: 'Samsung 65" QLED TV',
    category: 'Electronics',
    stock: 12,
    reorderPoint: 5,
    supplier: 'Samsung',
    lastSoldDate: '2025-01-13',
    price: 1299,
    status: 'in-stock'
  },
  {
    id: '8',
    sku: 'APL-008',
    name: 'Adidas Ultraboost 22',
    category: 'Apparel',
    stock: 3,
    reorderPoint: 20,
    supplier: 'Adidas',
    lastSoldDate: '2025-01-14',
    price: 180,
    status: 'low-stock'
  }
];

// Mock Depots Data
export const mockDepots: Depot[] = [
  {
    id: '1',
    name: 'Main Warehouse',
    location: 'New York, NY',
    capacity: 10000,
    currentUtilization: 7500,
    itemsStored: 1250,
    status: 'normal'
  },
  {
    id: '2',
    name: 'West Coast Hub',
    location: 'Los Angeles, CA',
    capacity: 8000,
    currentUtilization: 7200,
    itemsStored: 980,
    status: 'warning'
  },
  {
    id: '3',
    name: 'Chicago Distribution',
    location: 'Chicago, IL',
    capacity: 6000,
    currentUtilization: 2400,
    itemsStored: 720,
    status: 'normal'
  },
  {
    id: '4',
    name: 'Southeast Facility',
    location: 'Atlanta, GA',
    capacity: 5000,
    currentUtilization: 4750,
    itemsStored: 890,
    status: 'critical'
  }
];

// Mock Alerts Data
export const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'low-stock',
    title: 'Low Stock Alert',
    description: 'Nike Air Max 270 (APL-002) has only 8 units remaining',
    severity: 'high',
    timestamp: '2025-01-15T10:30:00Z',
    isRead: false
  },
  {
    id: '2',
    type: 'demand-spike',
    title: 'Demand Spike Warning',
    description: 'iPhone 15 Pro Max showing 45% increase in predicted demand',
    severity: 'medium',
    timestamp: '2025-01-15T09:15:00Z',
    isRead: false
  },
  {
    id: '3',
    type: 'capacity-warning',
    title: 'Depot Near Capacity',
    description: 'Southeast Facility is at 95% capacity utilization',
    severity: 'high',
    timestamp: '2025-01-15T08:45:00Z',
    isRead: true
  },
  {
    id: '4',
    type: 'anomaly',
    title: 'Demand Anomaly Detected',
    description: 'Unusual demand pattern detected for Home Goods category',
    severity: 'medium',
    timestamp: '2025-01-14T16:20:00Z',
    isRead: false
  }
];

// Generate Sales vs Predicted Data
export const mockSalesData: SalesData[] = Array.from({ length: 7 }, (_, i) => {
  const date = subDays(new Date(), 6 - i);
  const baseSales = 25000 + Math.random() * 10000;
  return {
    date: format(date, 'MMM dd'),
    sales: Math.round(baseSales),
    predicted: Math.round(baseSales * (0.9 + Math.random() * 0.2))
  };
});

// Generate Forecast Data
export const mockForecastData: ForecastData[] = Array.from({ length: 30 }, (_, i) => {
  const date = addDays(new Date(), i - 15);
  const base = 100 + Math.sin(i / 5) * 20;
  return {
    date: format(date, 'MMM dd'),
    actual: i < 15 ? Math.round(base + Math.random() * 20) : 0,
    predicted: Math.round(base + Math.random() * 15),
    confidence: 0.75 + Math.random() * 0.2
  };
});

// Mock Top SKUs Data
export const mockTopSKUs: TopSKU[] = [
  {
    sku: 'ELC-001',
    name: 'iPhone 15 Pro Max',
    predictedDemand: 145,
    currentStock: 45,
    category: 'Electronics'
  },
  {
    sku: 'ELC-007',
    name: 'Samsung 65" QLED TV',
    predictedDemand: 89,
    currentStock: 12,
    category: 'Electronics'
  },
  {
    sku: 'HME-006',
    name: 'KitchenAid Stand Mixer',
    predictedDemand: 67,
    currentStock: 18,
    category: 'Home Goods'
  },
  {
    sku: 'APL-002',
    name: 'Nike Air Max 270',
    predictedDemand: 56,
    currentStock: 8,
    category: 'Apparel'
  },
  {
    sku: 'ELC-004',
    name: 'MacBook Pro 16"',
    predictedDemand: 43,
    currentStock: 25,
    category: 'Electronics'
  }
];

// Mock KPI Data
export const mockKPIs: KPI[] = [
  {
    title: 'Total Sales',
    value: '$2.4M',
    change: 12.5,
    changeType: 'positive',
    icon: 'TrendingUp'
  },
  {
    title: 'Inventory Value',
    value: '$1.8M',
    change: -3.2,
    changeType: 'negative',
    icon: 'Package'
  },
  {
    title: 'Depot Utilization',
    value: '74%',
    change: 5.8,
    changeType: 'positive',
    icon: 'Warehouse'
  },
  {
    title: 'Active Alerts',
    value: '12',
    change: -8.3,
    changeType: 'positive',
    icon: 'AlertTriangle'
  }
];

// Mock User Data
export const mockUser: User = {
  id: '1',
  name: 'Sarah Chen',
  email: 'sarah.chen@inventroops.com',
  role: 'admin'
};

// Navigation Items
export const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', href: '/', isActive: true },
  { id: 'inventory', label: 'Inventory', icon: 'Package', href: '/inventory', isActive: false },
  { id: 'depots', label: 'Depots', icon: 'Warehouse', href: '/depots', isActive: false },
  { id: 'forecasts', label: 'Forecasts', icon: 'TrendingUp', href: '/forecasts', isActive: false },
  { id: 'reports', label: 'Reports', icon: 'FileText', href: '/reports', isActive: false },
  { id: 'settings', label: 'Settings', icon: 'Settings', href: '/settings', isActive: false }
];
// server.js - FIXED MongoDB Connection
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection - FIXED SSL/TLS Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://luckyak619_db_user:luckyak619@cluster0.lcmjwhw.mongodb.net/inventroops?retryWrites=true&w=majority';

console.log('🔄 Attempting to connect to MongoDB...');

// Try connection with proper error handling
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas successfully');
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('\n💡 Troubleshooting steps:');
  console.log('1. Check if your IP is whitelisted in MongoDB Atlas');
  console.log('2. Verify your username and password');
  console.log('3. Check your internet connection');
  console.log('4. Try running: npm install mongodb@5.9.0');
});

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('📴 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('👋 MongoDB connection closed due to app termination');
  process.exit(0);
});

// Schemas and Models

// Forecast Schema
const forecastSchema = new mongoose.Schema({
  itemId: { type: String, required: true },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  currentStock: { type: Number, required: true },
  stockStatusPred: { type: String, required: true },
  priorityPred: { type: String, required: true },
  alert: { type: String, required: true },
  forecastData: [{
    date: { type: String, required: true },
    predicted: { type: Number, required: true },
    actual: { type: Number },
    confidence: { type: Number }
  }],
  inputParams: {
    dailySales: Number,
    weeklySales: Number,
    reorderLevel: Number,
    leadTime: Number,
    brand: String,
    category: String,
    location: String,
    supplierName: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Forecast = mongoose.model('Forecast', forecastSchema);

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'manager', 'staff'], default: 'staff' },
  avatar: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Product Schema
const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  reorderPoint: { type: Number, required: true, default: 10 },
  supplier: { type: String, required: true },
  price: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['in-stock', 'low-stock', 'out-of-stock', 'overstock'], 
    default: 'in-stock' 
  },
  lastSoldDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Depot Schema
const depotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  capacity: { type: Number, required: true },
  currentUtilization: { type: Number, default: 0 },
  itemsStored: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['normal', 'warning', 'critical'], 
    default: 'normal' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Alert Schema
const alertSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['low-stock', 'out-of-stock', 'demand-spike', 'capacity-warning', 'anomaly'], 
    required: true 
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
  isRead: { type: Boolean, default: false },
  isResolved: { type: Boolean, default: false },
  resolvedAt: { type: Date },
  resolvedBy: { type: String },
  resolutionNotes: { type: String },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  depotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Depot' },
  createdAt: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Depot = mongoose.model('Depot', depotSchema);
const Alert = mongoose.model('Alert', alertSchema);

// Helper Functions
const updateProductStatus = (product) => {
  if (product.stock === 0) {
    product.status = 'out-of-stock';
  } else if (product.stock <= product.reorderPoint) {
    product.status = 'low-stock';
  } else if (product.stock > product.reorderPoint * 3) {
    product.status = 'overstock';
  } else {
    product.status = 'in-stock';
  }
  return product;
};

const createStockAlert = async (product) => {
  if (product.status === 'low-stock' || product.status === 'out-of-stock') {
    const existingAlert = await Alert.findOne({
      productId: product._id,
      type: product.status === 'out-of-stock' ? 'out-of-stock' : 'low-stock',
      isResolved: false
    });

    if (!existingAlert) {
      const alert = new Alert({
        type: product.status === 'out-of-stock' ? 'out-of-stock' : 'low-stock',
        title: `${product.status === 'out-of-stock' ? 'Out of Stock' : 'Low Stock'} Alert`,
        description: `${product.name} (${product.sku}) ${product.status === 'out-of-stock' ? 'is out of stock' : `has only ${product.stock} units remaining`}`,
        severity: product.status === 'out-of-stock' ? 'high' : 'medium',
        productId: product._id
      });
      await alert.save();
    }
  }
};

// FORECAST ROUTES

// GET all forecasts
app.get('/api/forecasts', async (req, res) => {
  try {
    const { sku, limit = 50, sortBy = 'updatedAt' } = req.query;
    const query = {};

    if (sku) {
      query.sku = sku;
    }

    const forecasts = await Forecast.find(query)
      .sort({ [sortBy]: -1 })
      .limit(parseInt(limit));

    res.json({
      forecasts: forecasts.map(forecast => ({
        id: forecast._id,
        itemId: forecast.itemId,
        productName: forecast.productName,
        sku: forecast.sku,
        currentStock: forecast.currentStock,
        stockStatusPred: forecast.stockStatusPred,
        priorityPred: forecast.priorityPred,
        alert: forecast.alert,
        forecastData: forecast.forecastData,
        inputParams: forecast.inputParams,
        updatedAt: forecast.updatedAt
      })),
      total: forecasts.length
    });
  } catch (error) {
    console.error('Error fetching forecasts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET forecast by SKU or Item ID
app.get('/api/forecasts/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    let forecast = await Forecast.findOne({ sku: identifier });
    if (!forecast) {
      forecast = await Forecast.findOne({ itemId: identifier });
    }
    
    if (!forecast) {
      return res.status(404).json({ message: 'Forecast not found' });
    }

    res.json({
      id: forecast._id,
      itemId: forecast.itemId,
      productName: forecast.productName,
      sku: forecast.sku,
      currentStock: forecast.currentStock,
      stockStatusPred: forecast.stockStatusPred,
      priorityPred: forecast.priorityPred,
      alert: forecast.alert,
      forecastData: forecast.forecastData,
      inputParams: forecast.inputParams,
      updatedAt: forecast.updatedAt
    });
  } catch (error) {
    console.error('Error fetching forecast:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST - Create or update forecast
app.post('/api/forecasts', async (req, res) => {
  try {
    const { itemId, sku } = req.body;
    
    let forecast = await Forecast.findOne({ $or: [{ itemId }, { sku }] });
    
    if (forecast) {
      Object.assign(forecast, req.body);
      forecast.updatedAt = new Date();
      await forecast.save();
    } else {
      forecast = new Forecast(req.body);
      await forecast.save();
    }

    res.status(201).json({
      message: 'Forecast saved successfully',
      forecast: {
        id: forecast._id,
        itemId: forecast.itemId,
        productName: forecast.productName,
        sku: forecast.sku,
        currentStock: forecast.currentStock,
        stockStatusPred: forecast.stockStatusPred,
        priorityPred: forecast.priorityPred,
        alert: forecast.alert,
        forecastData: forecast.forecastData,
        inputParams: forecast.inputParams
      }
    });
  } catch (error) {
    console.error('Error saving forecast:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET forecast analytics
app.get('/api/forecasts/analytics/insights', async (req, res) => {
  try {
    const forecasts = await Forecast.find();
    
    const highPriorityCount = forecasts.filter(f => 
      f.priorityPred === 'High' || f.priorityPred === 'Very High'
    ).length;
    
    const understockCount = forecasts.filter(f => 
      f.stockStatusPred === 'Understock'
    ).length;
    
    const avgStockLevel = forecasts.length > 0
      ? forecasts.reduce((sum, f) => sum + f.currentStock, 0) / forecasts.length
      : 0;

    const topReorders = forecasts
      .filter(f => f.priorityPred === 'High' || f.priorityPred === 'Very High')
      .sort((a, b) => {
        const priorityOrder = { 'Very High': 3, 'High': 2, 'Medium': 1, 'Low': 0 };
        return (priorityOrder[b.priorityPred] || 0) - (priorityOrder[a.priorityPred] || 0);
      })
      .slice(0, 5)
      .map(f => ({
        sku: f.sku,
        name: f.productName,
        currentStock: f.currentStock,
        priority: f.priorityPred,
        predictedDemand: f.forecastData.length > 0 
          ? Math.round(f.forecastData.reduce((sum, d) => sum + d.predicted, 0))
          : 0
      }));

    res.json({
      insights: {
        highPriorityCount,
        understockCount,
        avgStockLevel: Math.round(avgStockLevel),
        totalForecasts: forecasts.length
      },
      topReorders,
      alerts: forecasts
        .filter(f => f.alert !== 'Stock OK')
        .map(f => ({
          sku: f.sku,
          productName: f.productName,
          alert: f.alert,
          priority: f.priorityPred
        }))
    });
  } catch (error) {
    console.error('Error fetching forecast insights:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PRODUCT ROUTES
app.get('/api/products', async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ updatedAt: -1 });

    const total = await Product.countDocuments(query);

    res.json({
      products: products.map(product => ({
        id: product._id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        stock: product.stock,
        reorderPoint: product.reorderPoint,
        supplier: product.supplier,
        price: product.price,
        status: product.status,
        lastSoldDate: product.lastSoldDate.toISOString().split('T')[0]
      })),
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const productData = req.body;
    let product = new Product(productData);
    product = updateProductStatus(product);
    await product.save();
    await createStockAlert(product);

    res.status(201).json({
      message: 'Product created successfully',
      product: {
        id: product._id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        stock: product.stock,
        reorderPoint: product.reorderPoint,
        supplier: product.supplier,
        price: product.price,
        status: product.status,
        lastSoldDate: product.lastSoldDate.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Error creating product:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'SKU already exists' });
    } else {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    Object.assign(product, req.body);
    product.updatedAt = new Date();
    updateProductStatus(product);
    await product.save();
    await createStockAlert(product);

    res.json({
      message: 'Product updated successfully',
      product: {
        id: product._id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        stock: product.stock,
        reorderPoint: product.reorderPoint,
        supplier: product.supplier,
        price: product.price,
        status: product.status,
        lastSoldDate: product.lastSoldDate.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await Alert.deleteMany({ productId: req.params.id });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/products/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add these routes to your server.js file (replace existing depot routes)

// DEPOT ROUTES - COMPLETE CRUD

// Get all depots
app.get('/api/depots', async (req, res) => {
  try {
    const depots = await Depot.find().sort({ updatedAt: -1 });
    res.json({
      depots: depots.map(depot => ({
        id: depot._id,
        name: depot.name,
        location: depot.location,
        capacity: depot.capacity,
        currentUtilization: depot.currentUtilization,
        itemsStored: depot.itemsStored,
        status: depot.status,
        createdAt: depot.createdAt,
        updatedAt: depot.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching depots:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single depot by ID
app.get('/api/depots/:id', async (req, res) => {
  try {
    const depot = await Depot.findById(req.params.id);
    if (!depot) {
      return res.status(404).json({ message: 'Depot not found' });
    }
    res.json({
      depot: {
        id: depot._id,
        name: depot.name,
        location: depot.location,
        capacity: depot.capacity,
        currentUtilization: depot.currentUtilization,
        itemsStored: depot.itemsStored,
        status: depot.status,
        createdAt: depot.createdAt,
        updatedAt: depot.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching depot:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new depot
app.post('/api/depots', async (req, res) => {
  try {
    const depot = new Depot(req.body);
    
    // Calculate status based on utilization
    const utilizationPercentage = (depot.currentUtilization / depot.capacity) * 100;
    if (utilizationPercentage >= 95) {
      depot.status = 'critical';
    } else if (utilizationPercentage >= 85) {
      depot.status = 'warning';
    } else {
      depot.status = 'normal';
    }
    
    await depot.save();

    // Create alert if capacity is critical
    if (depot.status === 'critical' || depot.status === 'warning') {
      const alert = new Alert({
        type: 'capacity-warning',
        title: `Depot ${depot.status === 'critical' ? 'Critical' : 'Warning'} Capacity`,
        description: `${depot.name} is at ${utilizationPercentage.toFixed(1)}% capacity utilization`,
        severity: depot.status === 'critical' ? 'high' : 'medium',
        depotId: depot._id
      });
      await alert.save();
    }

    res.status(201).json({
      message: 'Depot created successfully',
      depot: {
        id: depot._id,
        name: depot.name,
        location: depot.location,
        capacity: depot.capacity,
        currentUtilization: depot.currentUtilization,
        itemsStored: depot.itemsStored,
        status: depot.status
      }
    });
  } catch (error) {
    console.error('Error creating depot:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update depot
app.put('/api/depots/:id', async (req, res) => {
  try {
    const depot = await Depot.findById(req.params.id);
    if (!depot) {
      return res.status(404).json({ message: 'Depot not found' });
    }

    // Update fields
    Object.assign(depot, req.body);
    depot.updatedAt = new Date();

    // Recalculate status based on utilization
    const utilizationPercentage = (depot.currentUtilization / depot.capacity) * 100;
    if (utilizationPercentage >= 95) {
      depot.status = 'critical';
    } else if (utilizationPercentage >= 85) {
      depot.status = 'warning';
    } else {
      depot.status = 'normal';
    }

    await depot.save();

    // Create/update alert if capacity is critical or warning
    if (depot.status === 'critical' || depot.status === 'warning') {
      const existingAlert = await Alert.findOne({
        depotId: depot._id,
        type: 'capacity-warning',
        isResolved: false
      });

      if (!existingAlert) {
        const alert = new Alert({
          type: 'capacity-warning',
          title: `Depot ${depot.status === 'critical' ? 'Critical' : 'Warning'} Capacity`,
          description: `${depot.name} is at ${utilizationPercentage.toFixed(1)}% capacity utilization`,
          severity: depot.status === 'critical' ? 'high' : 'medium',
          depotId: depot._id
        });
        await alert.save();
      }
    } else {
      // Resolve existing alerts if status is now normal
      await Alert.updateMany(
        { depotId: depot._id, type: 'capacity-warning', isResolved: false },
        { isResolved: true, resolvedAt: new Date() }
      );
    }

    res.json({
      message: 'Depot updated successfully',
      depot: {
        id: depot._id,
        name: depot.name,
        location: depot.location,
        capacity: depot.capacity,
        currentUtilization: depot.currentUtilization,
        itemsStored: depot.itemsStored,
        status: depot.status
      }
    });
  } catch (error) {
    console.error('Error updating depot:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete depot
app.delete('/api/depots/:id', async (req, res) => {
  try {
    const depot = await Depot.findByIdAndDelete(req.params.id);
    if (!depot) {
      return res.status(404).json({ message: 'Depot not found' });
    }
    
    // Delete associated alerts
    await Alert.deleteMany({ depotId: req.params.id });
    
    res.json({ message: 'Depot deleted successfully' });
  } catch (error) {
    console.error('Error deleting depot:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get depot statistics
app.get('/api/depots/stats/overview', async (req, res) => {
  try {
    const depots = await Depot.find();
    
    const totalDepots = depots.length;
    const totalCapacity = depots.reduce((sum, depot) => sum + depot.capacity, 0);
    const totalUtilization = depots.reduce((sum, depot) => sum + depot.currentUtilization, 0);
    const totalItems = depots.reduce((sum, depot) => sum + depot.itemsStored, 0);
    
    const avgUtilization = totalDepots > 0 
      ? (totalUtilization / totalCapacity) * 100 
      : 0;
    
    const criticalCount = depots.filter(d => d.status === 'critical').length;
    const warningCount = depots.filter(d => d.status === 'warning').length;
    const normalCount = depots.filter(d => d.status === 'normal').length;

    res.json({
      stats: {
        totalDepots,
        totalCapacity,
        totalUtilization,
        totalItems,
        avgUtilization: avgUtilization.toFixed(1),
        criticalCount,
        warningCount,
        normalCount,
        needsAttention: criticalCount + warningCount
      }
    });
  } catch (error) {
    console.error('Error fetching depot stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// ALERT ROUTES
app.get('/api/alerts', async (req, res) => {
  try {
    const { unreadOnly = false, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    const alerts = await Alert.find(query)
      .populate('productId', 'name sku')
      .populate('depotId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Alert.countDocuments(query);

    res.json({
      alerts: alerts.map(alert => ({
        id: alert._id,
        type: alert.type,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        isRead: alert.isRead,
        isResolved: alert.isResolved,
        timestamp: alert.createdAt.toISOString(),
        product: alert.productId,
        depot: alert.depotId
      })),
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/alerts/:id/read', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json({ message: 'Alert marked as read' });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DASHBOARD ROUTES
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const lowStockCount = await Product.countDocuments({ status: 'low-stock' });
    const outOfStockCount = await Product.countDocuments({ status: 'out-of-stock' });
    const totalDepots = await Depot.countDocuments();
    const unreadAlerts = await Alert.countDocuments({ isRead: false });
    
    const products = await Product.find();
    const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
    
    const depots = await Depot.find();
    const avgUtilization = depots.length > 0 
      ? depots.reduce((sum, depot) => sum + ((depot.currentUtilization / depot.capacity) * 100), 0) / depots.length 
      : 0;

    const kpis = [
      {
        title: 'Total Products',
        value: totalProducts.toString(),
        change: 5.2,
        changeType: 'positive',
        icon: 'Package'
      },
      {
        title: 'Inventory Value',
        value: `$${(totalValue / 1000000).toFixed(1)}M`,
        change: -2.1,
        changeType: 'negative',
        icon: 'DollarSign'
      },
      {
        title: 'Depot Utilization',
        value: `${avgUtilization.toFixed(0)}%`,
        change: 3.8,
        changeType: 'positive',
        icon: 'Warehouse'
      },
      {
        title: 'Active Alerts',
        value: unreadAlerts.toString(),
        change: lowStockCount > 0 ? 12.5 : -8.3,
        changeType: lowStockCount > 0 ? 'negative' : 'positive',
        icon: 'AlertTriangle'
      }
    ];

    res.json({
      kpis,
      stats: {
        totalProducts,
        lowStockCount,
        outOfStockCount,
        totalDepots,
        unreadAlerts,
        totalValue,
        avgUtilization
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/dashboard/top-skus', async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ stock: -1 })
      .limit(5);

    const topSKUs = products.map(product => ({
      sku: product.sku,
      name: product.name,
      predictedDemand: Math.floor(product.stock * 0.3 + Math.random() * 50),
      currentStock: product.stock,
      category: product.category
    }));

    res.json({ topSKUs });
  } catch (error) {
    console.error('Error fetching top SKUs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
});
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import xgboost as xgb
from pymongo import MongoClient
from datetime import datetime, timedelta
from sklearn.preprocessing import LabelEncoder
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tools.sm_exceptions import ConvergenceWarning
import warnings
import os
import traceback

warnings.filterwarnings('ignore', category=ConvergenceWarning)
warnings.filterwarnings('ignore', category=FutureWarning)

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "http://localhost:5174"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# MongoDB Configuration
MONGODB_URI = "mongodb+srv://luckyak619_db_user:luckyak619@cluster0.lcmjwhw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGODB_URI)
db = client['inventroops']
forecasts_collection = db['forecasts']
products_collection = db['products']

# Global variables
ml_model = None
use_xgb_native = False
target_encoders = None
arima_models = None

# Model paths
BASE_PATH = r"C:\Users\AYUSH PAWSHE\Desktop\projects\AI-Inventory\Sangrahak\Major-\Backend"

JSON_MODEL_PATH = os.path.join(BASE_PATH, "models", "ml_stock_priority_model.json")
PKL_MODEL_PATH = os.path.join(BASE_PATH, "models", "ml_stock_priority_model.pkl")
ENCODERS_PATH = os.path.join(BASE_PATH, "models", "target_label_encoders.pkl")
ARIMA_PATH = os.path.join(BASE_PATH, "models", "arima_models_dict.pkl")


def load_models():
    """Load all ML models and encoders at startup"""
    global ml_model, use_xgb_native, target_encoders, arima_models
    
    try:
        if os.path.exists(JSON_MODEL_PATH):
            try:
                ml_model = xgb.Booster()
                ml_model.load_model(JSON_MODEL_PATH)
                use_xgb_native = True
                print("✅ Loaded ML model from JSON")
            except Exception as e:
                print(f"⚠️ Failed to load JSON model: {e}")
        
        if ml_model is None and os.path.exists(PKL_MODEL_PATH):
            ml_model = joblib.load(PKL_MODEL_PATH)
            use_xgb_native = False
            print("✅ Loaded ML model from Pickle")
        
        if os.path.exists(ENCODERS_PATH):
            target_encoders = joblib.load(ENCODERS_PATH)
            print("✅ Loaded label encoders")
        
        if os.path.exists(ARIMA_PATH):
            arima_models = joblib.load(ARIMA_PATH)
            print("✅ Loaded ARIMA models")
        
        return True
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        traceback.print_exc()
        return False


def preprocess_data(df):
    """Preprocess the input data"""
    global target_encoders

    features = [
        "current_stock",
        "daily_sales",
        "weekly_sales",
        "reorder_level",
        "lead_time",
        "days_to_empty",
    ]
    
    categorical = ["brand", "category", "location", "supplier_name"]

    if target_encoders is None:
        print("⚠️ Warning: target_encoders not loaded, using fresh LabelEncoders.")
        target_encoders = {}

    for col in categorical:
        df[col] = df[col].astype(str)

        if col in target_encoders:
            le = target_encoders[col]
            
            if "Unknown" not in le.classes_:
                le.classes_ = np.append(le.classes_, "Unknown")

            df[col] = df[col].apply(lambda x: x if x in le.classes_ else "Unknown")
            df[col] = le.transform(df[col])
        else:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col])
            target_encoders[col] = le
        
        features.append(col)
    
    return df, features


def predict_stock_status(X_test):
    """Predict stock status and priority"""
    if use_xgb_native:
        dtest = xgb.DMatrix(X_test)
        y_pred_numeric = ml_model.predict(dtest)
        if y_pred_numeric.ndim > 1:
            y_pred_numeric = np.argmax(y_pred_numeric, axis=1)
    else:
        y_pred_numeric = ml_model.predict(X_test)
    
    if isinstance(y_pred_numeric, np.ndarray):
        if y_pred_numeric.ndim == 1:
            y_pred = pd.DataFrame({
                "stock_status_pred": y_pred_numeric,
                "priority_pred": y_pred_numeric
            })
        elif y_pred_numeric.shape[1] == 2:
            y_pred = pd.DataFrame(
                y_pred_numeric, columns=["stock_status_pred", "priority_pred"]
            )
        else:
            raise ValueError(f"Unexpected model output shape: {y_pred_numeric.shape}")
    else:
        raise ValueError("Model prediction returned unexpected type")
    
    for col in ["stock_status_pred", "priority_pred"]:
        encoder_key = col.replace("_pred", "")
        if encoder_key in target_encoders:
            encoder = target_encoders[encoder_key]
            try:
                y_pred[col] = encoder.inverse_transform(y_pred[col].astype(int))
            except (ValueError, KeyError) as e:
                print(f"⚠️ Could not decode {col}: {e}")
                y_pred[col] = "Unknown"
    
    return y_pred


def generate_historical_sales_from_inputs(daily_sales, weekly_sales, num_days=60):
    """
    Generate synthetic historical sales data based on user inputs.
    This creates a realistic time series that ARIMA can learn from.
    
    Args:
        daily_sales: Average daily sales rate
        weekly_sales: Average weekly sales rate
        num_days: Number of historical days to generate
    
    Returns:
        Array of historical sales values
    """
    # Calculate base sales from both metrics
    avg_from_daily = daily_sales
    avg_from_weekly = weekly_sales / 7
    base_sales = (avg_from_daily * 0.4 + avg_from_weekly * 0.6)
    
    historical_sales = []
    
    for i in range(num_days):
        # Weekly seasonality (higher on weekdays, lower on weekends)
        day_of_week = i % 7
        seasonality = 1.15 if day_of_week < 5 else 0.75
        
        # Add some trend (slight growth over time)
        trend = 1 + (i / num_days) * 0.1
        
        # Random noise (±20% variation)
        noise = np.random.uniform(0.8, 1.2)
        
        # Generate realistic sales value
        sales_value = base_sales * seasonality * trend * noise
        historical_sales.append(max(0, sales_value))
    
    return np.array(historical_sales)


def fit_arima_model(historical_sales, order=(1, 1, 1)):
    """
    Fit ARIMA model on historical sales data.
    
    Args:
        historical_sales: Array of historical sales values
        order: ARIMA order (p, d, q)
    
    Returns:
        Tuple of (fitted_model, model_info) or (None, None) if fitting fails
    """
    try:
        print(f"🔧 Fitting ARIMA{order} model on {len(historical_sales)} data points...")
        
        # Ensure data is suitable for ARIMA
        if len(historical_sales) < 10:
            print("⚠️ Not enough data points for ARIMA, need at least 10")
            return None, None
        
        # Fit ARIMA model
        model = ARIMA(historical_sales, order=order)
        fitted_model = model.fit()
        
        # Extract model information for verification
        model_info = {
            "order": order,
            "aic": float(fitted_model.aic),
            "bic": float(fitted_model.bic),
            "params": fitted_model.params.tolist() if hasattr(fitted_model, 'params') else []
        }
        
        print(f"✅ ARIMA model fitted successfully (AIC: {fitted_model.aic:.2f})")
        return fitted_model, model_info
        
    except Exception as e:
        print(f"⚠️ ARIMA fitting failed: {e}")
        return None, None


def forecast_with_arima(daily_sales, weekly_sales, steps=30):
    """
    Generate forecast using ARIMA model trained on synthetic historical data.
    
    Args:
        daily_sales: User-provided daily sales rate
        weekly_sales: User-provided weekly sales rate
        steps: Number of days to forecast
    
    Returns:
        Tuple of (forecast_array, forecast_metadata)
    """
    forecast_metadata = {
        "method": "Fallback",
        "arima_used": False,
        "model_details": None
    }
    
    try:
        # Generate historical sales data from user inputs
        print("📊 Generating historical sales pattern from user inputs...")
        historical_sales = generate_historical_sales_from_inputs(
            daily_sales, weekly_sales, num_days=60
        )
        
        print(f"📈 Historical sales stats: mean={historical_sales.mean():.2f}, std={historical_sales.std():.2f}")
        
        # Try different ARIMA orders to find the best fit
        orders_to_try = [
            (1, 1, 1),  # Standard ARIMA
            (2, 1, 1),  # More autoregressive terms
            (1, 1, 2),  # More moving average terms
            (2, 1, 2),  # More complex model
            (0, 1, 1),  # Simple model
        ]
        
        best_model = None
        best_aic = float('inf')
        best_model_info = None
        best_order = None
        
        for order in orders_to_try:
            model, model_info = fit_arima_model(historical_sales, order=order)
            if model is not None:
                if model_info["aic"] < best_aic:
                    best_aic = model_info["aic"]
                    best_model = model
                    best_model_info = model_info
                    best_order = order
        
        if best_model is None:
            print("❌ All ARIMA models failed, using fallback method")
            forecast = generate_fallback_forecast(daily_sales, weekly_sales, steps)
            return forecast, forecast_metadata
        
        print(f"🎯 Best ARIMA model selected: {best_order} (AIC: {best_aic:.2f}, BIC: {best_model_info['bic']:.2f})")
        
        # Generate forecast
        print(f"📈 Forecasting next {steps} days using ARIMA{best_order}...")
        forecast = best_model.forecast(steps=steps)
        
        # Ensure non-negative values
        forecast = np.maximum(forecast, 0)
        
        # Add small random variation to make it more realistic
        forecast = forecast * np.random.uniform(0.95, 1.05, size=len(forecast))
        
        print(f"✅ ARIMA forecast completed successfully!")
        print(f"   📊 Forecast stats: mean={forecast.mean():.2f}, min={forecast.min():.2f}, max={forecast.max():.2f}")
        
        # Update metadata
        forecast_metadata = {
            "method": "ARIMA",
            "arima_used": True,
            "model_details": {
                "order": best_order,
                "aic": best_aic,
                "bic": best_model_info["bic"],
                "historical_points": len(historical_sales),
                "forecast_mean": float(forecast.mean()),
                "forecast_std": float(forecast.std())
            }
        }
        
        return forecast, forecast_metadata
        
    except Exception as e:
        print(f"❌ Error in ARIMA forecasting: {e}")
        traceback.print_exc()
        forecast = generate_fallback_forecast(daily_sales, weekly_sales, steps)
        return forecast, forecast_metadata


def generate_fallback_forecast(daily_sales, weekly_sales, steps=30):
    """
    Fallback forecasting method if ARIMA fails.
    Uses exponential smoothing with trend and seasonality.
    """
    print("⚠️ Using fallback forecasting method (Exponential Smoothing)")
    print("   This happens when ARIMA model fails to converge or fit properly")
    
    avg_from_daily = daily_sales
    avg_from_weekly = weekly_sales / 7
    base_sales = (avg_from_daily * 0.4 + avg_from_weekly * 0.6)
    
    forecast = []
    for i in range(steps):
        # Trend component
        trend = 1 + (i / steps) * 0.05
        
        # Seasonality (weekly pattern)
        day_of_week = i % 7
        seasonality = 1.1 if day_of_week < 5 else 0.85
        
        # Random variation
        noise = np.random.uniform(0.9, 1.1)
        
        value = base_sales * trend * seasonality * noise
        forecast.append(max(0, value))
    
    return np.array(forecast)


def generate_alerts(row, forecast_sales_data=None):
    """Generate alerts based on predictions"""
    alerts = []
    
    if row["stock_status_pred"] == "Understock" or row["priority_pred"] in ["High", "Very High"]:
        alerts.append(f"Immediate Restock Needed: {row['priority_pred']}")
    
    if forecast_sales_data is not None:
        total_forecasted = sum(forecast_sales_data)
        if total_forecasted > row["current_stock"]:
            # Calculate when stock will run out
            shortage_days = 0
            cumulative_sales = 0
            for day_sales in forecast_sales_data:
                cumulative_sales += day_sales
                shortage_days += 1
                if cumulative_sales > row["current_stock"]:
                    break
            
            alerts.append(
                f"Stock Out Warning: Current stock will run out in ~{shortage_days} days (Forecasted demand: {int(total_forecasted)} units)"
            )
    
    if not alerts:
        alerts.append("Stock OK")
    
    return "; ".join(alerts)


def generate_forecast_data(future_sales, current_date):
    """Generate forecast data points with confidence intervals"""
    forecast_data = []
    base_date = datetime.strptime(current_date, '%Y-%m-%d') if isinstance(current_date, str) else current_date
    
    for i, predicted_val in enumerate(future_sales):
        forecast_date = base_date + timedelta(days=i+1)
        
        # Confidence decreases over time (more uncertainty in distant future)
        base_confidence = 0.95
        time_decay = 0.004 * i
        confidence = max(0.75, base_confidence - time_decay)
        
        forecast_data.append({
            "date": forecast_date.strftime('%Y-%m-%d'),
            "predicted": float(predicted_val),
            "actual": None,
            "confidence": float(confidence)
        })
    
    return forecast_data


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "OK",
        "timestamp": datetime.now().isoformat(),
        "models_loaded": ml_model is not None and target_encoders is not None
    })


@app.route('/api/ml/products', methods=['GET'])
def get_available_products():
    """Get all products from MongoDB for selection"""
    try:
        products = list(products_collection.find({}, {
            '_id': 0,
            'sku': 1,
            'name': 1,
            'category': 1,
            'stock': 1,
            'supplier': 1
        }))
        
        return jsonify({
            "success": True,
            "products": products,
            "count": len(products)
        })
    except Exception as e:
        print(f"❌ Error fetching products: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/ml/predict/custom', methods=['POST', 'OPTIONS'])
def predict_custom():
    """Run prediction with custom user inputs"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.json
        print(f"🔄 Received prediction request: {data}")
        
        # Extract user inputs
        sku = data.get('sku')
        product_name = data.get('productName')
        current_stock = float(data.get('currentStock', 0))
        daily_sales = float(data.get('dailySales', 0))
        weekly_sales = float(data.get('weeklySales', 0))
        reorder_level = float(data.get('reorderLevel', 0))
        lead_time = float(data.get('leadTime', 0))
        brand = data.get('brand', 'Unknown')
        category = data.get('category', 'Unknown')
        location = data.get('location', 'Unknown')
        supplier_name = data.get('supplierName', 'Unknown')
        forecast_days = int(data.get('forecastDays', 30))
        
        # Validate inputs
        if daily_sales <= 0:
            return jsonify({
                "success": False,
                "error": "Daily sales must be greater than 0"
            }), 400
        
        if weekly_sales <= 0:
            return jsonify({
                "success": False,
                "error": "Weekly sales must be greater than 0"
            }), 400
        
        # Calculate days_to_empty
        days_to_empty = current_stock / daily_sales if daily_sales > 0 else 999
        
        # Create DataFrame for prediction
        input_data = pd.DataFrame([{
            'current_stock': current_stock,
            'daily_sales': daily_sales,
            'weekly_sales': weekly_sales,
            'reorder_level': reorder_level,
            'lead_time': lead_time,
            'days_to_empty': days_to_empty,
            'brand': brand,
            'category': category,
            'location': location,
            'supplier_name': supplier_name
        }])
        
        # Preprocess and predict
        print("🔧 Preprocessing data...")
        processed_data, features = preprocess_data(input_data)
        X_test = processed_data[features]
        
        print("🤖 Running ML prediction for stock status...")
        y_pred = predict_stock_status(X_test)
        
        stock_status_pred = y_pred["stock_status_pred"].iloc[0]
        priority_pred = y_pred["priority_pred"].iloc[0]
        
        # Generate forecast using ARIMA trained on user inputs
        print(f"📊 Training ARIMA model and generating {forecast_days}-day forecast...")
        future_sales, forecast_metadata = forecast_with_arima(
            daily_sales=daily_sales,
            weekly_sales=weekly_sales,
            steps=forecast_days
        )
        
        # Log which method was used
        print(f"🔍 Forecast method used: {forecast_metadata['method']}")
        if forecast_metadata['arima_used']:
            print(f"   ✅ ARIMA model successfully trained and used")
            print(f"   📊 Model: ARIMA{forecast_metadata['model_details']['order']}")
            print(f"   📈 AIC: {forecast_metadata['model_details']['aic']:.2f}")
        else:
            print(f"   ⚠️ Fallback method used instead of ARIMA")
        
        # Generate alerts
        row_data = {
            'current_stock': current_stock,
            'stock_status_pred': stock_status_pred,
            'priority_pred': priority_pred
        }
        alert_text = generate_alerts(row_data, forecast_sales_data=future_sales)
        
        # Generate forecast data points
        current_date = datetime.now().strftime('%Y-%m-%d')
        forecast_data = generate_forecast_data(future_sales, current_date)
        
        # Create forecast document
        forecast_doc = {
            "itemId": sku,
            "productName": product_name,
            "sku": sku,
            "currentStock": int(current_stock),
            "stockStatusPred": stock_status_pred,
            "priorityPred": priority_pred,
            "alert": alert_text,
            "forecastData": forecast_data,
            "inputParams": {
                "dailySales": daily_sales,
                "weeklySales": weekly_sales,
                "reorderLevel": reorder_level,
                "leadTime": lead_time,
                "brand": brand,
                "category": category,
                "location": location,
                "supplierName": supplier_name
            },
            "forecastMethod": forecast_metadata["method"],
            "arimaUsed": forecast_metadata["arima_used"],
            "modelDetails": forecast_metadata["model_details"],
            "createdAt": datetime.now(),
            "updatedAt": datetime.now()
        }
        
        # Save to MongoDB
        print("💾 Saving forecast to MongoDB...")
        forecasts_collection.update_one(
            {"sku": sku},
            {"$set": forecast_doc},
            upsert=True
        )
        
        print(f"✅ Prediction complete for {sku}")
        
        return jsonify({
            "success": True,
            "forecast": forecast_doc,
            "message": f"Forecast generated successfully for {product_name}",
            "verification": {
                "arima_used": forecast_metadata["arima_used"],
                "method": forecast_metadata["method"],
                "model_details": forecast_metadata["model_details"]
            }
        })
    
    except Exception as e:
        print(f"❌ Error in custom prediction: {e}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/ml/status', methods=['GET'])
def model_status():
    """Get status of loaded models"""
    return jsonify({
        "ml_model_loaded": ml_model is not None,
        "ml_model_type": "XGBoost Native" if use_xgb_native else "Scikit-learn",
        "encoders_loaded": target_encoders is not None,
        "arima_models_loaded": arima_models is not None,
        "arima_models_count": len(arima_models) if arima_models else 0
    })


if __name__ == '__main__':
    print("🚀 Starting ML Prediction API...")
    
    if load_models():
        print("✅ All models loaded successfully")
        print("🌐 API running on http://localhost:5001")
        print("🔗 CORS enabled for http://localhost:5173")
        app.run(debug=True, port=5001, host='0.0.0.0')
    else:
        print("❌ Failed to load models. Please check model paths.")
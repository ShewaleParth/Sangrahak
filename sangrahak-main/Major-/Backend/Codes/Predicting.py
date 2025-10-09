import pandas as pd
import numpy as np
import joblib
import xgboost as xgb
from pymongo import MongoClient
from datetime import datetime, timedelta
from sklearn.preprocessing import LabelEncoder
import os


MONGODB_URI = "mongodb+srv://luckyak619_db_user:luckyak619@cluster0.lcmjwhw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGODB_URI)
db = client['inventroops']
forecasts_collection = db['forecasts']
# ----------------------------
# 1️⃣ Load new input-only test dataset
# ----------------------------
df_test = pd.read_csv(
    r"D:\sangrahak\Major-\Backend\Combinedcsvalert\new_test_inventory_input_only.csv"
)

# ----------------------------
# 2️⃣ Load saved models (JSON preferred, fallback to PKL)
# ----------------------------
ml_model = None
use_xgb_native = False

json_model_path = r"D:\sangrahak\Major-\Backend\Models\ml_stock_priority_model.json"
pkl_model_path = r"D:\sangrahak\Major-\Backend\Models\ml_stock_priority_model.pkl"

if os.path.exists(json_model_path):
    try:
        ml_model = xgb.Booster()
        ml_model.load_model(json_model_path)
        use_xgb_native = True
        print("✅ Loaded ML model from JSON")
    except Exception as e:
        print(f"⚠️ Failed to load JSON model, falling back to PKL. Error: {e}")

if ml_model is None and os.path.exists(pkl_model_path):
    ml_model = joblib.load(pkl_model_path)
    use_xgb_native = False
    print("✅ Loaded ML model from Pickle (.pkl)")

# Load encoders & ARIMA models
target_encoders = joblib.load(
    r"D:\sangrahak\Major-\Backend\Models\target_label_encoders.pkl"
)
arima_models = joblib.load(
    r"D:\sangrahak\Major-\Backend\Models\arima_models_dict.pkl"
)

# ----------------------------
# 3️⃣ Preprocess categorical features safely
# ----------------------------
features = [
    "current_stock",
    "daily_sales",
    "weekly_sales",
    "reorder_level",
    "lead_time",
    "days_to_empty",
]

categorical = ["brand", "category", "location", "supplier_name"]

for col in categorical:
    df_test[col] = df_test[col].astype(str)

    if col in target_encoders:
        le = target_encoders[col]

        # Add "Unknown" to classes if missing
        if "Unknown" not in le.classes_:
            le.classes_ = np.append(le.classes_, "Unknown")

        # Replace unseen labels with "Unknown"
        df_test[col] = df_test[col].apply(
            lambda x: x if x in le.classes_ else "Unknown"
        )

        # Transform with training encoder
        df_test[col] = le.transform(df_test[col])

    else:
        # If encoder not found, just label encode on the fly
        le = LabelEncoder()
        df_test[col] = le.fit_transform(df_test[col])

    features.append(col)

# ----------------------------
# 4️⃣ Predict Stock Status + Priority (ML)
# ----------------------------
X_test = df_test[features]

if use_xgb_native:
    dtest = xgb.DMatrix(X_test)
    y_pred_numeric = ml_model.predict(dtest)
    if y_pred_numeric.ndim > 1:
        y_pred_numeric = np.argmax(y_pred_numeric, axis=1)
else:
    y_pred_numeric = ml_model.predict(X_test)

# Handle model output shape safely
if isinstance(y_pred_numeric, np.ndarray):
    if y_pred_numeric.ndim == 1:
        print("⚠️ Model output is 1D. Creating duplicate predictions.")
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

# Decode back to labels with error handling
for col in ["stock_status_pred", "priority_pred"]:
    encoder_key = col.replace("_pred", "")
    if encoder_key in target_encoders:
        encoder = target_encoders[encoder_key]
        try:
            y_pred[col] = encoder.inverse_transform(y_pred[col].astype(int))
            print(f"✅ Decoded {col} successfully")
        except (ValueError, KeyError) as e:
            print(f"⚠️ Could not decode {col}: {e}. Using 'Unknown'")
            y_pred[col] = "Unknown"
    else:
        print(f"⚠️ No encoder found for {encoder_key}")

df_test["stock_status_pred"] = y_pred["stock_status_pred"]
df_test["priority_pred"] = y_pred["priority_pred"]

# ----------------------------
# 5️⃣ Forecast Future Sales (ARIMA)
# ----------------------------
def forecast_sales(item_id, steps=30):
    if item_id in arima_models:
        forecast = arima_models[item_id].forecast(steps=steps)
        forecast = np.maximum(forecast, 0)
    else:
        item_data = df_test[df_test["item_id"] == item_id]
        if not item_data.empty:
            forecast = np.array([np.mean(item_data["daily_sales"])] * steps)
        else:
            forecast = np.zeros(steps)
    return forecast

# ----------------------------
# 6️⃣ Generate Combined Alerts
# ----------------------------
def generate_alerts(row, forecast_sales=None):
    alerts = []

    if row["stock_status_pred"] == "Understock" or row["priority_pred"] in [
        "High",
        "Very High",
    ]:
        alerts.append(f"Immediate Restock Needed: {row['priority_pred']}")

    if forecast_sales is not None:
        total_forecasted = sum(forecast_sales)
        if total_forecasted > row["current_stock"]:
            alerts.append(
                f"Future Restock Warning: Forecasted sales {int(total_forecasted)} exceed current stock {row['current_stock']}"
            )

    if not alerts:
        alerts.append("Stock OK")

    return "; ".join(alerts)

# ----------------------------
# 7️⃣ Apply alerts for latest day of each item
# ----------------------------
alert_list = []
for item_id in df_test["item_id"].unique():
    item_data = df_test[df_test["item_id"] == item_id].sort_values("date").iloc[-1]
    future_sales = forecast_sales(item_id, steps=30)
    alert_text = generate_alerts(item_data, forecast_sales=future_sales)
    alert_list.append(
        {
            "item_id": item_id,
            "product_name": item_data["product_name"],
            "current_stock": item_data["current_stock"],
            "stock_status_pred": item_data["stock_status_pred"],
            "priority_pred": item_data["priority_pred"],
            "alert": alert_text,
        }
    )

alerts_df = pd.DataFrame(alert_list)

# Create output directory if it doesn't exist
output_path = r"D:\sangrahak\Major-\Backend\Combined csv alert\test_inventory_alerts.csv"
os.makedirs(os.path.dirname(output_path), exist_ok=True)

# Save the alerts
alerts_df.to_csv(output_path, index=False)
print(f"✅ Alerts generated and saved to: {output_path}")
print(f"📊 Total alerts generated: {len(alerts_df)}")
print("\nSample alerts:")
print(alerts_df.head())

import os
import math
from pymongo import MongoClient
from dotenv import load_dotenv

# Load env
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, '.env')
load_dotenv(env_path)

uri = os.getenv("MONGODB_URI")
if not uri:
    print("Error: MONGODB_URI not found")
    exit(1)

def reconfigure():
    client = MongoClient(uri)
    db = client['inventroops']
    
    # 1. Clear existing depots
    print("Clearing existing depots...")
    db.depots.delete_many({})
    
    # 2. Get all products
    products = list(db.products.find({}))
    if not products:
        print("No products found to distribute!")
        return
    
    print(f"Distributing {len(products)} products among 4 depots...")
    
    depot_configs = [
        {"name": "North Depot", "location": "New Delhi", "target_pct": 0.40},
        {"name": "South Depot", "location": "Chennai", "target_pct": 0.50},
        {"name": "East Depot", "location": "Kolkata", "target_pct": 0.60},
        {"name": "West Depot", "location": "Mumbai", "target_pct": 0.80}
    ]
    
    # Split products into 4 groups
    chunk_size = math.ceil(len(products) / 4)
    product_groups = [products[i:i + chunk_size] for i in range(0, len(products), chunk_size)]
    
    for i, config in enumerate(depot_configs):
        group = product_groups[min(i, len(product_groups)-1)]
        group_ids = [p['_id'] for p in group]
        
        # Update products' location
        db.products.update_many(
            {"_id": {"$in": group_ids}},
            {"$set": {"location": config['name']}}
        )
        
        # Calculate total stock in this group
        total_stock = sum(p.get('stock', 0) for p in group)
        # Ensure total_stock is at least something if it's 0
        if total_stock == 0:
            total_stock = 1000 
            db.products.update_many({"_id": {"$in": group_ids}}, {"$set": {"stock": 50}})
        
        # Calculate capacity to hit target percentage
        # total_stock / capacity = target_pct  => capacity = total_stock / target_pct
        capacity = int(total_stock / config['target_pct'])
        
        # Determine status
        status = 'normal'
        if config['target_pct'] >= 0.80:
            status = 'critical'
        elif config['target_pct'] >= 0.60:
            status = 'warning'
            
        # Create depot
        depot_doc = {
            "name": config['name'],
            "location": config['location'],
            "capacity": capacity,
            "currentUtilization": total_stock,
            "itemsStored": total_stock, # Treating units as itemsStored
            "status": status,
            "createdAt": group[0].get('createdAt', None) or "2024-01-01",
            "updatedAt": "2024-12-19"
        }
        
        db.depots.insert_one(depot_doc)
        print(f"Created {config['name']} with {len(group)} products. Total Units: {total_stock}, Capacity: {capacity} ({config['target_pct']*100}%).")

    print("\nReconfiguration complete!")

if __name__ == "__main__":
    reconfigure()

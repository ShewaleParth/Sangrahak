import pandas as pd
import requests
import json
import os

# Configuration
CSV_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'Dataset', 'trial_250_depot_dataset.csv')
API_URL = "http://localhost:5000/api"

def seed_data():
    if not os.path.exists(CSV_PATH):
        print(f"Error: CSV file not found at {CSV_PATH}")
        return

    print(f"Reading data from {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)
    
    # Fill NaN values
    df = df.fillna({
        'category': 'Uncategorized',
        'stock': 0,
        'reorderPoint': 10,
        'supplier': 'Unknown',
        'location': 'Unknown',
        'price': 0
    })

    import random
    
    products = []
    for _, row in df.iterrows():
        p = row.to_dict()
        # Add randomized fields for ML
        p['dailySales'] = random.randint(2, 15)
        p['weeklySales'] = p['dailySales'] * random.randint(5, 8)
        p['brand'] = random.choice(['TechPro', 'EcoLife', 'SmartHome', 'OfficeReady', 'PurePlus'])
        p['leadTime'] = random.randint(3, 14)
        products.append(p)
    
    print(f"Found {len(products)} products. Starting bulk upload...")
    
    # Split into chunks of 50 to avoid large payload issues if any
    chunk_size = 50
    for i in range(0, len(products), chunk_size):
        chunk = products[i:i + chunk_size]
        try:
            response = requests.post(f"{API_URL}/products/bulk", json=chunk)
            if response.status_code == 200:
                result = response.json()
                print(f"Chunk {i//chunk_size + 1}: Success={result['results']['success']}, Failed={result['results']['failed']}")
            else:
                print(f"Failed to upload chunk starting at {i}: {response.text}")
        except Exception as e:
            print(f"Error during bulk upload at chunk starting at {i}: {e}")

if __name__ == "__main__":
    seed_data()

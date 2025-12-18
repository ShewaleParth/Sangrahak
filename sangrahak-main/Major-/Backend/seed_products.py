import csv
import requests
import json
import os

API_URL = "http://localhost:5000/api/products/bulk"
CSV_FILE = "../../Dataset/trial_250_depot_dataset.csv"

def seed_products():
    print(f"Reading from {CSV_FILE}...")
    products = []
    
    if not os.path.exists(CSV_FILE):
        print(f"Error: File {CSV_FILE} not found!")
        return

    try:
        with open(CSV_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Convert types
                product = {
                    "sku": row['sku'],
                    "name": row['name'],
                    "category": row['category'],
                    "stock": int(row['stock']),
                    "reorderPoint": int(row['reorderPoint']),
                    "supplier": row['supplier'],
                    "price": float(row['price']),
                    "location": row['location']
                }
                products.append(product)
                
        print(f"Found {len(products)} products. Uploading to {API_URL}...")
        
        # Upload in chunks of 50 to avoid timeouts/payload limits
        chunk_size = 50
        for i in range(0, len(products), chunk_size):
            chunk = products[i:i + chunk_size]
            print(f"Uploading chunk {i//chunk_size + 1} ({len(chunk)} items)...")
            
            try:
                response = requests.post(API_URL, json=chunk)
                if response.status_code in [200, 201]:
                    print(f"Success: {response.json()}")
                else:
                    print(f"Failed chunk {i}: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"Error uploading chunk {i}: {e}")
                
        print("Seeding complete.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    seed_products()

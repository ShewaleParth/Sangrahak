import requests

try:
    print("Checking Node API (5000)...")
    r = requests.get('http://localhost:5000/api/products?limit=1')
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text[:200]}")
    
    print("\nChecking Python API (5001)...")
    r = requests.get('http://localhost:5001/api/ml/products')
    print(f"Status: {r.status_code}")
    data = r.json()
    print(f"Success: {data.get('success')}")
    print(f"Count: {data.get('count')}")
    print(f"Products length: {len(data.get('products', []))}")
except Exception as e:
    print(f"Error: {e}")

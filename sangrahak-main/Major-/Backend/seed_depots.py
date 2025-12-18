import requests
import json
import random

API_URL = "http://localhost:5000/api"

depots = [
    {"name": "North Zone", "location": "New Delhi", "capacity": 2000, "manager": "Rajesh Kumar"},
    {"name": "South Zone", "location": "Chennai", "capacity": 2000, "manager": "Suresh Reddy"},
    {"name": "East Zone", "location": "Kolkata", "capacity": 1500, "manager": "Amit Das"},
    {"name": "West Zone", "location": "Mumbai", "capacity": 2500, "manager": "Vikram Shah"},
    {"name": "Central Zone", "location": "Nagpur", "capacity": 1800, "manager": "Vijay Singh"}
]

def seed_depots():
    print("Creating depots...")
    created_depots = []
    
    # First get existing to avoid duplicates (naive check)
    try:
        r = requests.get(f"{API_URL}/depots")
        existing = r.json() if r.status_code == 200 else []
        existing_names = [d['name'] for d in existing]
    except:
        existing_names = []

    for d in depots:
        if d['name'] in existing_names:
            print(f"Depot {d['name']} already exists.")
            continue
            
        try:
            res = requests.post(f"{API_URL}/depots", json=d)
            if res.status_code in [200, 201]:
                print(f"Created {d['name']}")
                created_depots.append(d['name'])
            else:
                print(f"Failed to create {d['name']}: {res.text}")
        except Exception as e:
            print(f"Error creating {d['name']}: {e}")

if __name__ == "__main__":
    seed_depots()

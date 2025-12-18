import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load env from current dir
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
print(f"Loading env from: {env_path}")
load_dotenv(env_path)

uri = os.getenv("MONGODB_URI")
if not uri:
    print("Error: MONGODB_URI not found")
    exit(1)

print(f"Connecting to MongoDB...")
try:
    client = MongoClient(uri)
    db = client['inventroops'] # Server.js doesn't specify DB name in URI usually, usually default. app.py specifies 'inventroops'.
    
    # Check collections
    print(f"Collections: {db.list_collection_names()}")
    
    count = db.products.count_documents({})
    print(f"Product count: {count}")
    
    if count > 0:
        p = db.products.find_one()
        print("Sample product:")
        print(f"Name: {p.get('name')}, Location: {p.get('location')}")
        print(p)
    else:
        print("No products found in 'products' collection.")
        
        # Check if they are in 'test' db or other
        db_names = client.list_database_names()
        print(f"Databases: {db_names}")

except Exception as e:
    print(f"Connection failed: {e}")

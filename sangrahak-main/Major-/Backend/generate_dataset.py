import csv
import random

depots = ["North Zone", "South Zone", "East Zone", "West Zone", "Central Zone"]
categories = ["Electronics", "Furniture", "Stationery", "Pantry", "Accessories"]
suppliers = ["TechSource", "OfficePro", "WriteWell", "EcoWare", "CleanCo"]

# Items per category to rotate names
item_names = {
    "Electronics": ["Mouse", "Keyboard", "Monitor", "Cable", "Headset", "Webcam", "Speaker", "Drive", "Charger", "Hub"],
    "Furniture": ["Chair", "Desk", "Lamp", "Shelf", "Cabinet", "Mat", "Bin", "Stool", "Stand", "Divider"],
    "Stationery": ["Pen", "Paper", "Notebook", "Stapler", "Glue", "Tape", "Scissors", "Marker", "Folder", "Binder"],
    "Pantry": ["Coffee", "Tea", "Sugar", "Milk", "Biscuits", "Cups", "Napkins", "Water", "Snacks", "Soda"],
    "Accessories": ["Pad", "Cleaner", "Sleeve", "Ties", "Rest", "Holder", "Stand", "Lock", "Cover", "Cloth"]
}

def generate_csv():
    filename = "../../Dataset/trial_250_depot_dataset.csv"
    
    with open(filename, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["sku", "name", "category", "stock", "reorderPoint", "supplier", "price", "location"])
        
        sku_counter = 1
        
        for depot in depots:
            # 50 items per depot
            for i in range(50):
                category = categories[i % 5]
                base_name = item_names[category][i % 10]
                name = f"{base_name} {depot.split()[0]} {i+1}" # Uniqueish name
                
                # Balanced stats: 0-12=Out, 13-24=Under, 25-37=In, 38-49=Over
                if i < 13: # Out
                    stock = 0
                    reorder = 10
                elif i < 25: # Under
                    stock = 5
                    reorder = 15
                elif i < 38: # In
                    stock = 25
                    reorder = 10
                else: # Over
                    stock = 100
                    reorder = 10
                    
                supplier = suppliers[i % 5]
                price = round(random.uniform(5.0, 500.0), 2)
                sku = f"SKU{sku_counter:03d}"
                sku_counter += 1
                
                writer.writerow([sku, name, category, stock, reorder, supplier, price, depot])
                
    print(f"Generated {filename}")

if __name__ == "__main__":
    generate_csv()

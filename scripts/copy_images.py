import os
import shutil
import glob
from PIL import Image

SOURCE_DIR = r"C:\Users\omkar\.gemini\antigravity-ide\brain\0072ec58-6568-4358-9b3a-cc8e54f6a354"
TARGET_PROD_DIR = r"c:\Users\omkar\Downloads\Intership-Project\public\images\products"
TARGET_WH_DIR = r"c:\Users\omkar\Downloads\Intership-Project\public\images\warehouses"
TARGET_BG_DIR = r"c:\Users\omkar\Downloads\Intership-Project\public\images\backgrounds"

os.makedirs(TARGET_PROD_DIR, exist_ok=True)
os.makedirs(TARGET_WH_DIR, exist_ok=True)
os.makedirs(TARGET_BG_DIR, exist_ok=True)

mapping = {
    # Products
    "circuit_board_pro": os.path.join(TARGET_PROD_DIR, "circuit-board-pro.jpg"),
    "servo_motor": os.path.join(TARGET_PROD_DIR, "servo-motor.jpg"),
    "copper_wire": os.path.join(TARGET_PROD_DIR, "copper-wire.jpg"),
    "led_panel": os.path.join(TARGET_PROD_DIR, "led-panel.jpg"),
    "steel_bearings": os.path.join(TARGET_PROD_DIR, "steel-bearings.jpg"),
    "thermal_paste": os.path.join(TARGET_PROD_DIR, "thermal-paste.jpg"),
    "pcb_connector": os.path.join(TARGET_PROD_DIR, "pcb-connector.jpg"),
    "aluminum_sheet": os.path.join(TARGET_PROD_DIR, "aluminum-sheet.jpg"),
    "resistor_pack": os.path.join(TARGET_PROD_DIR, "resistor-pack.jpg"),
    "product_hydraulic_pump": os.path.join(TARGET_PROD_DIR, "hydraulic-pump.jpg"),
    "product_ergonomic_chair": os.path.join(TARGET_PROD_DIR, "office-chair.jpg"),
    "product_wireless_mouse": os.path.join(TARGET_PROD_DIR, "wireless-mouse.jpg"),
    "product_packaging_tape": os.path.join(TARGET_PROD_DIR, "packaging-tape.jpg"),
    "product_safety_helmet": os.path.join(TARGET_PROD_DIR, "safety-helmet.jpg"),
    "product_industrial_valves": os.path.join(TARGET_PROD_DIR, "pneumatic-valves.jpg"),
    "product_power_supply": os.path.join(TARGET_PROD_DIR, "power-supply.jpg"),
    
    # Warehouses (ALL 6 UNIQUE!)
    "warehouse_mumbai": os.path.join(TARGET_WH_DIR, "warehouse-mumbai.jpg"),
    "warehouse_delhi": os.path.join(TARGET_WH_DIR, "warehouse-delhi.jpg"),
    "warehouse_bangalore": os.path.join(TARGET_WH_DIR, "warehouse-bangalore.jpg"),
    "warehouse_hero": os.path.join(TARGET_WH_DIR, "warehouse-kolkata.jpg"),
    "warehouse_ahmedabad": os.path.join(TARGET_WH_DIR, "warehouse-ahmedabad.jpg"),
    "warehouse_pune": os.path.join(TARGET_WH_DIR, "warehouse-pune.jpg"),
}

for key, dest in mapping.items():
    matches = glob.glob(os.path.join(SOURCE_DIR, f"{key}_*.jpg"))
    if matches:
        latest = sorted(matches)[-1]
        try:
            with Image.open(latest) as img:
                img = img.convert("RGB")
                img.thumbnail((800, 800), Image.Resampling.LANCZOS)
                img.save(dest, "JPEG", optimize=True, quality=82)
            print(f"Copied & Optimized {os.path.basename(latest)} -> {dest}")
        except Exception as e:
            shutil.copy2(latest, dest)
            print(f"Copied fallback {latest} -> {dest}")
    else:
        print(f"Warning: No match found for {key}")

print("All unique image assets synchronized successfully!")

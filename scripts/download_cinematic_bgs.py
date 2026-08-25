import os
import urllib.request
from PIL import Image

TARGET_DIR = r"c:\Users\omkar\Downloads\Intership-Project\public\images\backgrounds"
PAGES_DIR = r"c:\Users\omkar\Downloads\Intership-Project\public\images\pages"
os.makedirs(TARGET_DIR, exist_ok=True)
os.makedirs(PAGES_DIR, exist_ok=True)

CINEMATIC_BACKGROUNDS = {
    "mountain-sunset.jpg": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85",
    "city-skyline.jpg": "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=2000&q=85",
    "ocean-sunset.jpg": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85",
    "modern-office.jpg": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2000&q=85",
    "warehouse-shelves.jpg": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2000&q=85",
    "nebula-space.jpg": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2000&q=85",
    "city-timelapse.jpg": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=2000&q=85",
    "aurora-borealis.jpg": "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=2000&q=85",
    "warehouse-sunset-drone.jpg": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2000&q=85",
    "shipping-port.jpg": "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=2000&q=85",
    "laptop-studio.jpg": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=2000&q=85",
    "meeting-room.jpg": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=2000&q=85",
}

req_headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

print(f"Downloading {len(CINEMATIC_BACKGROUNDS)} high-resolution cinematic backdrops...")
for name, url in CINEMATIC_BACKGROUNDS.items():
    dest = os.path.join(TARGET_DIR, name)
    try:
        req = urllib.request.Request(url, headers=req_headers)
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = resp.read()
            with open(dest + ".tmp", "wb") as f:
                f.write(data)
            with Image.open(dest + ".tmp") as img:
                img = img.convert("RGB")
                img.thumbnail((1920, 1080), Image.Resampling.LANCZOS)
                img.save(dest, "JPEG", optimize=True, quality=85)
            if os.path.exists(dest + ".tmp"):
                os.remove(dest + ".tmp")
            print(f"✓ Downloaded & Optimized -> {name}")
    except Exception as e:
        print(f"Error {name}: {e}")

print("Cinematic background library ready!")

import urllib.request
import os
from PIL import Image

TARGET = r"c:\Users\omkar\Downloads\Intership-Project\public\images\backgrounds\warehouse-sunset-drone.jpg"

# High-resolution aerial warehouse logistics sunset image matching Image 2
url = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2400&q=90"

req = urllib.request.Request(url, headers={
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
})

try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = resp.read()
        with open(TARGET + ".tmp", "wb") as f:
            f.write(data)
        with Image.open(TARGET + ".tmp") as img:
            img = img.convert("RGB")
            img.save(TARGET, "JPEG", optimize=True, quality=90)
        if os.path.exists(TARGET + ".tmp"):
            os.remove(TARGET + ".tmp")
        print("Successfully updated warehouse-sunset-drone.jpg with sunset logistics imagery!")
except Exception as e:
    print(f"Download failed: {e}")

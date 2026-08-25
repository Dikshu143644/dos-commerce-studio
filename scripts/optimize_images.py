import os
import glob
from PIL import Image

def optimize_directory(dir_path: str, max_size=(600, 600), quality=80):
    files = glob.glob(os.path.join(dir_path, "**", "*.jpg"), recursive=True)
    for f in files:
        orig_size = os.path.getsize(f)
        try:
            with Image.open(f) as img:
                img = img.convert("RGB")
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
                img.save(f, "JPEG", optimize=True, quality=quality)
            new_size = os.path.getsize(f)
            print(f"Optimized {os.path.basename(f)}: {orig_size / 1024:.1f} KB -> {new_size / 1024:.1f} KB")
        except Exception as e:
            print(f"Error optimizing {f}: {e}")

if __name__ == "__main__":
    optimize_directory("public/images")

import os
from PIL import Image

ref_dir = "design-references"
files = sorted([f for f in os.listdir(ref_dir) if f.endswith(".png")])

print(f"Found {len(files)} reference images.")
for f in files:
    path = os.path.join(ref_dir, f)
    with Image.open(path) as img:
        print(f"{f}: {img.size[0]}x{img.size[1]}, mode={img.mode}")

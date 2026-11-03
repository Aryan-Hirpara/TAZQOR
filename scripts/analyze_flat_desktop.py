import os
from PIL import Image

ref_dir = "design-references"
flat_file = "Screenshot 2026-11-01 at 4.51.31 PM.png"
img = Image.open(os.path.join(ref_dir, flat_file))
w, h = img.size
print(f"Image {flat_file} has size {w}x{h}")

def hex_at(x, y):
    px = img.getpixel((int(x), int(y)))
    return "#{:02x}{:02x}{:02x}".format(px[0], px[1], px[2])

# Outer background (outside the app window canvas if there's padding or grey background)
# Let's inspect coordinates across the image
print("Top-left border/bg:", hex_at(10, 10))
print("Center-top bg:", hex_at(w/2, 10))

# Let's crop and save key sections of the flat desktop:
# 1. Sidebar
# 2. Top bar (logo, tabs, outlet pill, round button)
# 3. Hero card ("Hi Mike, here's what's happening...")
# 4. Target bar
# 5. Sales this year line chart
# 6. Average Items per sale dotted chart
# 7. Average Sale Value daily pill-bar chart
# 8. Transfer & Purchase orders cards
# 9. Gross Profit card
# 10. Net Profit card

crops = {
    "sidebar": (0, 0, int(w*0.08), h),
    "top_bar": (int(w*0.06), 0, w, int(h*0.12)),
    "hero_card": (int(w*0.07), int(h*0.09), int(w*0.43), int(h*0.43)),
    "target_bar": (int(w*0.07), int(h*0.42), int(w*0.62), int(h*0.58)),
    "line_chart": (int(w*0.07), int(h*0.57), int(w*0.62), int(h*0.93)),
    "top_right_charts": (int(w*0.42), int(h*0.09), int(w*0.97), int(h*0.42)),
    "middle_orders_cards": (int(w*0.61), int(h*0.42), int(w*0.78), int(h*0.93)),
    "gross_net_profit": (int(w*0.77), int(h*0.42), int(w*0.97), int(h*0.93)),
}

for name, box in crops.items():
    cropped = img.crop(box)
    cropped.save(f"ui-audit/crops/{name}.png")
    print(f"Saved crop: {name} (size {cropped.size})")

# Also let's check the mobile reference images:
mobile_files = [
    "Screenshot 2026-11-01 at 4.52.20 PM.png",
    "Screenshot 2026-11-01 at 4.52.34 PM.png",
    "Screenshot 2026-11-01 at 4.52.45 PM.png",
    "Screenshot 2026-11-01 at 4.52.49 PM.png",
    "Screenshot 2026-11-01 at 4.52.53 PM.png",
    "Screenshot 2026-11-01 at 4.52.58 PM.png",
]

for mf in mobile_files:
    mimg = Image.open(os.path.join(ref_dir, mf))
    print(f"Mobile file {mf}: size {mimg.size}")
    # save direct copy for audit
    mimg.save(f"ui-audit/crops/{mf.replace(' ', '_')}")

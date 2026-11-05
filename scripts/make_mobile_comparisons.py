import os
from PIL import Image, ImageDraw, ImageFont

DESIGN_REFS = "design-references"
CURRENT_MOBILE = "ui-audit/mobile"
OUT_DIR = "ui-audit/mobile"

os.makedirs(OUT_DIR, exist_ok=True)

def create_side_by_side(ref_path, current_path, output_path, title):
    if not os.path.exists(ref_path) or not os.path.exists(current_path):
        print(f"Skipping {title}: missing file {ref_path} or {current_path}")
        return

    ref_img = Image.open(ref_path).convert("RGBA")
    curr_img = Image.open(current_path).convert("RGBA")

    # Resize current to match reference height or standardized height 844
    target_h = max(ref_img.height, 600)
    
    # Scale ref maintaining aspect ratio
    ref_w = int(ref_img.width * (target_h / ref_img.height))
    ref_resized = ref_img.resize((ref_w, target_h), Image.Resampling.LANCZOS)

    # Scale curr maintaining aspect ratio
    curr_w = int(curr_img.width * (target_h / curr_img.height))
    curr_resized = curr_img.resize((curr_w, target_h), Image.Resampling.LANCZOS)

    canvas_w = ref_w + curr_w + 30
    canvas_h = target_h + 60

    canvas = Image.new("RGBA", (canvas_w, canvas_h), (24, 24, 27, 255))
    draw = ImageDraw.Draw(canvas)

    # Paste images
    canvas.paste(ref_resized, (10, 50))
    canvas.paste(curr_resized, (ref_w + 20, 50))

    # Draw header banner text
    draw.text((15, 15), f"REFERENCE ({os.path.basename(ref_path)})", fill=(215, 255, 0, 255))
    draw.text((ref_w + 25, 15), f"REBUILT TAZQOR: {title}", fill=(35, 215, 255, 255))

    canvas.save(output_path)
    print(f"Saved: {output_path}")

# 1. Dashboard comparison against ref09
create_side_by_side(
    os.path.join(DESIGN_REFS, "ref09.png"),
    os.path.join(CURRENT_MOBILE, "mobile_dashboard_dark.png"),
    os.path.join(OUT_DIR, "compare_ref09_dashboard.png"),
    "Mobile Dashboard (Dark Mode)"
)

# 2. Orders comparison against ref13
create_side_by_side(
    os.path.join(DESIGN_REFS, "ref13.png"),
    os.path.join(CURRENT_MOBILE, "mobile_orders_light.png"),
    os.path.join(OUT_DIR, "compare_ref13_orders.png"),
    "Mobile Orders"
)

# 3. Reports comparison against ref12
create_side_by_side(
    os.path.join(DESIGN_REFS, "ref12.png"),
    os.path.join(CURRENT_MOBILE, "mobile_reports_light.png"),
    os.path.join(OUT_DIR, "compare_ref12_reports.png"),
    "Mobile Reports & Charts"
)

# 4. Sales Analyzing / Profit Cards against ref10 / ref14
create_side_by_side(
    os.path.join(DESIGN_REFS, "ref14.png"),
    os.path.join(CURRENT_MOBILE, "mobile_reports_dark.png"),
    os.path.join(OUT_DIR, "compare_ref14_profit.png"),
    "Mobile Sales Analyzing & Profit Join"
)

print("All mobile comparison side-by-sides generated!")


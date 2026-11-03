from PIL import Image
import numpy as np

canvas = Image.open("ui-audit/crops/app_canvas.png")
cw, ch = canvas.size
print(f"Canvas: {cw}x{ch}")

def hex_c(x, y):
    p = canvas.getpixel((int(x), int(y)))
    return "#{:02x}{:02x}{:02x}".format(p[0], p[1], p[2])

print("--- PAGE BACKGROUND SAMPLING ---")
print("Top-left (near logo):", hex_c(20, 20))
print("Top-center (behind tabs):", hex_c(cw/2, 25))
print("Top-right (behind outlets):", hex_c(cw - 50, 25))
print("Middle-left (sidebar background):", hex_c(35, ch/2))
print("Middle background (between cards):", hex_c(cw*0.42, ch*0.40))
print("Bottom-left:", hex_c(35, ch - 30))
print("Bottom-right:", hex_c(cw - 30, ch - 30))

print("\n--- LIME ACCENT SAMPLING ---")
# Gross profit card is in the lower-right area
arr = np.array(canvas)
lime_mask = (arr[:, :, 1] > 220) & (arr[:, :, 0] > 180) & (arr[:, :, 2] < 120)
lime_y, lime_x = np.where(lime_mask)
if len(lime_x) > 0:
    sample_p = arr[lime_y[0], lime_x[0]]
    print(f"Detected Lime Sample 1: #{sample_p[0]:02x}{sample_p[1]:02x}{sample_p[2]:02x} at ({lime_x[0]}, {lime_y[0]})")
    med_lime = np.median(arr[lime_mask], axis=0).astype(int)
    print(f"Median Lime: #{med_lime[0]:02x}{med_lime[1]:02x}{med_lime[2]:02x} (RGB {med_lime[0]}, {med_lime[1]}, {med_lime[2]})")

print("\n--- NET PROFIT (BLACK/CHARCOAL) SAMPLING ---")
sub = arr[int(ch*0.65):int(ch*0.95), int(cw*0.75):int(cw)]
dark_mask = (sub[:, :, 0] < 30) & (sub[:, :, 1] < 30) & (sub[:, :, 2] < 30)
if np.any(dark_mask):
    med_dark = np.median(sub[dark_mask], axis=0).astype(int)
    print(f"Net Profit Card Charcoal: #{med_dark[0]:02x}{med_dark[1]:02x}{med_dark[2]:02x}")

print("\n--- HERO CARD SAMPLING ---")
hero_tl = hex_c(cw*0.10, ch*0.12)
hero_tr = hex_c(cw*0.38, ch*0.12)
hero_bl = hex_c(cw*0.10, ch*0.38)
hero_br = hex_c(cw*0.38, ch*0.38)
hero_center = hex_c(cw*0.24, ch*0.25)
print(f"Hero card top-left: {hero_tl}")
print(f"Hero card top-right: {hero_tr}")
print(f"Hero card bottom-left: {hero_bl}")
print(f"Hero card bottom-right: {hero_br}")
print(f"Hero card center: {hero_center}")

print("\n--- TOP RIGHT CHARTS CARD ---")
tr_c1 = hex_c(cw*0.50, ch*0.15)
tr_c2 = hex_c(cw*0.90, ch*0.15)
print(f"Top-right chart card bg: {tr_c1} to {tr_c2}")

print("\n--- TRANSFER & PURCHASE ORDERS CARDS ---")
order_card_bg = hex_c(cw*0.68, ch*0.50)
print(f"Order card bg: {order_card_bg}")

print("\n--- TARGET BAR CARD ---")
target_card_bg = hex_c(cw*0.20, ch*0.48)
print(f"Target card bg: {target_card_bg}")

print("\n--- LINE CHART CARD ---")
line_card_bg = hex_c(cw*0.20, ch*0.70)
print(f"Line chart card bg: {line_card_bg}")


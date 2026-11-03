from PIL import Image

img = Image.open("design-references/Screenshot 2026-11-01 at 4.51.31 PM.png")
w, h = img.size

# Find bounds of the white/light app canvas inside the grey surround
# Scan horizontally at h/2 to find where non-#929292 begins
bg = img.getpixel((5, 5))
print("Outer border pixel:", bg)

left = 0
for x in range(w):
    p = img.getpixel((x, h//2))
    # difference from border
    diff = sum(abs(p[i] - bg[i]) for i in range(3))
    if diff > 30:
        left = x
        break

right = w - 1
for x in range(w - 1, -1, -1):
    p = img.getpixel((x, h//2))
    diff = sum(abs(p[i] - bg[i]) for i in range(3))
    if diff > 30:
        right = x
        break

top = 0
for y in range(h):
    p = img.getpixel((w//2, y))
    diff = sum(abs(p[i] - bg[i]) for i in range(3))
    if diff > 30:
        top = y
        break

bottom = h - 1
for y in range(h - 1, -1, -1):
    p = img.getpixel((w//2, y))
    diff = sum(abs(p[i] - bg[i]) for i in range(3))
    if diff > 30:
        bottom = y
        break

print(f"App window canvas bounding box: left={left}, top={top}, right={right}, bottom={bottom}")
print(f"Canvas size: {right - left} x {bottom - top}")

app_canvas = img.crop((left, top, right, bottom))
app_canvas.save("ui-audit/crops/app_canvas.png")
print("Saved app_canvas.png")


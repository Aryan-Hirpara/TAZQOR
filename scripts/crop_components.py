from PIL import Image

canvas = Image.open("ui-audit/crops/app_canvas.png")
cw, ch = canvas.size

# Let's crop:
# 1. Top Bar complete
topbar = canvas.crop((0, 0, cw, 120))
topbar.save("ui-audit/crops/detailed_topbar.png")

# 2. Sidebar rail
sidebar = canvas.crop((0, 0, 100, ch))
sidebar.save("ui-audit/crops/detailed_sidebar.png")

# 3. Greeting & Month Bar
hero = canvas.crop((70, 70, 680, 480))
hero.save("ui-audit/crops/detailed_hero.png")

# 4. Target bar
target = canvas.crop((70, 480, 1060, 630))
target.save("ui-audit/crops/detailed_target.png")

# 5. Line chart ("Your Sales this year")
line_chart = canvas.crop((70, 630, 1060, 1070))
line_chart.save("ui-audit/crops/detailed_line_chart.png")

# 6. Top right charts ("Average Items per Sale" and "Average Sale Value")
top_right = canvas.crop((690, 70, 1610, 480))
top_right.save("ui-audit/crops/detailed_top_right.png")

# 7. Transfer & Purchase orders cards
orders = canvas.crop((1070, 480, 1330, 1070))
orders.save("ui-audit/crops/detailed_orders.png")

# 8. Gross Profit & Net Profit cards
profit = canvas.crop((1330, 480, 1610, 1070))
profit.save("ui-audit/crops/detailed_profit.png")

print("All detailed component crops saved to ui-audit/crops/")


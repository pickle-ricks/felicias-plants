import csv
from collections import OrderedDict

def load_plants(csv_path):
    with open(csv_path, newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))

def group_by_category(plants):
    categories = OrderedDict()
    for plant in plants:
        categories.setdefault(plant['Category'], []).append(plant)
    return categories

def generate_markdown(plants):
    categories = group_by_category(plants)
    lines = [
        '# Plant Image Matching Guide',
        '',
        'This guide matches each plant image file with its correct name and care instructions.',
        ''
    ]
    headings = {
        'Tropical & Foliage': '## 🌺 Tropical & Foliage Plants',
        'Succulents & Cacti': '## 🌵 Succulents & Cacti'
    }
    index = 1
    for category, items in categories.items():
        lines.append(headings.get(category, f'## {category}'))
        lines.append('')
        for plant in items:
            lines.extend([
                f"### {index}. {plant['Plant Name']}",
                f"- **Image File:** `{plant['Image File']}`",
                f"- **Care Instructions:** {plant['Light']} {plant['Water']} {plant['Notes']}",
                ''
            ])
            index += 1
    total = len(plants)
    tropical = len(categories.get('Tropical & Foliage', []))
    succ = len(categories.get('Succulents & Cacti', []))
    lines.extend([
        '## Summary',
        '',
        f'This collection contains **{total} different plants** organized into two main categories:',
        f'- **Tropical & Foliage Plants ({tropical} plants):** These prefer higher humidity and indirect light',
        f'- **Succulents & Cacti ({succ} plants):** These prefer bright direct light and minimal watering',
        '',
        'Each plant has been matched with its corresponding image file and specific care instructions for optimal growth and health.'
    ])
    return '\n'.join(lines)

def generate_html(plants):
    categories = group_by_category(plants)
    titles = {
        'Tropical & Foliage': '🌺 Tropical & Foliage Plants',
        'Succulents & Cacti': '🌵 Succulents & Cacti'
    }
    parts = [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '<head>',
        '    <meta charset="UTF-8">',
        '    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '    <title>🌱 Plant Care Guide 🌱</title>',
        '    <style>',
        '        body {font-family: Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 20px;}',
        '        .container {max-width: 1200px; margin: auto;}',
        '        .category-section {margin-bottom: 40px;}',
        '        .plants-grid {display: grid; grid-template-columns: repeat(auto-fit, minmax(250px,1fr)); gap: 20px;}',
        '        .plant-card {background: #fff; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);}',
        '        .plant-card img {width: 100%; border-radius: 4px;}',
        '        .plant-card h3 {margin: 10px 0;}',
        '        .care-tips {list-style: none; padding: 0;}',
        '        .care-tips li {margin-bottom: 5px;}',
        '    </style>',
        '</head>',
        '<body>',
        '    <div class="container">',
        '        <h1>🌱 Plant Care Guide 🌱</h1>'
    ]
    for category, items in categories.items():
        parts.extend([
            '        <div class="category-section">',
            f'            <h2>{titles.get(category, category)}</h2>',
            '            <div class="plants-grid">'
        ])
        for plant in items:
            parts.extend([
                '                <div class="plant-card">',
                f'                    <img src="{plant["Image File"]}" alt="{plant["Plant Name"]}">',
                f'                    <h3>{plant["Plant Name"]}</h3>',
                '                    <ul class="care-tips">',
                f'                        <li><strong>Light:</strong> {plant["Light"]}</li>',
                f'                        <li><strong>Water:</strong> {plant["Water"]}</li>',
                f'                        <li><strong>Notes:</strong> {plant["Notes"]}</li>',
                '                    </ul>',
                '                </div>'
            ])
        parts.extend([
            '            </div>',
            '        </div>'
        ])
    parts.extend([
        '    </div>',
        '</body>',
        '</html>'
    ])
    return '\n'.join(parts)

def main():
    plants = load_plants('Plant_Care_Guide.csv')
    with open('Plant_Image_Matching_Guide.md', 'w', encoding='utf-8') as md:
        md.write(generate_markdown(plants))
    with open('felicias-plants.html', 'w', encoding='utf-8') as html:
        html.write(generate_html(plants))

if __name__ == '__main__':
    main()

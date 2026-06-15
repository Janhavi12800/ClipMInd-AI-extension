#!/usr/bin/env python3
"""Generate Chrome Web Store screenshots and promo images from HTML templates."""

import os
import subprocess
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'Pillow', '-q'])
    from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCREENSHOTS_DIR = os.path.join(ROOT, 'store-assets', 'screenshots')
OUTPUT_DIR = os.path.join(ROOT, 'store-assets', 'generated')

TEMPLATES = [
    ('01-popup-templates.html', 'screenshot-1-popup.png'),
    ('02-analysis-output.html', 'screenshot-2-analysis.png'),
    ('03-vision-ai.html', 'screenshot-3-vision.png'),
]

def render_html_to_image(html_path, output_path, width=1280, height=800):
    """Try playwright, fallback to styled PIL promo image."""
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={'width': width, 'height': height})
            page.goto(f'file://{html_path}')
            page.screenshot(path=output_path)
            browser.close()
        return True
    except Exception:
        return render_fallback_promo(output_path, os.path.basename(html_path), width, height)

def render_fallback_promo(output_path, name, width, height):
    img = Image.new('RGB', (width, height), (15, 23, 42))
    draw = ImageDraw.Draw(img)

    for y in range(height):
        r = int(15 + (y / height) * 10)
        g = int(23 + (y / height) * 5)
        b = int(42 + (y / height) * 30)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    titles = {
        '01-popup-templates.html': ('1-Click AI Trading Prompts', 'NSE/BSE · Forex · Crypto'),
        '02-analysis-output.html': ('Instant AI Analysis', 'TradingView Side Panel Integration'),
        '03-vision-ai.html': ('Vision AI Chart Analysis', 'Screenshot → GPT-4o / Claude'),
    }
    title, sub = titles.get(name, ('TradePrompt AI', 'Smart Trading Prompts'))

    try:
        font_lg = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 48)
        font_sm = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 24)
    except Exception:
        font_lg = ImageFont.load_default()
        font_sm = font_lg

    draw.text((60, 80), '⚡ TradePrompt AI', fill=(99, 102, 241), font=font_sm)
    draw.text((60, 130), title, fill=(241, 245, 249), font=font_lg)
    draw.text((60, 200), sub, fill=(148, 163, 184), font=font_sm)

    draw.rounded_rectangle([60, 280, width - 60, height - 80], radius=16, fill=(30, 41, 59), outline=(99, 102, 241))

    features = [
        '✓  10+ market-specific prompt templates',
        '✓  3-day free trial — ₹100/month',
        '✓  India-first: NSE/BSE/F&O support',
        '✓  Vision AI with GPT-4o & Claude',
    ]
    y = 320
    for feat in features:
        draw.text((100, y), feat, fill=(226, 232, 240), font=font_sm)
        y += 50

    draw.text((width - 280, height - 40), 'tradeprompt.ai', fill=(71, 85, 105), font=font_sm)
    img.save(output_path)
    return True

def generate_promo_tile(output_path, width, height, title, subtitle):
    img = Image.new('RGB', (width, height), (15, 23, 42))
    draw = ImageDraw.Draw(img)

    for x in range(width):
        for y in range(height):
            t = (x + y) / (width + height)
            r = int(99 * t + 15 * (1 - t))
            g = int(102 * t + 23 * (1 - t))
            b = int(241 * t + 42 * (1 - t))
            if x % 4 == 0 and y % 4 == 0:
                draw.point((x, y), fill=(r, g, b))

    try:
        font_xl = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 64 if width > 600 else 36)
        font_md = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 28 if width > 600 else 18)
    except Exception:
        font_xl = ImageFont.load_default()
        font_md = font_xl

    draw.text((width // 2 - 20, height // 3 - 40), '⚡', fill=(255, 255, 255), font=font_xl)
    bbox = draw.textbbox((0, 0), title, font=font_xl)
    tw = bbox[2] - bbox[0]
    draw.text(((width - tw) // 2, height // 3 + 20), title, fill=(255, 255, 255), font=font_xl)
    bbox2 = draw.textbbox((0, 0), subtitle, font=font_md)
    sw = bbox2[2] - bbox2[0]
    draw.text(((width - sw) // 2, height // 3 + 100), subtitle, fill=(148, 163, 184), font=font_md)

    img.save(output_path)
    print(f'  Created promo: {output_path}')

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print('Generating Chrome Web Store assets...\n')

    for template, output in TEMPLATES:
        html_path = os.path.join(SCREENSHOTS_DIR, template)
        out_path = os.path.join(OUTPUT_DIR, output)
        if os.path.exists(html_path):
            ok = render_html_to_image(html_path, out_path)
            status = '✓' if ok else '✗'
            print(f'  {status} {output}')
        else:
            print(f'  ✗ Missing template: {template}')

    generate_promo_tile(
        os.path.join(OUTPUT_DIR, 'promo-small-440x280.png'), 440, 280,
        'TradePrompt AI', 'AI Trading Prompts · ₹100/mo'
    )
    generate_promo_tile(
        os.path.join(OUTPUT_DIR, 'promo-marquee-1400x560.png'), 1400, 560,
        'TradePrompt AI', '1-Click AI Analysis for NSE/BSE, Forex & Crypto'
    )

    print(f'\n✓ Assets saved to: {OUTPUT_DIR}')
    print('  Upload screenshots to Chrome Web Store (1280x800 recommended)')

if __name__ == '__main__':
    main()

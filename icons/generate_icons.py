#!/usr/bin/env python3
"""
Simple script to generate extension icons using PIL/Pillow
Requires: pip install pillow
"""

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Error: Pillow is not installed")
    print("Install with: pip install pillow")
    exit(1)

def create_icon(size, filename):
    """Create a calendar icon with the specified size"""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (66, 133, 244, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw a simple calendar representation
    margin = size // 8
    
    # White rounded rectangle (calendar body)
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=size // 10,
        fill=(255, 255, 255, 255)
    )
    
    # Calendar header (blue bar)
    header_height = size // 4
    draw.rounded_rectangle(
        [margin, margin, size - margin, margin + header_height],
        radius=size // 10,
        fill=(66, 133, 244, 255)
    )
    
    # Draw date number if icon is large enough
    if size >= 48:
        # Try to use a font, fall back to default if not available
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", size // 3)
        except:
            font = ImageFont.load_default()
        
        text = "16"
        
        # Calculate text position (centered)
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        text_x = (size - text_width) // 2
        text_y = margin + header_height + (size - margin - header_height - text_height) // 2
        
        draw.text((text_x, text_y), text, fill=(66, 133, 244, 255), font=font)
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

if __name__ == '__main__':
    create_icon(16, 'icon16.png')
    create_icon(48, 'icon48.png')
    create_icon(128, 'icon128.png')
    print("\nIcons created successfully!")
    print("Note: These are simple generated icons. For production, consider using professionally designed icons.")

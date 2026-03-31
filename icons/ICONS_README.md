# Icon Generation Instructions

The extension requires three icon sizes: 16x16, 48x48, and 128x128 pixels.

## Quick Option: Use an Online Icon Generator

1. Visit [favicon.io](https://favicon.io/) or similar service
2. Choose a calendar emoji (📅) or text-based icon
3. Download and rename files to:
   - `icon16.png` (16x16)
   - `icon48.png` (48x48)
   - `icon128.png` (128x128)
4. Place in the `icons/` folder

## Option 2: Use Python to Generate Simple Icons

If you have Python with PIL/Pillow installed, run:

```bash
cd icons
python3 generate_icons.py
```

(The generate_icons.py script is included below)

## Option 3: Use Placeholder Icons

For development/testing, you can use any PNG images:
1. Find three PNG files (or duplicate one)
2. Resize to 16x16, 48x48, 128x128
3. Name them appropriately and place in icons folder

## Temporary Solution

If you need to test immediately without icons, create 1x1 pixel transparent PNGs:

```bash
cd icons
# Create tiny placeholder icons (works for testing)
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > icon16.png
cp icon16.png icon48.png
cp icon16.png icon128.png
```

The extension will load, but icons will be nearly invisible. Replace with proper icons when ready.

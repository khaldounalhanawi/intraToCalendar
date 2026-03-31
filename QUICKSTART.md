# IntraToCalendar - Quick Start Guide

## Immediate Next Steps

### 1. Create Proper Icons (2 minutes)

The extension currently has placeholder icons. To create proper ones:

**Option A: Use Python Script (Recommended)**
```bash
cd icons
pip install pillow  # If not installed
python3 generate_icons.py
```

**Option B: Use Online Generator**
- Visit [favicon.io](https://favicon.io/) or [realfavicongenerator.net](https://realfavicongenerator.net/)
- Use the 📅 emoji or custom design
- Download 16x16, 48x48, and 128x128 PNG files
- Save as icon16.png, icon48.png, icon128.png in the icons/ folder

### 2. Set Up Google OAuth2 (15 minutes)

**Critical Step**: The extension needs a Google OAuth2 Client ID to save to Calendar.

Follow the detailed guide in [OAUTH_SETUP.md](OAUTH_SETUP.md):

**Quick version:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create project → Enable Calendar API → Create OAuth2 credentials
3. Copy the Client ID
4. Open `manifest.json` and replace:
   ```json
   "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com"
   ```
   with your actual Client ID

### 3. Load Extension in Chrome (1 minute)

```bash
# 1. Open Chrome and go to:
chrome://extensions/

# 2. Enable "Developer mode" (toggle top-right)

# 3. Click "Load unpacked"

# 4. Select this folder:
/Users/khaldouna/Documents/projects/intraToCalendar/intraToCalendar

# 5. The extension should now appear in your toolbar
```

### 4. Test the Extension (2 minutes)

1. **Visit a test page** with dates (example below)
2. **Click the extension icon**
3. **Verify dates are detected**
4. **Select a date**
5. **Try "Download as .ics"** (works without OAuth)
6. **Try "Save to Google Calendar"** (requires OAuth setup)

## Test Page

Create this HTML file to test locally:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Date Extraction Test</title>
</head>
<body>
  <h1>Event Schedule</h1>
  <p class="text-center text-white text-xs">Thursday, April 16, 2026 at 04:00 PM</p>
  <p>Join us for the annual conference on April 20, 2026 at 9:00 AM</p>
  <p>Deadline: May 1, 2026, 5 PM</p>
  <div id="dynamic-content"></div>
  
  <script>
    // Test dynamic content
    setTimeout(() => {
      document.getElementById('dynamic-content').innerHTML = 
        '<p>Workshop: June 15, 2026 at 2:00 PM</p>';
    }, 2000);
  </script>
</body>
</html>
```

Save as `test.html` and open in Chrome, then test the extension.

## Feature Checklist

### Works Without OAuth Setup
- ✅ Date extraction from pages
- ✅ Multiple format support
- ✅ User selection interface
- ✅ .ics file download
- ✅ Dynamic content detection

### Requires OAuth Setup
- ⚠️ Save to Google Calendar (needs Client ID)
- ⚠️ Google authentication flow

## Troubleshooting

### "Extension failed to load"
- **Cause**: Missing icon files or invalid manifest
- **Fix**: Check icons/ folder has all 3 PNG files

### "YOUR_CLIENT_ID" in manifest
- **Cause**: OAuth not configured
- **Fix**: Follow OAUTH_SETUP.md to get real Client ID

### No dates detected
- **Cause**: Page format not supported or dates hidden
- **Fix**: Check console logs, try "Rescan page"

### Authentication fails
- **Cause**: OAuth2 not configured correctly
- **Fix**: Verify Client ID, check API is enabled, ensure extension ID matches

## Quick Commands

```bash
# Check if icons exist
ls -lh icons/*.png

# Generate icons with Python
cd icons && python3 generate_icons.py

# View extension folder
open /Users/khaldouna/Documents/projects/intraToCalendar/intraToCalendar

# Open Chrome extensions page (paste in address bar)
# chrome://extensions/
```

## Security Notes

- OAuth2 tokens are managed by Chrome (secure)
- No third-party servers involved
- All code is local and auditable
- Minimal permissions requested
- Google Calendar API uses HTTPS only

## Project Structure

```
intraToCalendar/
├── manifest.json          ← Configure OAuth Client ID here
├── content.js             ← Page scanning logic
├── date-utils.js          ← Date parsing
├── popup.html/js          ← User interface
├── calendar-utils.js      ← Google Calendar API
├── ics-utils.js           ← .ics file export
├── background.js          ← OAuth & API handler
├── styles.css             ← All styling
├── icons/                 ← Create icons here
├── README.md              ← User documentation
├── PROJECT.md             ← Technical documentation
├── OAUTH_SETUP.md         ← OAuth setup guide
├── DEVELOPMENT_NOTES.md   ← Session notes
└── QUICKSTART.md          ← This file
```

## Next Session Reminders

When returning to this project:
1. Review DEVELOPMENT_NOTES.md for what was built
2. Check if OAuth2 is configured (manifest.json)
3. Verify icons are created
4. Test on real websites
5. Check for any Chrome API updates

## Extension Loading Workflow

```
1. Update manifest.json (Client ID) → 
2. Create icons → 
3. Load in chrome://extensions/ → 
4. Get Extension ID → 
5. Update OAuth2 with Extension ID → 
6. Reload extension → 
7. Test authentication → 
8. Test on web pages
```

## Support & Resources

- **Project Docs**: See PROJECT.md for full technical details
- **Setup Help**: See OAUTH_SETUP.md for step-by-step
- **User Guide**: See README.md for end-user instructions
- **Chrome Docs**: [developer.chrome.com/docs/extensions](https://developer.chrome.com/docs/extensions/)
- **Calendar API**: [developers.google.com/calendar](https://developers.google.com/calendar)

---

**Ready to use after**: OAuth2 setup (15 min) + Icon creation (2 min)

**Works immediately**: .ics file download feature (no OAuth needed)

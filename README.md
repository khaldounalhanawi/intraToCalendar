# IntraToCalendar Chrome Extension

Extract dates from web pages and save them to Google Calendar or download as .ics files.

## Features

- 📅 **Smart Date Detection** - Automatically finds dates in multiple formats
- 🎯 **User Selection** - Choose which dates to save when multiple are found
- 📆 **Google Calendar Integration** - Direct save to your calendar
- ⬇️ **ICS Export** - Download as standard calendar file
- 🔄 **Dynamic Content Support** - Works with React, Vue, and other dynamic pages
- 🔐 **Secure OAuth2** - Safe authentication with Google
- 🎨 **Clean Interface** - Simple, intuitive popup design

## Installation

### From Source

1. **Clone or download** this repository

2. **Set up Google OAuth2** (required for Calendar integration):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a project and enable Google Calendar API
   - Create OAuth2 credentials (Chrome App type)
   - Copy the Client ID

3. **Update manifest.json**:
   ```json
   "oauth2": {
     "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
     "scopes": ["https://www.googleapis.com/auth/calendar.events"]
   }
   ```

4. **Create extension icons** (or use placeholders):
   - Create an `icons/` folder
   - Add `icon16.png`, `icon48.png`, `icon128.png`

5. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension folder

## Usage

1. **Navigate** to any web page with dates
2. **Click** the extension icon in the toolbar
3. **Review** the automatically detected dates
4. **Select** the dates you want to save
5. **Choose** to save to Google Calendar or download as .ics

### Google Calendar Option
- First time: Click "Authorize Google Calendar" 
- Select dates and click "Save to Google Calendar"
- Events appear in your primary calendar

### ICS File Option
- No authentication required
- Select dates and click "Download as .ics"
- Import the file into any calendar application

## Privacy & Security

**Privacy-First Design:**
- ✅ **On-Demand Only**: Extension only scans pages when you click the icon
- ✅ **No Background Activity**: No persistent access to your browsing
- ✅ **Minimal Permissions**: Only accesses current tab when activated
- ✅ **Local Processing**: All date extraction happens in your browser
- ✅ **No Data Collection**: We don't collect, store, or transmit your data
- ✅ **Secure OAuth**: Tokens managed by Chrome's Identity API
- ✅ **No Third Parties**: Direct API calls to Google Calendar only
- ✅ **HTTPS Only**: All communications encrypted

## Supported Date Formats

- `Thursday, April 16, 2026 at 04:00 PM`
- `Apr 16, 2026, 4 PM`
- `16 April 2026 16:00`
- `2026-04-16 16:00`
- `04/16/2026 4:00 PM`
- And more...

## Troubleshooting

**No dates found?**
- Ensure the page has loaded completely
- Try clicking "Rescan page"
- Dates may be in an unsupported format

**Authentication issues?**
- Verify OAuth2 setup is correct
- Check Google Calendar API is enabled
- Try removing cached credentials

**Extension not loading?**
- Check all files are present
- Verify manifest.json syntax
- Check browser console for errors

## Development

See [PROJECT.md](PROJECT.md) for detailed technical documentation, architecture decisions, and development notes.

## Requirements

- Chrome/Chromium browser (version 88+)
- Google account (for Calendar integration)
- Internet connection (for Calendar API)

## License

MIT License

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

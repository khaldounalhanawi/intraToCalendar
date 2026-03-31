# IntraToCalendar - Chrome Extension

## Project Overview
IntraToCalendar is a Chrome extension that automatically extracts date and time information from web pages and allows users to save them directly to Google Calendar or download as .ics files.

## Architecture & Design Decisions

### Component Structure (Separation of Concerns)
The extension follows a modular architecture with clear separation:

1. **content.js** - Content script that runs on web pages
   - Scans DOM for date patterns
   - Handles dynamic content with MutationObserver
   - Communicates extracted dates to popup

2. **date-utils.js** - Date parsing and validation utilities
   - Multiple date format support
   - Regex patterns for common date formats
   - Validation and filtering logic

3. **popup.js** - Popup UI controller
   - User interaction handling
   - Date selection management
   - State management for different views

4. **popup.html** - Popup interface
   - Date list display
   - Action buttons
   - Multiple UI states

5. **calendar-utils.js** - Google Calendar integration
   - OAuth2 token management
   - Calendar event creation via API
   - Event title generation logic

6. **ics-utils.js** - ICS file generation
   - Creates RFC 5545 compliant .ics files
   - Alternative to Google Calendar integration

7. **background.js** - Service worker
   - Manages OAuth2 authentication
   - Handles Calendar API requests
   - Token caching and renewal

8. **styles.css** - Centralized styling
   - CSS variables for theming
   - Consistent visual design
   - Responsive layout

## Features Implemented

### Core Features
- ✅ **Multi-format date extraction** - Supports 6+ common date formats
- ✅ **Smart filtering** - Ignores prices, IDs, and irrelevant numbers
- ✅ **Context-aware** - Shows surrounding text for each date
- ✅ **User selection** - Checkbox interface for choosing dates
- ✅ **Google Calendar integration** - Direct save with OAuth2
- ✅ **ICS export** - Download as standard calendar file
- ✅ **Dynamic content support** - MutationObserver tracks DOM changes

### Security Features
- ✅ **OAuth2 authentication** - Secure Google Calendar authorization
- ✅ **Limited permissions** - Only requests necessary permissions
- ✅ **Token management** - Secure token storage and expiry handling
- ✅ **Privacy-first** - No data sent to third parties
- ✅ **HTTPS only** - API calls over secure connections

### Edge Cases Handled
- ✅ **No dates found** - Shows helpful empty state
- ✅ **Too many matches** - Limits to top 20, sorted by relevance
- ✅ **Duplicate dates** - Deduplicates entries within 1 minute
- ✅ **Dynamic pages** - Re-scans when DOM changes (React, etc.)
- ✅ **Past vs future dates** - Prioritizes future dates
- ✅ **Hidden elements** - Ignores invisible content
- ✅ **Script/style tags** - Skips non-visible content

## Date Format Support

The extension recognizes these formats:
1. `Thursday, April 16, 2026 at 04:00 PM` (Priority: 10)
2. `Apr 16, 2026, 4 PM` (Priority: 9)
3. `16 April 2026 16:00` (Priority: 9)
4. `2026-04-16 16:00` (Priority: 8)
5. `04/16/2026 4:00 PM` (Priority: 7)
6. `Thursday, April 16, 2026` (Priority: 6)

Higher priority formats are shown first in results.

## Setup Instructions

### 1. Google Cloud Console Setup (Required for Calendar Integration)

To enable Google Calendar integration, you need to set up OAuth2 credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google Calendar API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

4. Create OAuth2 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Chrome App" as application type
   - Application ID: Get your extension ID (see below)
   - Add authorized scopes: `https://www.googleapis.com/auth/calendar.events`

5. Copy the Client ID and update `manifest.json`:
   ```json
   "oauth2": {
     "client_id": "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
     "scopes": ["https://www.googleapis.com/auth/calendar.events"]
   }
   ```

### 2. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the extension directory
5. Note the Extension ID shown (needed for OAuth2 setup)
6. Pin the extension to toolbar for easy access

### 3. First Use

1. Navigate to any web page with dates
2. Click the extension icon
3. The extension will scan for dates automatically
4. Select the dates you want to save
5. Choose to save to Google Calendar (requires auth) or download .ics

## Usage Guide

### Extracting Dates
1. Visit a page with date/time information
2. Open the extension popup
3. Dates are automatically extracted and displayed
4. If content updates dynamically, dates are re-scanned

### Saving to Google Calendar
1. Select dates using checkboxes
2. Click "Save to Google Calendar"
3. Authorize on first use (one-time setup)
4. Events are created in your primary calendar

### Downloading .ics Files
1. Select dates using checkboxes
2. Click "Download as .ics"
3. File downloads immediately (no auth needed)
4. Import into any calendar app (Outlook, Apple Calendar, etc.)

## Technical Details

### MutationObserver
Monitors DOM changes to handle:
- Single Page Applications (React, Vue, Angular)
- AJAX-loaded content
- Dynamically updated schedules
- Debounced to avoid excessive scanning (500ms delay)

### OAuth2 Security
- Uses Chrome Identity API (secure, sandboxed)
- Tokens cached with expiry (55 min)
- Silent refresh when possible
- User prompted only when necessary
- Tokens never exposed to web pages
- No third-party servers involved

### API Rate Limiting
- Sequential event creation (not parallel)
- Prevents API quota issues
- Error handling for each event
- Reports success/failure counts

## File Structure
```
intraToCalendar/
├── manifest.json           # Extension configuration
├── content.js              # Page scanning logic
├── popup.html              # Popup interface
├── popup.js                # Popup controller
├── background.js           # Service worker
├── date-utils.js           # Date parsing utilities
├── calendar-utils.js       # Google Calendar API
├── ics-utils.js            # ICS file generation
├── styles.css              # Centralized styles
├── icons/                  # Extension icons (create these)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── PROJECT.md              # This file
└── README.md               # User documentation
```

## Future Enhancements

### Potential Improvements
- [ ] Add date editing before saving
- [ ] Support for date ranges/multi-day events
- [ ] Custom event duration selection
- [ ] Multiple calendar selection
- [ ] Recurring event detection
- [ ] Location extraction from page
- [ ] Description/notes extraction
- [ ] Statistics/usage tracking
- [ ] Dark mode support
- [ ] Keyboard shortcuts
- [ ] Export preferences

### Advanced Date Parsing
- [ ] Integrate chrono-node or date-fns for better parsing
- [ ] Relative dates ("tomorrow", "next week")
- [ ] International date formats
- [ ] Timezone detection from page
- [ ] Duration extraction ("2-hour meeting")

### UI Enhancements
- [ ] Preview before saving
- [ ] Bulk edit capabilities
- [ ] Search/filter dates list
- [ ] Date grouping by day/week
- [ ] Customizable display format

## Known Limitations

1. **OAuth2 Setup Required** - Google Calendar integration requires developer setup
2. **Date Ambiguity** - Some formats may be ambiguous (e.g., 04/05/2026)
3. **Context Quality** - Context extraction depends on page structure
4. **Rate Limits** - Google Calendar API has quota limits
5. **Time Zones** - Uses browser timezone, may not match page content

## Troubleshooting

### Dates Not Found
- Page may use unconventional date formats
- Dates may be in hidden/dynamically loaded elements
- Try rescanning after page fully loads

### Authentication Fails
- Verify OAuth2 client ID in manifest.json
- Check Google Calendar API is enabled
- Ensure extension ID matches in Cloud Console
- Try removing and re-adding the extension

### Calendar Events Not Created
- Check Google account permissions
- Verify API quotas not exceeded
- Check browser console for errors
- Try .ics download as alternative

## Development Notes

### Code Quality
- Modular design with single-responsibility functions
- Comprehensive error handling
- Console logging for debugging
- JSDoc comments for all functions
- Consistent naming conventions

### Testing Checklist
- [ ] Test on static HTML pages
- [ ] Test on React/Vue/Angular apps
- [ ] Test with various date formats
- [ ] Test with no dates present
- [ ] Test with 100+ dates (limit verification)
- [ ] Test OAuth2 flow
- [ ] Test .ics download
- [ ] Test on different timezones
- [ ] Test MutationObserver behavior
- [ ] Test error scenarios

## Version History

### v1.0.0 (Initial Release)
- Date extraction with multiple format support
- Google Calendar integration with OAuth2
- .ics file export
- MutationObserver for dynamic content
- User selection interface
- Security best practices

## Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Google Calendar API](https://developers.google.com/calendar/api/v3/reference)
- [Chrome Identity API](https://developer.chrome.com/docs/extensions/reference/identity/)
- [RFC 5545 (iCalendar)](https://tools.ietf.org/html/rfc5545)

## License
MIT License (or specify your preferred license)

## Contact & Support
[Add your contact information or repository URL]

# Google OAuth2 Setup Guide

This guide walks you through setting up Google Calendar API access for the IntraToCalendar extension.

## Step-by-Step Instructions

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" at the top
3. Click "New Project"
4. Enter project name: `IntraToCalendar`
5. Click "Create"

### 2. Enable Google Calendar API

1. In your project, go to **APIs & Services** > **Library**
2. Search for `Google Calendar API`
3. Click on it
4. Click **Enable**

### 3. Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** (unless using Google Workspace)
3. Click **Create**
4. Fill in required fields:
   - **App name**: IntraToCalendar
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **Save and Continue**
6. On Scopes page, click **Add or Remove Scopes**
7. Add `https://www.googleapis.com/auth/calendar.events`
8. Click **Update** and **Save and Continue**
9. Add test users if needed (your own email)
10. Click **Save and Continue**

### 4. Create OAuth2 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Chrome Extension** (or Chrome App if not available)
4. Name it: `IntraToCalendar Extension`

#### Getting Your Extension ID

You need your extension ID before completing this step:

1. Load the extension in Chrome (`chrome://extensions/`)
2. Enable **Developer mode**
3. Click **Load unpacked** and select the extension folder
4. Copy the **Extension ID** shown (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

#### Complete Credential Creation

5. Paste your Extension ID in the **Application ID** field
6. Click **Create**
7. Copy the **Client ID** (format: `xxxxx.apps.googleusercontent.com`)

### 5. Update Extension Manifest

1. Open `manifest.json` in the extension folder
2. Replace `YOUR_CLIENT_ID` with your actual Client ID:
   ```json
   "oauth2": {
     "client_id": "123456789-abc123def456.apps.googleusercontent.com",
     "scopes": [
       "https://www.googleapis.com/auth/calendar.events"
     ]
   }
   ```
3. Save the file
4. Reload the extension in Chrome

### 6. Test Authentication

1. Click the extension icon
2. Scan a page with dates
3. Select a date
4. Click "Save to Google Calendar"
5. Click "Authorize Google Calendar" when prompted
6. Sign in with your Google account
7. Grant permissions

## Security Considerations

### What Permissions Are Requested?

- **calendar.events** - Create events in your calendar
- **activeTab** - Read content from current tab only
- **storage** - Store preferences locally
- **identity** - Handle OAuth2 authentication

### Data Privacy

- ✅ No data leaves your browser except for Google Calendar API
- ✅ OAuth2 tokens managed securely by Chrome
- ✅ No tracking or analytics
- ✅ Source code is visible and auditable
- ✅ No third-party servers

### Security Best Practices

1. **Keep Client ID Private** - Don't share your OAuth2 credentials
2. **Use Environment-Specific IDs** - Different IDs for dev/prod
3. **Monitor API Usage** - Check quota usage in Cloud Console
4. **Revoke Access** - Users can revoke access at [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
5. **Update Scopes Minimally** - Only request necessary permissions

## Troubleshooting OAuth Issues

### "Redirect URI mismatch" error
- Verify extension ID matches in Cloud Console
- Reload extension after changing manifest.json

### "Access blocked" error
- Complete OAuth consent screen configuration
- Add yourself as a test user
- Ensure Calendar API is enabled

### "Invalid client" error
- Check Client ID format in manifest.json
- Ensure no extra spaces or typos
- Verify project is active in Cloud Console

### Token expires quickly
- Normal behavior (tokens expire in ~1 hour)
- Extension automatically refreshes tokens
- Re-authenticate if issues persist

## API Quotas

Google Calendar API free tier limits:
- **10,000 queries per day**
- **500 queries per 100 seconds**

This is sufficient for typical extension usage. Each event creation = 1 query.

## Publishing Considerations

If you plan to publish this extension:

1. **Verify your domain** in Google Cloud Console
2. **Complete OAuth consent review** (for public use)
3. **Update to production status** (vs testing)
4. **Provide privacy policy URL**
5. **Follow Chrome Web Store requirements**

## Alternative: No Google Setup

If you don't want to set up Google OAuth:
- Use the **.ics download feature** instead
- No configuration needed
- Works immediately after installation
- Import .ics files into any calendar app

## Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [Chrome Identity API](https://developer.chrome.com/docs/extensions/reference/identity/)
- [OAuth2 for Chrome Extensions](https://developer.chrome.com/docs/extensions/mv3/tut_oauth/)
- [Google Cloud Console](https://console.cloud.google.com/)

## Support

For issues related to:
- **Extension functionality** - Check PROJECT.md
- **OAuth setup** - Review this guide
- **Google API errors** - Check Cloud Console logs

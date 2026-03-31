/**
 * Background Service Worker
 * Handles Google Calendar OAuth and API requests
 */

class BackgroundService {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
  }

  /**
   * Initialize the background service
   */
  init() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender).then(sendResponse);
      return true; // Keep channel open for async response
    });

    console.log('IntraToCalendar: Background service initialized');
  }

  /**
   * Handle messages from popup and content scripts
   * @param {Object} request - Message request
   * @param {Object} sender - Message sender
   * @returns {Promise<Object>} Response object
   */
  async handleMessage(request, sender) {
    try {
      switch (request.action) {
        case 'checkAuth':
          return await this.checkAuthentication();
        
        case 'authenticate':
          return await this.authenticate();
        
        case 'saveToCalendar':
          return await this.saveToCalendar(request.dates);
        
        default:
          return { success: false, error: 'Unknown action' };
      }
    } catch (error) {
      console.error('Background service error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<Object>} Authentication status
   */
  async checkAuthentication() {
    try {
      // Check if we have a valid cached token
      if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return { authenticated: true };
      }

      // Try to get token silently
      const token = await this.getAuthToken(true);
      if (token) {
        return { authenticated: true };
      }

      return { authenticated: false };
    } catch (error) {
      console.error('Auth check error:', error);
      return { authenticated: false };
    }
  }

  /**
   * Authenticate with Google
   * @returns {Promise<Object>} Authentication result
   */
  async authenticate() {
    try {
      const token = await this.getAuthToken(false);
      if (token) {
        return { success: true };
      }
      return { success: false, error: 'Failed to obtain token' };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get OAuth2 token from Chrome Identity API
   * @param {boolean} interactive - Whether to show interactive login
   * @returns {Promise<string|null>} Access token or null
   */
  async getAuthToken(interactive) {
    try {
      const token = await chrome.identity.getAuthToken({ interactive });
      
      if (token) {
        this.token = token;
        // Tokens typically expire in 1 hour
        this.tokenExpiry = Date.now() + 55 * 60 * 1000; // 55 minutes
        return token;
      }
      
      return null;
    } catch (error) {
      if (!interactive && error.message.includes('OAuth2')) {
        // Expected when trying silent auth without prior authorization
        return null;
      }
      throw error;
    }
  }

  /**
   * Save dates to Google Calendar
   * @param {Array} dates - Array of date objects
   * @returns {Promise<Object>} Save result
   */
  async saveToCalendar(dates) {
    try {
      // Get valid token
      const token = await this.getAuthToken(false);
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      // Create events
      let successCount = 0;
      let failCount = 0;
      const errors = [];

      for (const dateObj of dates) {
        try {
          await this.createCalendarEvent(token, dateObj);
          successCount++;
        } catch (error) {
          failCount++;
          errors.push({
            date: dateObj.formattedDate,
            error: error.message
          });
        }
      }

      if (successCount > 0) {
        return {
          success: true,
          count: successCount,
          failed: failCount,
          errors: errors
        };
      } else {
        return {
          success: false,
          error: errors.length > 0 ? errors[0].error : 'All events failed to save'
        };
      }
    } catch (error) {
      console.error('Save to calendar error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a single calendar event via Google Calendar API
   * @param {string} token - OAuth2 access token
   * @param {Object} dateObj - Date object
   * @returns {Promise<Object>} API response
   */
  async createCalendarEvent(token, dateObj) {
    const eventDate = new Date(dateObj.date);
    const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000);

    const event = {
      summary: this.generateEventTitle(dateObj),
      description: `Source: ${dateObj.context || dateObj.originalText}\n\nExtracted by IntraToCalendar extension`,
      start: {
        dateTime: eventDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      reminders: {
        useDefault: true
      }
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create event');
    }

    return await response.json();
  }

  /**
   * Generate event title from context
   * @param {Object} dateObj - Date object
   * @returns {string} Event title
   */
  generateEventTitle(dateObj) {
    const context = dateObj.context || '';
    
    // Look for event-like patterns
    const eventMatch = context.match(/\b(?:meeting|event|class|lecture|appointment|deadline|due|exam|presentation|interview|conference|workshop|seminar|webinar)[^.!?]*/i);
    
    if (eventMatch) {
      let title = eventMatch[0].trim();
      // Remove the date itself if it appears in the title
      title = title.replace(dateObj.originalText, '').trim();
      return title.length > 100 ? title.substring(0, 100) + '...' : title;
    }

    // Fall back to formatted date
    return `Event - ${dateObj.formattedDate}`;
  }

  /**
   * Revoke authentication token
   * @returns {Promise<void>}
   */
  async revokeToken() {
    if (this.token) {
      await chrome.identity.removeCachedAuthToken({ token: this.token });
      this.token = null;
      this.tokenExpiry = null;
    }
  }
}

// Initialize background service
const backgroundService = new BackgroundService();
backgroundService.init();

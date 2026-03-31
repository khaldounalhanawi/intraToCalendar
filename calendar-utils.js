/**
 * Google Calendar Integration Utilities
 * Handles OAuth2 authentication and calendar event creation
 */

const CalendarUtils = {
  /**
   * Create a calendar event from a date object
   * @param {string} token - OAuth2 access token
   * @param {Object} dateObj - Date object with event details
   * @returns {Promise<Object>} API response
   */
  async createEvent(token, dateObj) {
    const eventDate = new Date(dateObj.date);
    
    // Default 1-hour duration
    const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000);

    const event = {
      summary: this.generateEventTitle(dateObj),
      description: `Extracted from web page: ${dateObj.context || dateObj.originalText}`,
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
      throw new Error(error.error?.message || 'Failed to create calendar event');
    }

    return await response.json();
  },

  /**
   * Generate a title for the calendar event
   * @param {Object} dateObj - Date object
   * @returns {string} Event title
   */
  generateEventTitle(dateObj) {
    // Try to extract meaningful title from context
    const context = dateObj.context || '';
    
    // Look for event-like words
    const eventWords = context.match(/\b(?:meeting|event|class|lecture|appointment|deadline|due|exam|presentation|interview|conference|workshop|seminar|webinar)\b/i);
    
    if (eventWords) {
      // Try to get a few words around the event word
      const words = context.split(/\s+/);
      const eventIndex = words.findIndex(w => /meeting|event|class|lecture|appointment|deadline|due|exam|presentation|interview|conference|workshop|seminar|webinar/i.test(w));
      
      if (eventIndex !== -1) {
        const start = Math.max(0, eventIndex - 2);
        const end = Math.min(words.length, eventIndex + 3);
        const title = words.slice(start, end).join(' ');
        return title.length > 50 ? title.substring(0, 50) + '...' : title;
      }
    }

    // Default to date-based title
    const date = new Date(dateObj.date);
    return `Event on ${date.toLocaleDateString()}`;
  },

  /**
   * Batch create multiple events
   * @param {string} token - OAuth2 access token
   * @param {Array} dates - Array of date objects
   * @returns {Promise<Object>} Results summary
   */
  async createMultipleEvents(token, dates) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const dateObj of dates) {
      try {
        await this.createEvent(token, dateObj);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          date: dateObj.formattedDate,
          error: error.message
        });
      }
    }

    return results;
  }
};

// Make available globally
window.CalendarUtils = CalendarUtils;

/**
 * ICS File Generation Utilities
 * Creates .ics files for calendar import
 */

const ICSUtils = {
  /**
   * Create an .ics file from date objects
   * @param {Array} dates - Array of date objects
   * @returns {string} ICS file content
   */
  createICSFile(dates) {
    const events = dates.map(dateObj => this.createICSEvent(dateObj)).join('\n');
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//IntraToCalendar//Chrome Extension//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Extracted Events
X-WR-TIMEZONE:${Intl.DateTimeFormat().resolvedOptions().timeZone}
${events}
END:VCALENDAR`;
  },

  /**
   * Create a single VEVENT component
   * @param {Object} dateObj - Date object
   * @returns {string} VEVENT string
   */
  createICSEvent(dateObj) {
    const eventDate = new Date(dateObj.date);
    const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000); // 1 hour duration

    const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@intratocalendar`;
    const dtstamp = this.formatICSDate(new Date());
    const dtstart = this.formatICSDate(eventDate);
    const dtend = this.formatICSDate(endDate);
    
    const summary = this.escapeICSText(this.generateEventTitle(dateObj));
    const description = this.escapeICSText(dateObj.context || dateObj.originalText);

    return `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${summary}
DESCRIPTION:${description}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT`;
  },

  /**
   * Format a date for ICS format (YYYYMMDDTHHMMSSZ)
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   */
  formatICSDate(date) {
    const pad = (n) => String(n).padStart(2, '0');
    
    return date.getUTCFullYear() +
           pad(date.getUTCMonth() + 1) +
           pad(date.getUTCDate()) +
           'T' +
           pad(date.getUTCHours()) +
           pad(date.getUTCMinutes()) +
           pad(date.getUTCSeconds()) +
           'Z';
  },

  /**
   * Escape special characters for ICS format
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeICSText(text) {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .substring(0, 200); // Limit length
  },

  /**
   * Generate event title from date object
   * @param {Object} dateObj - Date object
   * @returns {string} Event title
   */
  generateEventTitle(dateObj) {
    const context = dateObj.context || '';
    
    // Extract meaningful title from context
    const eventWords = context.match(/\b(?:meeting|event|class|lecture|appointment|deadline|due|exam|presentation|interview|conference|workshop|seminar|webinar)[^.!?]*/i);
    
    if (eventWords) {
      const title = eventWords[0].trim();
      return title.length > 50 ? title.substring(0, 50) + '...' : title;
    }

    // Default title
    const date = new Date(dateObj.date);
    return `Event on ${date.toLocaleDateString()}`;
  }
};

// Make available globally
window.ICSUtils = ICSUtils;

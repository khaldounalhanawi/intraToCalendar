/**
 * Date Utilities Module
 * Handles date parsing, validation, and format detection
 */

const DateUtils = {
  /**
   * Common date format patterns with regex and parsing functions
   */
  datePatterns: [
    {
      // Format: "Thursday, April 16, 2026 at 04:00 PM"
      regex: /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\s+(?:at\s+)?\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)\b/gi,
      priority: 10
    },
    {
      // Format: "Apr 16, 2026, 4 PM" or "April 16, 2026 4:00 PM"
      regex: /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4},?\s+\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\b/gi,
      priority: 9
    },
    {
      // Format: "16 April 2026 16:00" or "16 Apr 2026 4:00 PM"
      regex: /\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\s+\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?\b/gi,
      priority: 9
    },
    {
      // Format: "2026-04-16 16:00" or "2026/04/16 4:00 PM"
      regex: /\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?\b/gi,
      priority: 8
    },
    {
      // Format: "04/16/2026 4:00 PM" or "04-16-2026 16:00"
      regex: /\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\s+\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?\b/gi,
      priority: 7
    },
    {
      // Format: Date without time but with day name: "Thursday, April 16, 2026"
      regex: /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
      priority: 6
    }
  ],

  /**
   * Extract all potential dates from text content
   * @param {string} text - Text to search for dates
   * @returns {Array} Array of found date strings with metadata
   */
  extractDatesFromText(text) {
    const found = [];
    const seen = new Set();

    this.datePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern.regex);
      for (const match of matches) {
        const dateStr = match[0].trim();
        // Avoid duplicates
        if (!seen.has(dateStr)) {
          seen.add(dateStr);
          found.push({
            text: dateStr,
            priority: pattern.priority,
            index: match.index
          });
        }
      }
    });

    // Sort by priority (higher first), then by position in text
    return found.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.index - b.index;
    });
  },

  /**
   * Parse a date string into a Date object
   * @param {string} dateStr - Date string to parse
   * @returns {Date|null} Parsed date or null if invalid
   */
  parseDate(dateStr) {
    try {
      // Try native Date parsing first
      let date = new Date(dateStr);
      
      // If that fails, try manual parsing for specific formats
      if (isNaN(date.getTime())) {
        date = this.manualParse(dateStr);
      }

      // Validate the date is reasonable
      if (date && !isNaN(date.getTime())) {
        return date;
      }
    } catch (e) {
      console.error('Error parsing date:', dateStr, e);
    }
    return null;
  },

  /**
   * Manual parsing for dates that native parser can't handle
   * @param {string} dateStr - Date string to parse
   * @returns {Date|null} Parsed date or null
   */
  manualParse(dateStr) {
    const monthMap = {
      'jan': 0, 'january': 0,
      'feb': 1, 'february': 1,
      'mar': 2, 'march': 2,
      'apr': 3, 'april': 3,
      'may': 4,
      'jun': 5, 'june': 5,
      'jul': 6, 'july': 6,
      'aug': 7, 'august': 7,
      'sep': 8, 'sept': 8, 'september': 8,
      'oct': 9, 'october': 9,
      'nov': 10, 'november': 10,
      'dec': 11, 'december': 11
    };

    // Try format: "16 April 2026 16:00"
    let match = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM|am|pm))?/i);
    if (match) {
      const day = parseInt(match[1]);
      const month = monthMap[match[2].toLowerCase()];
      const year = parseInt(match[3]);
      let hour = parseInt(match[4]);
      const minute = parseInt(match[5]);
      const meridiem = match[6];

      if (meridiem) {
        const isPM = meridiem.toUpperCase() === 'PM';
        if (isPM && hour !== 12) hour += 12;
        if (!isPM && hour === 12) hour = 0;
      }

      if (month !== undefined) {
        return new Date(year, month, day, hour, minute);
      }
    }

    // Try format: "April 16, 2026 at 04:00 PM"
    match = dateStr.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})(?:\s+at\s+)?(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/i);
    if (match) {
      const month = monthMap[match[1].toLowerCase()];
      const day = parseInt(match[2]);
      const year = parseInt(match[3]);
      let hour = parseInt(match[4]);
      const minute = parseInt(match[5]);
      const meridiem = match[6];

      const isPM = meridiem.toUpperCase() === 'PM';
      if (isPM && hour !== 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;

      if (month !== undefined) {
        return new Date(year, month, day, hour, minute);
      }
    }

    return null;
  },

  /**
   * Check if a date is in the future or present
   * @param {Date} date - Date to check
   * @returns {boolean} True if date is not in the past
   */
  isValidFutureDate(date) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return date >= oneDayAgo;
  },

  /**
   * Format a date for display
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   */
  formatDate(date) {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleString('en-US', options);
  },

  /**
   * Check if text looks like a price or ID (to filter out)
   * @param {string} text - Text to check
   * @returns {boolean} True if looks like price/ID
   */
  isLikelyNotDate(text) {
    // Check for currency symbols or price patterns
    if (/\$|€|£|¥|USD|EUR|GBP|price|cost/i.test(text)) {
      return true;
    }
    // Check for ID patterns
    if (/\b(id|#|order|invoice|tracking)[\s:]*\d+/i.test(text)) {
      return true;
    }
    return false;
  }
};

// Make available to content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DateUtils;
}

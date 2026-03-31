/**
 * Content Script
 * Runs on web pages to extract dates and handle DOM changes
 */

class DateExtractor {
  constructor() {
    this.foundDates = [];
    this.observer = null;
    this.lastScan = 0;
    this.scanDebounceMs = 500;
  }

  /**
   * Initialize the date extractor
   */
  init() {
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'scanDates') {
        this.scanPage();
        sendResponse({ dates: this.foundDates });
      }
      return true;
    });

    // Set up MutationObserver for dynamic content
    this.setupDOMObserver();
  }

  /**
   * Scan the page for dates
   */
  scanPage() {
    this.foundDates = [];
    const candidates = [];

    // Strategy 1: Look for specific elements with date-like classes
    this.scanByClassNames(candidates);

    // Strategy 2: Scan all text content
    this.scanTextContent(candidates);

    // Process and deduplicate candidates
    this.processCandidates(candidates);

    console.log(`IntraToCalendar: Found ${this.foundDates.length} potential dates`);
    return this.foundDates;
  }

  /**
   * Scan elements with date-related class names
   * @param {Array} candidates - Array to store candidates
   */
  scanByClassNames(candidates) {
    const dateSelectors = [
      '[class*="date"]',
      '[class*="time"]',
      '[class*="event"]',
      '[class*="schedule"]',
      '[class*="calendar"]',
      'time',
      '[datetime]'
    ];

    dateSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.textContent.trim();
        const context = this.getElementContext(el);
        
        if (text && !DateUtils.isLikelyNotDate(context)) {
          candidates.push({
            text,
            element: el,
            context,
            source: 'class-based'
          });
        }

        // Check datetime attribute
        if (el.hasAttribute('datetime')) {
          const datetime = el.getAttribute('datetime');
          candidates.push({
            text: datetime,
            element: el,
            context,
            source: 'datetime-attribute'
          });
        }
      });
    });
  }

  /**
   * Scan all visible text content for dates
   * @param {Array} candidates - Array to store candidates
   */
  scanTextContent(candidates) {
    // Get all text nodes (excluding script, style, etc.)
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          const tagName = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          // Check if element is visible
          const style = window.getComputedStyle(parent);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    // Extract dates from text nodes
    textNodes.forEach(textNode => {
      const text = textNode.textContent.trim();
      if (text.length < 10) return; // Too short to contain a date

      const context = this.getElementContext(textNode.parentElement);
      if (DateUtils.isLikelyNotDate(context)) return;

      const dates = DateUtils.extractDatesFromText(text);
      dates.forEach(dateInfo => {
        candidates.push({
          text: dateInfo.text,
          element: textNode.parentElement,
          context,
          source: 'text-scan',
          priority: dateInfo.priority
        });
      });
    });
  }

  /**
   * Get surrounding context for an element
   * @param {Element} element - DOM element
   * @returns {string} Context text
   */
  getElementContext(element) {
    const contexts = [];
    
    // Get element's own text
    if (element.textContent) {
      contexts.push(element.textContent.substring(0, 200));
    }

    // Get nearby headings
    const nearbyHeading = element.closest('section, article, div')?.querySelector('h1, h2, h3, h4, h5, h6');
    if (nearbyHeading) {
      contexts.push(nearbyHeading.textContent.trim());
    }

    // Get aria-label or title
    if (element.hasAttribute('aria-label')) {
      contexts.push(element.getAttribute('aria-label'));
    }
    if (element.hasAttribute('title')) {
      contexts.push(element.getAttribute('title'));
    }

    return contexts.join(' | ').substring(0, 300);
  }

  /**
   * Extract event title by searching DOM for nearby headings
   * @param {Element} element - The date element
   * @param {string} context - Context text as fallback
   * @param {string} dateText - The date text to remove
   * @returns {string} Extracted title
   */
  extractTitle(element, context, dateText) {
    if (!element) return this.extractTitleFromContext(context, dateText);

    let title = '';

    // Strategy 1: Look for headings in the same container
    const container = element.closest('div, section, article, li, td, header, main');
    if (container) {
      // Find any heading element (h1-h6) in the container
      const heading = container.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) {
        title = heading.textContent.trim();
        if (title && title.length > 2 && title.length < 150) {
          return title;
        }
      }

      // Check siblings before the date element
      let sibling = element.previousElementSibling;
      let checks = 0;
      while (sibling && checks < 3) {
        if (/^H[1-6]$/.test(sibling.tagName)) {
          title = sibling.textContent.trim();
          if (title && title.length > 2 && title.length < 150) {
            return title;
          }
        }
        sibling = sibling.previousElementSibling;
        checks++;
      }
    }

    // Strategy 2: Look upward in DOM tree for nearby headings
    let parent = element.parentElement;
    let depth = 0;
    while (parent && depth < 5) {
      // Check for heading siblings
      const headings = Array.from(parent.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      for (const heading of headings) {
        const headingText = heading.textContent.trim();
        // Make sure the heading doesn't contain the date itself
        if (headingText && 
            headingText.length > 2 && 
            headingText.length < 150 &&
            !headingText.includes(dateText)) {
          return headingText;
        }
      }
      parent = parent.parentElement;
      depth++;
    }

    // Strategy 3: Check if element has aria-label or title
    if (element.hasAttribute('aria-label')) {
      title = element.getAttribute('aria-label').trim();
      if (title && title.length > 2 && !title.includes(dateText)) {
        return title;
      }
    }

    // Fallback to context-based extraction
    return this.extractTitleFromContext(context, dateText);
  }

  /**
   * Extract title from context string (fallback method)
   * @param {string} context - Context text
   * @param {string} dateText - The date text to remove
   * @returns {string} Extracted title
   */
  extractTitleFromContext(context, dateText) {
    if (!context) return 'Event';

    // Remove the date text itself
    let cleaned = context.replace(dateText, '').trim();

    // Split by separator and clean up
    const parts = cleaned.split('|').map(p => p.trim()).filter(p => p.length > 0);

    // Look for event-like patterns
    const eventKeywords = [
      'meeting', 'event', 'class', 'lecture', 'appointment', 'deadline',
      'due', 'exam', 'presentation', 'interview', 'conference', 'workshop',
      'seminar', 'webinar', 'session', 'training', 'call', 'demo', 'review',
      'club', 'practice', 'rehearsal', 'match', 'game', 'competition'
    ];

    for (const part of parts) {
      const lowerPart = part.toLowerCase();
      
      // Check if part contains event keywords
      const hasEventKeyword = eventKeywords.some(keyword => lowerPart.includes(keyword));
      
      if (hasEventKeyword && part.length > 3 && part.length < 150) {
        return part;
      }
    }

    // If no event keyword, use first meaningful part
    for (const part of parts) {
      // Check if it looks like a title (not just numbers or symbols)
      if (part.length > 3 && 
          part.length < 150 && 
          !part.match(/^[0-9\$£€¥#]+/) &&
          part.match(/[a-zA-Z]/)) {
        return part;
      }
    }

    return 'Event';
  }

  /**
   * Process and filter candidates
   * @param {Array} candidates - Raw candidates
   */
  processCandidates(candidates) {
    const MAX_DATES = 20;
    const parsedDates = [];

    candidates.forEach(candidate => {
      const date = DateUtils.parseDate(candidate.text);
      
      if (date && !isNaN(date.getTime())) {
        // Check for duplicates
        const isDuplicate = parsedDates.some(pd => 
          Math.abs(pd.date.getTime() - date.getTime()) < 60000 // Within 1 minute
        );

        if (!isDuplicate) {
          parsedDates.push({
            originalText: candidate.text,
            date: date,
            formattedDate: DateUtils.formatDate(date),
            context: candidate.context,
            source: candidate.source,
            isFuture: DateUtils.isValidFutureDate(date),
            priority: candidate.priority || 5,
            element: candidate.element
          });
        }
      }
    });

    // Filter and sort
    let filtered = parsedDates
      .filter(pd => pd.isFuture) // Prioritize future dates
      .sort((a, b) => {
        // Sort by priority first, then by date
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return a.date - b.date;
      });

    // If no future dates, include past dates too
    if (filtered.length === 0) {
      filtered = parsedDates.sort((a, b) => b.date - a.date);
    }

    // Limit results
    this.foundDates = filtered.slice(0, MAX_DATES).map((pd, index) => ({
      id: index,
      originalText: pd.originalText,
      date: pd.date.toISOString(),
      formattedDate: pd.formattedDate,
      context: pd.context,
      source: pd.source,
      isFuture: pd.isFuture,
      title: this.extractTitle(pd.element, pd.context, pd.originalText)
    }));
  }

  /**
   * Set up MutationObserver to detect dynamic content changes
   */
  setupDOMObserver() {
    this.observer = new MutationObserver((mutations) => {
      // Debounce the scan
      const now = Date.now();
      if (now - this.lastScan < this.scanDebounceMs) {
        return;
      }
      this.lastScan = now;

      // Check if mutations contain significant changes
      const hasSignificantChange = mutations.some(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          return true;
        }
        if (mutation.type === 'characterData') {
          return true;
        }
        return false;
      });

      if (hasSignificantChange) {
        console.log('IntraToCalendar: DOM changed, rescanning...');
        this.scanPage();
        
        // Notify popup if it's open
        chrome.runtime.sendMessage({
          action: 'datesUpdated',
          dates: this.foundDates
        }).catch(() => {
          // Popup might not be open, ignore error
        });
      }
    });

    // Start observing
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  /**
   * Disconnect the observer
   */
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const extractor = new DateExtractor();
    extractor.init();
  });
} else {
  const extractor = new DateExtractor();
  extractor.init();
}

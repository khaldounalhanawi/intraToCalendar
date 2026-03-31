/**
 * Popup Script
 * Handles user interaction in the extension popup
 */

class PopupController {
  constructor() {
    this.selectedDates = new Set();
    this.allDates = [];
    this.isAuthenticated = false;
  }

  /**
   * Initialize the popup
   */
  async init() {
    this.setupEventListeners();
    await this.checkAuthStatus();
    await this.scanForDates();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Scan buttons
    document.getElementById('rescan-btn')?.addEventListener('click', () => this.scanForDates());
    document.getElementById('rescan-btn-2')?.addEventListener('click', () => this.scanForDates());
    document.getElementById('retry-btn')?.addEventListener('click', () => this.scanForDates());

    // Action buttons
    document.getElementById('save-to-calendar-btn')?.addEventListener('click', () => this.saveToCalendar());
    document.getElementById('download-ics-btn')?.addEventListener('click', () => this.downloadICS());
    document.getElementById('auth-btn')?.addEventListener('click', () => this.authenticate());

    // Listen for date updates from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'datesUpdated') {
        this.displayDates(request.dates);
      }
    });
  }

  /**
   * Check if user is authenticated with Google
   */
  async checkAuthStatus() {
    try {
      const result = await chrome.runtime.sendMessage({ action: 'checkAuth' });
      this.isAuthenticated = result.authenticated;
    } catch (e) {
      console.error('Error checking auth status:', e);
      this.isAuthenticated = false;
    }
  }

  /**
   * Scan the current page for dates
   */
  async scanForDates() {
    try {
      this.showState('loading');
      this.updateStatus('Scanning page...');

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        throw new Error('No active tab found');
      }

      // Send message to content script
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'scanDates' });
      
      if (response && response.dates) {
        this.allDates = response.dates;
        if (this.allDates.length === 0) {
          this.showState('no-dates');
          this.updateStatus('');
        } else {
          this.displayDates(this.allDates);
          this.updateStatus('');
        }
      } else {
        throw new Error('No response from content script');
      }
    } catch (error) {
      console.error('Error scanning page:', error);
      this.showError('Failed to scan page. Please try again.');
    }
  }

  /**
   * Display found dates in the list
   * @param {Array} dates - Array of date objects
   */
  displayDates(dates) {
    this.allDates = dates;
    this.showState('dates');

    const datesList = document.getElementById('dates-list');
    const dateCount = document.getElementById('date-count');
    
    dateCount.textContent = dates.length;
    datesList.innerHTML = '';

    if (dates.length === 0) {
      this.showState('no-dates');
      return;
    }

    dates.forEach(dateObj => {
      const item = this.createDateItem(dateObj);
      datesList.appendChild(item);
    });

    this.updateActionButtons();
  }

  /**
   * Create a date item element
   * @param {Object} dateObj - Date object
   * @returns {HTMLElement} Date item element
   */
  createDateItem(dateObj) {
    const item = document.createElement('div');
    item.className = 'date-item';
    item.dataset.id = dateObj.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'date-checkbox';
    checkbox.id = `date-${dateObj.id}`;
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        this.selectedDates.add(dateObj.id);
        item.classList.add('selected');
      } else {
        this.selectedDates.delete(dateObj.id);
        item.classList.remove('selected');
      }
      this.updateActionButtons();
    });

    const info = document.createElement('div');
    info.className = 'date-info';

    const text = document.createElement('div');
    text.className = 'date-text';
    text.textContent = dateObj.formattedDate;

    const context = document.createElement('div');
    context.className = 'date-context';
    context.textContent = dateObj.context || dateObj.originalText;

    const badge = document.createElement('span');
    badge.className = `date-badge ${dateObj.isFuture ? 'future' : ''}`;
    badge.textContent = dateObj.isFuture ? 'Upcoming' : 'Past';

    info.appendChild(text);
    info.appendChild(context);
    info.appendChild(badge);

    item.appendChild(checkbox);
    item.appendChild(info);

    // Click anywhere on item to toggle
    item.addEventListener('click', (e) => {
      if (e.target !== checkbox) {
        checkbox.click();
      }
    });

    return item;
  }

  /**
   * Update action button states
   */
  updateActionButtons() {
    const hasSelection = this.selectedDates.size > 0;
    document.getElementById('save-to-calendar-btn').disabled = !hasSelection;
    document.getElementById('download-ics-btn').disabled = !hasSelection;
  }

  /**
   * Save selected dates to Google Calendar
   */
  async saveToCalendar() {
    if (this.selectedDates.size === 0) return;

    // Check authentication
    if (!this.isAuthenticated) {
      this.showState('auth');
      return;
    }

    try {
      this.updateStatus('Saving to Google Calendar...', 'info');
      const selectedDateObjects = this.allDates.filter(d => this.selectedDates.has(d.id));

      const result = await chrome.runtime.sendMessage({
        action: 'saveToCalendar',
        dates: selectedDateObjects
      });

      if (result.success) {
        this.updateStatus(`✓ Saved ${result.count} event(s) to Google Calendar`, 'success');
        // Clear selection after successful save
        setTimeout(() => {
          this.selectedDates.clear();
          this.updateActionButtons();
          // Uncheck all checkboxes
          document.querySelectorAll('.date-checkbox').forEach(cb => cb.checked = false);
          document.querySelectorAll('.date-item').forEach(item => item.classList.remove('selected'));
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to save to calendar');
      }
    } catch (error) {
      console.error('Error saving to calendar:', error);
      this.showError('Failed to save to Google Calendar: ' + error.message);
    }
  }

  /**
   * Download selected dates as .ics file
   */
  downloadICS() {
    if (this.selectedDates.size === 0) return;

    try {
      this.updateStatus('Creating .ics file...', 'info');
      const selectedDateObjects = this.allDates.filter(d => this.selectedDates.has(d.id));

      const icsContent = ICSUtils.createICSFile(selectedDateObjects);
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `events-${Date.now()}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.updateStatus(`✓ Downloaded ${this.selectedDates.size} event(s) as .ics file`, 'success');
    } catch (error) {
      console.error('Error creating .ics file:', error);
      this.showError('Failed to create .ics file: ' + error.message);
    }
  }

  /**
   * Authenticate with Google Calendar
   */
  async authenticate() {
    try {
      this.updateStatus('Authenticating...', 'info');
      
      const result = await chrome.runtime.sendMessage({ action: 'authenticate' });
      
      if (result.success) {
        this.isAuthenticated = true;
        this.updateStatus('✓ Successfully authenticated', 'success');
        // Go back to dates view
        setTimeout(() => {
          this.showState('dates');
        }, 1000);
      } else {
        throw new Error(result.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      this.showError('Authentication failed: ' + error.message);
    }
  }

  /**
   * Show a specific state/view
   * @param {string} state - State name: loading, no-dates, dates, error, auth
   */
  showState(state) {
    const states = ['loading', 'no-dates', 'dates-container', 'error-container', 'auth-container'];
    states.forEach(s => {
      const el = document.getElementById(s === 'dates' ? 'dates-container' : s);
      if (el) {
        el.classList.toggle('hidden', s !== state && `${s}-container` !== state && s !== `${state}-container`);
      }
    });
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    this.showState('error-container');
    document.getElementById('error-message').textContent = message;
    this.updateStatus(message, 'error');
  }

  /**
   * Update status message
   * @param {string} message - Status message
   * @param {string} type - Status type: info, success, error
   */
  updateStatus(message, type = 'info') {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const controller = new PopupController();
  controller.init();
});

// Global notification system
let notificationTimeout = null;

/**
 * Shows a global notification message
 * @param {string} message - The message to display
 * @param {string} type - The type of notification ('success' or 'error')
 */
export function showGlobalNotification(message, type = 'success') {
  const notification = document.getElementById('js-global-notification');
  const textElement = document.getElementById('js-global-notification-text');

  if (!notification || !textElement) return;

  // Clear any existing timeout
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
    notificationTimeout = null;
  }

  // Set the message and type
  textElement.textContent = message;
  notification.classList.remove('global-notification--error');
  if (type === 'error') {
    notification.classList.add('global-notification--error');
  }

  // Show the notification
  notification.classList.add('global-notification--visible');

  // Auto-hide after 3 seconds
  notificationTimeout = setTimeout(() => {
    hideGlobalNotification();
  }, 3000);
}

/**
 * Hides the global notification
 */
export function hideGlobalNotification() {
  const notification = document.getElementById('js-global-notification');
  const textElement = document.getElementById('js-global-notification-text');

  if (!notification) return;

  // Clear timeout if exists
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
    notificationTimeout = null;
  }

  // Hide the notification
  notification.classList.remove('global-notification--visible');

  // Clear content after animation
  setTimeout(() => {
    if (textElement) {
      textElement.textContent = '';
    }
    notification.classList.remove('global-notification--error');
  }, 300);
}

/**
 * Initializes the global notification system
 */
export function initGlobalNotification() {
  const closeBtn = document.getElementById('js-global-notification-close');

  if (closeBtn) {
    closeBtn.addEventListener('click', hideGlobalNotification);
  }
}

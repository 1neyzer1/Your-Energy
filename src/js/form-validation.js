/**
 * Form validation utilities module
 * Provides reusable functions for form field validation and error display
 */

/**
 * Shows an error message for a form field
 * @param {HTMLElement} inputElement - The input/textarea element
 * @param {HTMLElement} errorElement - The element to display error message
 * @param {string} message - The error message to display
 */
export function showFieldError(inputElement, errorElement, message) {
  if (inputElement) {
    // Determine the appropriate error class based on element type
    const errorClass = inputElement.classList.contains('rating-modal__textarea')
      ? 'rating-modal__textarea--error'
      : inputElement.classList.contains('rating-modal__input')
      ? 'rating-modal__input--error'
      : inputElement.classList.contains('footer__subscribe-form-input')
      ? 'footer__subscribe-form-input--error'
      : 'form-field--error';

    inputElement.classList.add(errorClass);
  }

  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add('form-error--visible');
  }
}

/**
 * Hides the error message for a form field
 * @param {HTMLElement} inputElement - The input/textarea element
 * @param {HTMLElement} errorElement - The element displaying error message
 */
export function hideFieldError(inputElement, errorElement) {
  if (inputElement) {
    inputElement.classList.remove(
      'rating-modal__input--error',
      'rating-modal__textarea--error',
      'footer__subscribe-form-input--error',
      'form-field--error'
    );
  }

  if (errorElement) {
    errorElement.textContent = '';
    errorElement.classList.remove('form-error--visible');
  }
}

/**
 * Validates an email address
 * @param {string} email - The email address to validate
 * @returns {boolean} True if email is valid, false otherwise
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates that a field is not empty
 * @param {string} value - The value to validate
 * @returns {boolean} True if value is not empty, false otherwise
 */
export function validateRequired(value) {
  return value.trim().length > 0;
}


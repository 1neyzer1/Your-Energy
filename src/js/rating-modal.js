import { showGlobalNotification } from './global-notification.js';
import {
  showFieldError,
  hideFieldError,
  validateEmail,
} from './form-validation.js';
import { patchExerciseRating } from '../api.js';

let currentExerciseIdForRating = null;
let onRatingSuccess = null;
let listenersAttached = false;
let lastFocusedElement = null;
let focusableElements = [];

function getModalElements() {
  const modal = document.getElementById('js-rating-modal');
  if (!modal) return null;

  return {
    modal,
    overlay: modal.querySelector('.rating-modal__overlay'),
    closeBtn: document.getElementById('js-rating-modal-close'),
    serverMessage: document.getElementById('js-rating-server-message'),
    serverMessageText: document.getElementById('js-rating-server-message-text'),
    serverMessageClose: document.getElementById('js-rating-server-message-close'),
    ratingValue: document.getElementById('js-rating-modal-value'),
    ratingError: document.getElementById('js-rating-error'),
    form: document.getElementById('js-rating-modal-form'),
    emailInput: document.getElementById('js-rating-modal-email'),
    emailError: document.getElementById('js-email-error'),
    commentTextarea: document.getElementById('js-rating-modal-comment'),
    commentError: document.getElementById('js-comment-error'),
    starInputs: Array.from(
      modal.querySelectorAll('.rating-modal__star-input')
    ),
    starLabels: Array.from(modal.querySelectorAll('.rating-modal__star')),
  };
}

function getFocusableElements(modal) {
  const selectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  return Array.from(modal.querySelectorAll(selectors.join(','))).filter(
    element => !element.hasAttribute('aria-hidden')
  );
}

function updateFocusableElements(modal) {
  focusableElements = getFocusableElements(modal);
}

function trapFocus(event) {
  if (event.key !== 'Tab' || focusableElements.length === 0) {
    return;
  }

  const first = focusableElements[0];
  const last = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function showServerMessage(message, type = 'error') {
  const elements = getModalElements();
  if (!elements?.serverMessage || !elements.serverMessageText) return;

  elements.serverMessageText.textContent = message;
  elements.serverMessage.classList.remove(
    'rating-modal__server-message--error',
    'rating-modal__server-message--success'
  );
  elements.serverMessage.classList.add(`rating-modal__server-message--${type}`);
  elements.serverMessage.classList.add('rating-modal__server-message--visible');
}

function hideServerMessage() {
  const elements = getModalElements();
  if (!elements?.serverMessage) return;

  elements.serverMessage.classList.remove('rating-modal__server-message--visible');
  if (elements.serverMessageText) {
    elements.serverMessageText.textContent = '';
  }
  elements.serverMessage.classList.remove(
    'rating-modal__server-message--error',
    'rating-modal__server-message--success'
  );
}

function getSelectedRating() {
  const elements = getModalElements();
  if (!elements) return 0;
  const selected = elements.starInputs.find(input => input.checked);
  return selected ? Number(selected.value) : 0;
}

function updateStars(rating) {
  const elements = getModalElements();
  if (!elements) return;

  elements.starLabels.forEach((label, index) => {
    if (index < rating) {
      label.classList.add('rating-modal__star--active');
      const path = label.querySelector('path');
      if (path) {
        path.setAttribute('fill', '#EEA10C');
        path.setAttribute('stroke', '#EEA10C');
      }
    } else {
      label.classList.remove('rating-modal__star--active');
      const path = label.querySelector('path');
      if (path) {
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'currentColor');
      }
    }
  });
}

function updateRatingValue(value) {
  const elements = getModalElements();
  if (elements?.ratingValue) {
    elements.ratingValue.textContent = value.toFixed(1);
  }
}

function resetRatingForm() {
  const elements = getModalElements();
  if (!elements) return;

  if (elements.form) elements.form.reset();
  elements.starInputs.forEach(input => {
    input.checked = false;
  });
  updateStars(0);
  updateRatingValue(0);

  hideFieldError(elements.emailInput, elements.emailError);
  hideFieldError(elements.commentTextarea, elements.commentError);
  hideFieldError(null, elements.ratingError);
  hideServerMessage();
}

function handleClose() {
  closeRatingModal();
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) {
    closeRatingModal();
  }
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    closeRatingModal();
    return;
  }

  trapFocus(event);
}

function handleStarChange(event) {
  const rating = Number(event.target.value);
  updateStars(rating);
  updateRatingValue(rating);
  const elements = getModalElements();
  if (elements?.ratingError) {
    hideFieldError(null, elements.ratingError);
  }
}

function handleStarHover(event) {
  const rating = Number(event.currentTarget.dataset.rating || 0);
  updateStars(rating);
}

function handleStarLeave() {
  const selectedRating = getSelectedRating();
  updateStars(selectedRating);
}

function handleEmailInput() {
  const elements = getModalElements();
  if (elements) {
    hideFieldError(elements.emailInput, elements.emailError);
  }
}

function handleCommentInput() {
  const elements = getModalElements();
  if (elements) {
    hideFieldError(elements.commentTextarea, elements.commentError);
  }
}

function handleServerMessageClose() {
  hideServerMessage();
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const elements = getModalElements();
  if (!elements) return;

  const selectedRating = getSelectedRating();
  const email = elements.emailInput?.value.trim() || '';
  const review = elements.commentTextarea?.value.trim() || '';

  let hasErrors = false;

  if (!selectedRating) {
    showFieldError(null, elements.ratingError, 'Please select a rating');
    hasErrors = true;
  } else {
    hideFieldError(null, elements.ratingError);
  }

  if (!email) {
    showFieldError(
      elements.emailInput,
      elements.emailError,
      'Please enter your email'
    );
    hasErrors = true;
  } else if (!validateEmail(email)) {
    showFieldError(
      elements.emailInput,
      elements.emailError,
      'Please enter a valid email address'
    );
    hasErrors = true;
  } else {
    hideFieldError(elements.emailInput, elements.emailError);
  }

  if (!review) {
    showFieldError(
      elements.commentTextarea,
      elements.commentError,
      'Please enter your comment'
    );
    hasErrors = true;
  } else {
    hideFieldError(elements.commentTextarea, elements.commentError);
  }

  if (hasErrors || !currentExerciseIdForRating) {
    return;
  }

  hideServerMessage();

  try {
    const data = await patchExerciseRating(currentExerciseIdForRating, {
      rate: selectedRating,
      email,
      review,
    });

    const exerciseName = data?.name || 'the exercise';
    const exerciseId = currentExerciseIdForRating;
    const successCallback = onRatingSuccess;

    closeRatingModal();

    showGlobalNotification(
      `Thank you, your review for exercise ${exerciseName} has been submitted`,
      'success'
    );

    if (successCallback && exerciseId) {
      successCallback(exerciseId);
    }
  } catch (error) {
    const errorMessage =
      error.message || 'Failed to submit rating. Please try again.';
    showServerMessage(errorMessage, 'error');
  }
}

function attachListeners() {
  if (listenersAttached) return;
  const elements = getModalElements();
  if (!elements) return;

  elements.closeBtn?.addEventListener('click', handleClose);
  elements.overlay?.addEventListener('click', handleOverlayClick);
  elements.serverMessageClose?.addEventListener(
    'click',
    handleServerMessageClose
  );
  elements.form?.addEventListener('submit', handleFormSubmit);
  elements.emailInput?.addEventListener('input', handleEmailInput);
  elements.commentTextarea?.addEventListener('input', handleCommentInput);
  elements.starInputs.forEach(input =>
    input.addEventListener('change', handleStarChange)
  );
  elements.starLabels.forEach(label => {
    label.addEventListener('mouseenter', handleStarHover);
    label.addEventListener('mouseleave', handleStarLeave);
  });
  document.addEventListener('keydown', handleKeydown);

  listenersAttached = true;
}

function detachListeners() {
  if (!listenersAttached) return;
  const elements = getModalElements();
  if (!elements) return;

  elements.closeBtn?.removeEventListener('click', handleClose);
  elements.overlay?.removeEventListener('click', handleOverlayClick);
  elements.serverMessageClose?.removeEventListener(
    'click',
    handleServerMessageClose
  );
  elements.form?.removeEventListener('submit', handleFormSubmit);
  elements.emailInput?.removeEventListener('input', handleEmailInput);
  elements.commentTextarea?.removeEventListener('input', handleCommentInput);
  elements.starInputs.forEach(input =>
    input.removeEventListener('change', handleStarChange)
  );
  elements.starLabels.forEach(label => {
    label.removeEventListener('mouseenter', handleStarHover);
    label.removeEventListener('mouseleave', handleStarLeave);
  });
  document.removeEventListener('keydown', handleKeydown);

  listenersAttached = false;
}

export function openRatingModal(exerciseId, options = {}) {
  const elements = getModalElements();
  if (!elements) return;

  currentExerciseIdForRating = exerciseId;
  onRatingSuccess = options.onSuccess || null;
  lastFocusedElement = document.activeElement;

  resetRatingForm();
  attachListeners();

  elements.modal.classList.add('rating-modal--open');
  elements.modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  updateFocusableElements(elements.modal);
  focusableElements[0]?.focus();
}

function closeRatingModal() {
  const elements = getModalElements();
  if (!elements) return;

  detachListeners();

  elements.modal.classList.remove('rating-modal--open');
  elements.modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  currentExerciseIdForRating = null;
  onRatingSuccess = null;

  if (
    lastFocusedElement &&
    typeof lastFocusedElement.focus === 'function' &&
    document.contains(lastFocusedElement)
  ) {
    lastFocusedElement.focus();
  }
  lastFocusedElement = null;
}

export { closeRatingModal };

export function initRatingModal() {
  const elements = getModalElements();
  if (elements?.modal) {
    elements.modal.setAttribute('aria-hidden', 'true');
  }
}

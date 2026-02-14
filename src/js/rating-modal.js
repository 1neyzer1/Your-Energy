import { showGlobalNotification } from './global-notification.js';
import {
  showFieldError,
  hideFieldError,
  validateEmail,
} from './form-validation.js';

const MODAL_IDS = {
  EXERCISE: 'js-exercise-modal',
  RATING: 'js-rating-modal',
};

const SCROLL_LOCK_KEY = 'scrollLockCount';

function lockBodyScroll() {
  const body = document.body;
  if (!body) return;

  const count = Number(body.dataset[SCROLL_LOCK_KEY] || 0) + 1;
  body.dataset[SCROLL_LOCK_KEY] = String(count);
  if (count === 1) {
    body.style.overflow = 'hidden';
  }
}

function unlockBodyScroll() {
  const body = document.body;
  if (!body) return;

  const count = Number(body.dataset[SCROLL_LOCK_KEY] || 0) - 1;
  if (count <= 0) {
    delete body.dataset[SCROLL_LOCK_KEY];
    body.style.overflow = '';
    return;
  }
  body.dataset[SCROLL_LOCK_KEY] = String(count);
}

function getModalOpenClass(modalId) {
  if (modalId === MODAL_IDS.EXERCISE) return 'exercise-modal--open';
  if (modalId === MODAL_IDS.RATING) return 'rating-modal--open';
  return '';
}

function getModalBackdrop(modal) {
  return (
    modal.querySelector('.modal__backdrop') ||
    modal.querySelector('.exercise-modal__overlay') ||
    modal.querySelector('.rating-modal__overlay') ||
    (modal.classList.contains('modal-backdrop') ||
    modal.classList.contains('modal__backdrop')
      ? modal
      : null)
  );
}

export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  const openClass = getModalOpenClass(modalId);
  if (openClass) {
    modal.classList.add(openClass);
  }
  modal.classList.add('is-open');
  document.body.classList.add('modal-open');
  lockBodyScroll();

  if (modal.dataset.backdropListener !== 'true') {
    const backdrop = getModalBackdrop(modal);
    if (backdrop) {
      backdrop.addEventListener('click', event => {
        if (event.target !== backdrop) return;
        closeModal(modalId);
      });
    }
    modal.dataset.backdropListener = 'true';
  }

  if (modal.dataset.escapeListener !== 'true') {
    const handleEscape = e => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal(modalId);
      }
    };
    document.addEventListener('keydown', handleEscape);
    modal.dataset.escapeListener = 'true';
  }
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  const openClass = getModalOpenClass(modalId);
  const wasOpen =
    modal.classList.contains('is-open') ||
    (openClass && modal.classList.contains(openClass));

  modal.classList.remove('is-open');
  if (openClass) {
    modal.classList.remove(openClass);
  }

  if (wasOpen) {
    unlockBodyScroll();
  }

  if (modalId === MODAL_IDS.RATING) {
    openModal(MODAL_IDS.EXERCISE);
  }

  const anyModalOpen = document.querySelector(
    '.exercise-modal--open, .rating-modal--open, .is-open'
  );
  if (!anyModalOpen) {
    document.body.classList.remove('modal-open');
  }
}

// Змінна для зберігання ID вправи для рейтингу
let currentExerciseIdForRating = null;

// Helper functions for server messages
function showServerMessage(message, type = 'error') {
  const messageElement = document.getElementById('js-rating-server-message');
  if (!messageElement) return;

  messageElement.textContent = message;
  messageElement.classList.remove(
    'modal-rating-message--error',
    'modal-rating-message--success'
  );
  messageElement.classList.add(`modal-rating-message--${type}`);
  messageElement.hidden = false;
}

function hideServerMessage() {
  const messageElement = document.getElementById('js-rating-server-message');
  if (!messageElement) return;

  messageElement.textContent = '';
  messageElement.classList.remove(
    'modal-rating-message--error',
    'modal-rating-message--success'
  );
  messageElement.hidden = true;
}

// Функція для закриття модального вікна рейтингу
function closeRatingModal() {
  closeModal(MODAL_IDS.RATING);
  currentExerciseIdForRating = null;
  resetRatingForm();
}

// Функція для відкриття модального вікна рейтингу
export function openRatingModal(exerciseId) {
  showRatingModal(exerciseId);
}

export function showRatingModal(exerciseId) {
  if (exerciseId) {
    currentExerciseIdForRating = exerciseId;
  }
  closeModal(MODAL_IDS.EXERCISE);
  openModal(MODAL_IDS.RATING);
  resetRatingForm();
  initRatingStars();
}

export function hideRatingModal() {
  closeRatingModal();
}

function resetRatingForm() {
  const ratingForm = document.getElementById('js-rating-modal-form');
  const ratingValue = document.getElementById('js-rating-modal-value');
  const stars = document.querySelectorAll('.rating-modal__star');

  if (ratingForm) ratingForm.reset();
  if (ratingValue) ratingValue.textContent = '0.0';

  stars.forEach(star => {
    star.classList.remove('rating-modal__star--active');
    star.style.color = '';
    const svg = star.querySelector('svg');
    if (svg) {
      const path = svg.querySelector('path');
      if (path) {
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'currentColor');
      }
    }
  });

  const emailInput = document.getElementById('js-rating-modal-email');
  const emailError = document.getElementById('js-email-error');
  const commentTextarea = document.getElementById('js-rating-modal-comment');
  const commentError = document.getElementById('js-comment-error');
  const ratingError = document.getElementById('js-rating-error');

  hideFieldError(emailInput, emailError);
  hideFieldError(commentTextarea, commentError);
  hideFieldError(null, ratingError);
  hideServerMessage();
}

function initRatingStars() {
  const starsContainer = document.getElementById('js-rating-modal-stars');
  const ratingValue = document.getElementById('js-rating-modal-value');

  if (!starsContainer) return;
  if (starsContainer.dataset.listenerAttached === 'true') return;
  starsContainer.dataset.listenerAttached = 'true';

  const stars = starsContainer.querySelectorAll('.rating-modal__star');

  stars.forEach(star => {
    star.addEventListener('click', () => {
      const selectedRating = Number(star.dataset.rating || 0);
      if (ratingValue) {
        ratingValue.textContent = selectedRating.toFixed(1);
      }

      stars.forEach(s => {
        const starRating = Number(s.dataset.rating || 0);
        const isActive = starRating <= selectedRating;
        s.classList.toggle('rating-modal__star--active', isActive);
        const svg = s.querySelector('svg');
        if (svg) {
          const path = svg.querySelector('path');
          if (path) {
            if (isActive) {
              path.setAttribute('fill', '#EEA10C');
              path.setAttribute('stroke', '#EEA10C');
            } else {
              path.setAttribute('fill', 'none');
              path.setAttribute('stroke', 'currentColor');
            }
          }
        }
      });

      const ratingError = document.getElementById('js-rating-error');
      if (ratingError) {
        hideFieldError(null, ratingError);
      }
    });

    star.addEventListener('mouseenter', () => {
      const hoverRating = Number(star.dataset.rating || 0);
      stars.forEach(s => {
        const starRating = Number(s.dataset.rating || 0);
        if (
          starRating <= hoverRating &&
          !s.classList.contains('rating-modal__star--active')
        ) {
          s.style.color = 'rgba(255, 255, 255, 0.6)';
        }
      });
    });

    star.addEventListener('mouseleave', () => {
      stars.forEach(s => {
        if (!s.classList.contains('rating-modal__star--active')) {
          s.style.color = 'rgba(255, 255, 255, 0.3)';
        } else {
          s.style.color = '';
        }
      });
    });
  });
}

export function getCurrentRating() {
  const stars = document.querySelectorAll('.rating-modal__star--active');
  let maxRating = 0;
  stars.forEach(star => {
    const rating = Number(star.dataset.rating || 0);
    if (rating > maxRating) {
      maxRating = rating;
    }
  });
  return maxRating;
}

// Експорт функції закриття для використання в інших модулях
export { closeRatingModal };

// Ініціалізація event listeners для модального вікна рейтингу
export function initRatingModal() {
  // Обробники для модального вікна рейтингу
  const ratingModalCloseBtn = document.getElementById('js-rating-modal-close');

  if (ratingModalCloseBtn) {
    ratingModalCloseBtn.addEventListener('click', closeRatingModal);
  }

  initRatingStars();

  // Add input event listeners to clear errors on input
  const emailInput = document.getElementById('js-rating-modal-email');
  const emailError = document.getElementById('js-email-error');
  const commentTextarea = document.getElementById('js-rating-modal-comment');
  const commentError = document.getElementById('js-comment-error');

  if (emailInput && emailError) {
    emailInput.addEventListener('input', () => {
      hideFieldError(emailInput, emailError);
    });
  }

  if (commentTextarea && commentError) {
    commentTextarea.addEventListener('input', () => {
      hideFieldError(commentTextarea, commentError);
    });
  }

  // Обробка форми рейтингу
  const ratingForm = document.getElementById('js-rating-modal-form');
  if (ratingForm) {
    ratingForm.addEventListener('submit', e => {
      e.preventDefault();

      const emailInput = document.getElementById('js-rating-modal-email');
      const commentTextarea = document.getElementById(
        'js-rating-modal-comment'
      );
      const emailError = document.getElementById('js-email-error');
      const commentError = document.getElementById('js-comment-error');
      const ratingError = document.getElementById('js-rating-error');

      const selectedRating = getCurrentRating();
      let hasErrors = false;

      // Validate rating
      if (selectedRating === 0) {
        showFieldError(null, ratingError, 'Please select a rating');
        hasErrors = true;
      } else {
        hideFieldError(null, ratingError);
      }

      const email = emailInput?.value.trim() || '';
      const review = commentTextarea?.value.trim() || '';

      // Validate email
      if (!email) {
        showFieldError(emailInput, emailError, 'Please enter your email');
        hasErrors = true;
      } else if (!validateEmail(email)) {
        showFieldError(
          emailInput,
          emailError,
          'Please enter a valid email address'
        );
        hasErrors = true;
      } else {
        hideFieldError(emailInput, emailError);
      }

      // Validate comment
      if (!review) {
        showFieldError(
          commentTextarea,
          commentError,
          'Please enter your comment'
        );
        hasErrors = true;
      } else {
        hideFieldError(commentTextarea, commentError);
      }

      // Stop if there are errors
      if (hasErrors) {
        return;
      }

      // Відправка рейтингу на сервер
      if (currentExerciseIdForRating) {
        // Clear previous server messages
        hideServerMessage();

        fetch(
          `https://your-energy.b.goit.study/api/exercises/${currentExerciseIdForRating}/rating`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              rate: selectedRating,
              email,
              review,
            }),
          }
        )
          .then(async response => {
            const data = await response.json();

            if (!response.ok) {
              // Get error message from server or use default
              throw { message: data.message, data };
            }

            return data;
          })
          .then(data => {
            closeRatingModal();
            const exerciseName = data.name || 'the exercise';
            showGlobalNotification(
              `Thank you, your review for exercise ${exerciseName} has been submitted`,
              'success'
            );
          })
          .catch(error => {
            const errorMessage =
              error.message || 'Failed to submit rating. Please try again.';
            showServerMessage(errorMessage, 'error');
          });
      }
    });
  }
}

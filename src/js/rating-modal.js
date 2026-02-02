import { showGlobalNotification } from './global-notification.js';
import {
  showFieldError,
  hideFieldError,
  validateEmail,
} from './form-validation.js';

// Змінна для зберігання ID вправи для рейтингу
let currentExerciseIdForRating = null;

// Helper functions for server messages
function showServerMessage(message, type = 'error') {
  const messageElement = document.getElementById('js-rating-server-message');
  const messageTextElement = document.getElementById(
    'js-rating-server-message-text'
  );
  if (!messageElement || !messageTextElement) return;

  messageTextElement.textContent = message;
  messageElement.classList.remove(
    'rating-modal__server-message--error',
    'rating-modal__server-message--success'
  );
  messageElement.classList.add(`rating-modal__server-message--${type}`);
  messageElement.classList.add('rating-modal__server-message--visible');
}

function hideServerMessage() {
  const messageElement = document.getElementById('js-rating-server-message');
  const messageTextElement = document.getElementById(
    'js-rating-server-message-text'
  );
  if (!messageElement) return;

  messageElement.classList.remove('rating-modal__server-message--visible');
  if (messageTextElement) {
    messageTextElement.textContent = '';
  }
  messageElement.classList.remove(
    'rating-modal__server-message--error',
    'rating-modal__server-message--success'
  );
}

// Функція для закриття модального вікна рейтингу
function closeRatingModal() {
  const modal = document.getElementById('js-rating-modal');
  if (!modal) return;

  modal.classList.remove('rating-modal--open');
  document.body.style.overflow = '';
  currentExerciseIdForRating = null;

  // Clear all errors when closing
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

// Функція для відкриття модального вікна рейтингу
export function openRatingModal(exerciseId) {
  const modal = document.getElementById('js-rating-modal');
  if (!modal) return;

  currentExerciseIdForRating = exerciseId;

  // Скидаємо форму
  const form = document.getElementById('js-rating-modal-form');
  const emailInput = document.getElementById('js-rating-modal-email');
  const commentTextarea = document.getElementById('js-rating-modal-comment');
  const ratingValue = document.getElementById('js-rating-modal-value');
  const stars = document.querySelectorAll('.rating-modal__star');

  if (form) form.reset();
  if (ratingValue) ratingValue.textContent = '0.0';

  // Clear all errors
  const emailError = document.getElementById('js-email-error');
  const commentError = document.getElementById('js-comment-error');
  const ratingError = document.getElementById('js-rating-error');
  hideFieldError(emailInput, emailError);
  hideFieldError(commentTextarea, commentError);
  hideFieldError(null, ratingError);
  hideServerMessage();

  // Скидаємо активні зірки
  stars.forEach(star => {
    star.classList.remove('rating-modal__star--active');
    const svg = star.querySelector('svg');
    if (svg) {
      const path = svg.querySelector('path');
      if (path) {
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'currentColor');
      }
    }
  });

  // Відкриваємо модальне вікно
  modal.classList.add('rating-modal--open');
  document.body.style.overflow = 'hidden';
}

// Експорт функції закриття для використання в інших модулях
export { closeRatingModal };

// Ініціалізація event listeners для модального вікна рейтингу
export function initRatingModal() {
  // Обробники для модального вікна рейтингу
  const ratingModalCloseBtn = document.getElementById('js-rating-modal-close');
  const ratingModal = document.getElementById('js-rating-modal');
  const ratingModalOverlay = ratingModal?.querySelector(
    '.rating-modal__overlay'
  );

  if (ratingModalCloseBtn) {
    ratingModalCloseBtn.addEventListener('click', closeRatingModal);
  }

  if (ratingModalOverlay) {
    ratingModalOverlay.addEventListener('click', closeRatingModal);
  }

  // Обробник для закриття серверного повідомлення
  const serverMessageCloseBtn = document.getElementById(
    'js-rating-server-message-close'
  );
  if (serverMessageCloseBtn) {
    serverMessageCloseBtn.addEventListener('click', hideServerMessage);
  }

  // Обробка зірок рейтингу
  const ratingStars = document.querySelectorAll('.rating-modal__star');
  const ratingValue = document.getElementById('js-rating-modal-value');
  let selectedRating = 0;

  ratingStars.forEach((star, index) => {
    star.addEventListener('click', () => {
      selectedRating = index + 1;

      if (ratingValue) {
        ratingValue.textContent = selectedRating.toFixed(1);
      }

      // Оновлюємо зірки
      ratingStars.forEach((s, i) => {
        if (i < selectedRating) {
          s.classList.add('rating-modal__star--active');
          const svg = s.querySelector('svg');
          if (svg) {
            const path = svg.querySelector('path');
            if (path) {
              path.setAttribute('fill', '#EEA10C');
              path.setAttribute('stroke', '#EEA10C');
            }
          }
        } else {
          s.classList.remove('rating-modal__star--active');
          const svg = s.querySelector('svg');
          if (svg) {
            const path = svg.querySelector('path');
            if (path) {
              path.setAttribute('fill', 'none');
              path.setAttribute('stroke', 'currentColor');
            }
          }
        }
      });
    });

    // Hover ефект
    star.addEventListener('mouseenter', () => {
      const hoverRating = index + 1;
      ratingStars.forEach((s, i) => {
        if (
          i < hoverRating &&
          !s.classList.contains('rating-modal__star--active')
        ) {
          s.style.color = 'rgba(255, 255, 255, 0.6)';
        }
      });
    });

    star.addEventListener('mouseleave', () => {
      ratingStars.forEach((s, i) => {
        if (!s.classList.contains('rating-modal__star--active')) {
          s.style.color = 'rgba(255, 255, 255, 0.3)';
        }
      });
    });
  });

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

  // Clear rating error when selecting a star
  ratingStars.forEach(star => {
    star.addEventListener('click', () => {
      const ratingError = document.getElementById('js-rating-error');
      if (ratingError) {
        hideFieldError(null, ratingError);
      }
    });
  });

  // Обробка форми рейтингу
  const ratingForm = document.getElementById('js-rating-modal-form');
  if (ratingForm) {
    ratingForm.addEventListener('submit', e => {
      e.preventDefault();

      const ratingStars = document.querySelectorAll('.rating-modal__star');
      const ratingValue = document.getElementById('js-rating-modal-value');
      const emailInput = document.getElementById('js-rating-modal-email');
      const commentTextarea = document.getElementById(
        'js-rating-modal-comment'
      );
      const emailError = document.getElementById('js-email-error');
      const commentError = document.getElementById('js-comment-error');
      const ratingError = document.getElementById('js-rating-error');

      let selectedRating = 0;
      let hasErrors = false;

      // Знаходимо вибраний рейтинг
      ratingStars.forEach((star, index) => {
        if (star.classList.contains('rating-modal__star--active')) {
          selectedRating = Math.max(selectedRating, index + 1);
        }
      });

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

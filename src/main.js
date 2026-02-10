import {
  switchToHome,
  switchToFavorites,
  initSearch,
  initCardsEventListener,
  initFilters,
} from './js/exercises.js';
import { initExerciseModal } from './js/exercise-modal.js';
import { initRatingModal } from './js/rating-modal.js';
import {
  initGlobalNotification,
  showGlobalNotification,
} from './js/global-notification.js';
import {
  showFieldError,
  hideFieldError,
  validateEmail,
} from './js/form-validation.js';
import { initHeader } from './js/header.js';
import { displayQuote } from './js/quote.js';
import { postSubscription } from './api.js';

// Початкове завантаження та ініціалізація
document.addEventListener('DOMContentLoaded', () => {
  // Load and display quote of the day
  displayQuote();
  // Ініціалізація модалок
  initExerciseModal();
  initRatingModal();

  // Ініціалізація глобальних повідомлень
  initGlobalNotification();

  // Ініціалізація хедера
  initHeader();

  // Ініціалізація пошуку
  initSearch();

  // Ініціалізація слухача подій на контейнері карток (event delegation)
  initCardsEventListener();

  // Ініціалізація фільтрів
  initFilters();

  const initialPage = document.body?.dataset.page || 'home';
  if (initialPage === 'favorites') {
    switchToFavorites();
  } else {
    switchToHome();
  }

  // Обробка форми підписки
  const subscribeForm = document.getElementById('subscribeForm');
  const subscribeEmailInput = document.getElementById(
    'footer-subscribe-email'
  );
  const subscribeEmailError = document.getElementById('subscribeEmailError');

  // Clear error on input
  if (subscribeEmailInput && subscribeEmailError) {
    subscribeEmailInput.addEventListener('input', () => {
      hideFieldError(subscribeEmailInput, subscribeEmailError);
    });
  }

  if (subscribeForm) {
    subscribeForm.addEventListener('submit', async e => {
      e.preventDefault();

      const email = subscribeEmailInput?.value.trim() || '';
      let hasErrors = false;

      // Validate email
      if (!email) {
        showFieldError(
          subscribeEmailInput,
          subscribeEmailError,
          'Please enter your email address'
        );
        hasErrors = true;
      } else if (!validateEmail(email)) {
        showFieldError(
          subscribeEmailInput,
          subscribeEmailError,
          'Please enter a valid email address'
        );
        hasErrors = true;
      } else {
        hideFieldError(subscribeEmailInput, subscribeEmailError);
      }

      // Stop if there are errors
      if (hasErrors) {
        return;
      }

      try {
        const data = await postSubscription(email);
        showGlobalNotification(
          data?.message || 'Subscription successful.',
          'success'
        );
        subscribeForm.reset();
        hideFieldError(subscribeEmailInput, subscribeEmailError);
      } catch (error) {
        showGlobalNotification(error.message || 'Failed to subscribe.', 'error');
      }
    });
  }
});

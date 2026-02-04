import {
  loadExerciseCards,
  switchToHome,
  switchToFavorites,
  initSearch,
  initCardsEventListener,
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

// Функція для відправки запиту на оформлення підписки
async function subscribeToNewsletter(email) {
  try {
    const response = await fetch(
      'https://your-energy.b.goit.study/api/subscription',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.message || 'Failed to subscribe';
      throw new Error(message);
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

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

  const initialPage = document.body?.dataset.page || 'home';
  if (initialPage === 'favorites') {
    switchToFavorites();
  } else {
    switchToHome();
  }

  // Обробка кліків на фільтри
  const filterButtons = document.querySelectorAll(
    '.exercises__content__header-filters-item'
  );

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Видаляємо активний клас з усіх кнопок
      filterButtons.forEach(btn => {
        btn.classList.remove('exercises__content__header-filters-item--active');
        btn.setAttribute('aria-pressed', 'false');
      });

      // Додаємо активний клас до натиснутої кнопки
      button.classList.add('exercises__content__header-filters-item--active');
      button.setAttribute('aria-pressed', 'true');

      // Отримуємо значення фільтра
      const filter = button.getAttribute('data-filter');
      // Завантажуємо нові картки
      loadExerciseCards(filter, 1);
    });
  });

  // Обробка форми підписки
  const subscribeForm = document.getElementById('subscribeForm');
  const subscribeEmailInput = document.getElementById('subscribeEmail');
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

      const result = await subscribeToNewsletter(email);

      if (result.success) {
        showGlobalNotification(result.data.message, 'success');
        subscribeForm.reset();
        hideFieldError(subscribeEmailInput, subscribeEmailError);
      } else {
        showGlobalNotification(result.error, 'error');
      }
    });
  }
});

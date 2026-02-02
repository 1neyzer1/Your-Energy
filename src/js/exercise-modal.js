import { openRatingModal } from './rating-modal.js';
import {
  isFavorite,
  toggleFavorite,
} from './favorites.js';
import { getCurrentPage } from './header.js';
import { loadFavoritesExercises } from './exercises.js';

// Змінна для зберігання ID вправи для рейтингу
let currentExerciseIdForRating = null;

// Функція для закриття модального вікна
function closeExerciseModal() {
  const modal = document.getElementById('js-exercise-modal');
  if (!modal) return;

  modal.classList.remove('exercise-modal--open');
  document.body.style.overflow = '';
}

// Функція для відкриття модального вікна з даними вправи
export function openExerciseModal(exerciseId) {
  const modal = document.getElementById('js-exercise-modal');
  if (!modal) return;

  // Зберігаємо ID вправи для рейтингу
  currentExerciseIdForRating = exerciseId;

  // Показуємо модальне вікно з індикатором завантаження
  modal.classList.add('exercise-modal--open');
  document.body.style.overflow = 'hidden';

  // Отримуємо елементи для заповнення
  const image = document.getElementById('js-exercise-modal-image');
  const title = document.getElementById('js-exercise-modal-title');
  const ratingValue = document.querySelector('.exercise-modal__rating-value');
  const ratingStars = document.querySelector('.exercise-modal__rating-stars');
  const target = document.getElementById('js-exercise-modal-target');
  const bodyPart = document.getElementById('js-exercise-modal-body-part');
  const equipment = document.getElementById('js-exercise-modal-equipment');
  const popular = document.getElementById('js-exercise-modal-popular');
  const calories = document.getElementById('js-exercise-modal-calories');
  const time = document.getElementById('js-exercise-modal-time');
  const description = document.getElementById('js-exercise-modal-description');

  // Очищаємо попередні дані
  if (title) title.textContent = 'Loading...';
  if (ratingValue) ratingValue.textContent = '0.0';
  if (target) target.textContent = '';
  if (bodyPart) bodyPart.textContent = '';
  if (equipment) equipment.textContent = '';
  if (popular) popular.textContent = '0';
  if (calories) calories.textContent = '0';
  if (time) time.textContent = '/0 min';
  if (description) description.textContent = '';
  if (image) image.src = '';

  // Завантажуємо детальну інформацію про вправу
  fetch(`https://your-energy.b.goit.study/api/exercises/${exerciseId}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch exercise details');
      }
      return response.json();
    })
    .then(exercise => {
      // Заповнюємо дані модального вікна
      if (image) image.src = exercise.gifUrl || '';
      if (title) title.textContent = exercise.name || '';
      if (target) target.textContent = exercise.target || '';
      if (bodyPart) bodyPart.textContent = exercise.bodyPart || '';
      if (equipment) equipment.textContent = exercise.equipment || '';
      if (popular) popular.textContent = exercise.popularity || 0;
      if (calories) calories.textContent = exercise.burnedCalories || 0;
      if (time) time.textContent = `/${exercise.time || 0} min`;
      if (description) description.textContent = exercise.description || '';

      // Оновлюємо рейтинг
      if (ratingValue) {
        ratingValue.textContent = (exercise.rating || 0).toFixed(1);
      }

      if (ratingStars) {
        const stars = ratingStars.querySelectorAll(
          '.exercise-modal__rating-star'
        );
        const rating = Math.round(exercise.rating || 0);

        stars.forEach((star, index) => {
          const path = star.querySelector('path');
          if (index < rating) {
            path.setAttribute('fill', '#EEA10C');
            path.removeAttribute('stroke');
            path.removeAttribute('stroke-width');
          } else {
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', 'rgba(255,255,255,0.3)');
            path.setAttribute('stroke-width', '1.5');
          }
        });
      }

      // Оновлюємо стан кнопки Favorites
      updateFavoriteButton(exerciseId);

      // Підключення кнопки "Give a rating"
      const ratingBtn = document.getElementById('js-exercise-modal-rating-btn');
      if (ratingBtn) {
        // Видаляємо попередні обробники
        const newRatingBtn = ratingBtn.cloneNode(true);
        ratingBtn.parentNode.replaceChild(newRatingBtn, ratingBtn);

        newRatingBtn.addEventListener('click', () => {
          closeExerciseModal();
          openRatingModal(exerciseId);
        });
      }
    })
    .catch(error => {
      if (title) title.textContent = 'Error loading exercise';
      if (description)
        description.textContent =
          'Failed to load exercise details. Please try again later.';
    });
}

// Функція для оновлення стану кнопки Favorites
function updateFavoriteButton(exerciseId) {
  const favoriteBtn = document.getElementById('js-exercise-modal-favorites');
  if (!favoriteBtn) return;

  const isInFavorites = isFavorite(exerciseId);
  const btnText = favoriteBtn.querySelector('span');
  const btnIcon = favoriteBtn.querySelector('svg path');

  if (isInFavorites) {
    favoriteBtn.classList.add('active');
    if (btnText) btnText.textContent = 'Remove from favorites';
    if (btnIcon) {
      btnIcon.setAttribute('fill', 'currentColor');
      btnIcon.removeAttribute('stroke');
      btnIcon.removeAttribute('stroke-width');
    }
  } else {
    favoriteBtn.classList.remove('active');
    if (btnText) btnText.textContent = 'Add to favorites';
    if (btnIcon) {
      btnIcon.setAttribute('fill', 'none');
      btnIcon.setAttribute('stroke', 'currentColor');
      btnIcon.setAttribute('stroke-width', '2');
    }
  }
}

// Експорт функції закриття для використання в інших модулях
export { closeExerciseModal };

// Ініціалізація event listeners для модального вікна
export function initExerciseModal() {
  // Обробники для модального вікна
  const modalCloseBtn = document.getElementById('js-exercise-modal-close');
  const modal = document.getElementById('js-exercise-modal');
  const modalOverlay = modal?.querySelector('.exercise-modal__overlay');

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeExerciseModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeExerciseModal);
  }

  // Обробник для кнопки Favorites
  const favoriteBtn = document.getElementById('js-exercise-modal-favorites');
  if (favoriteBtn) {
    favoriteBtn.addEventListener('click', () => {
      const exerciseId = currentExerciseIdForRating;
      if (!exerciseId) return;

      const wasAdded = toggleFavorite(exerciseId);
      updateFavoriteButton(exerciseId);

      // Якщо користувач на сторінці Favorites і видаляє вправу
      if (!wasAdded && getCurrentPage() === 'favorites') {
        closeExerciseModal();
        loadFavoritesExercises();
      }
    });
  }
}


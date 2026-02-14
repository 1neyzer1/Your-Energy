import { openRatingModal, openModal, closeModal } from './rating-modal.js';
import {
  isFavorite,
  toggleFavorite,
} from './favorites.js';
import { getCurrentPage } from './header.js';
import { loadFavoritesExercises } from './exercises.js';

const EXERCISE_MODAL_ID = 'js-exercise-modal';
const SPRITE_PATH = './images/sprite.svg';
const FAVORITE_TEXT_ADD = 'Add to favorites';
const FAVORITE_TEXT_REMOVE = 'Remove from favorites';
const FAVORITE_CLASS = 'is-favorite';

// Змінна для зберігання ID вправи для рейтингу
let currentExerciseIdForRating = null;

// Функція для закриття модального вікна
function closeExerciseModal() {
  closeModal(EXERCISE_MODAL_ID);
}

export function renderExerciseModal(exercise) {
  if (!exercise) return;

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

  if (image) {
    image.src = exercise.gifUrl || '';
    image.alt = exercise.name || 'Exercise illustration';
  }
  if (title) title.textContent = exercise.name || 'Exercise';
  if (target) target.textContent = exercise.target || '';
  if (bodyPart) bodyPart.textContent = exercise.bodyPart || '';
  if (equipment) equipment.textContent = exercise.equipment || '';
  if (popular) popular.textContent = exercise.popularity || 0;
  if (calories) calories.textContent = exercise.burnedCalories || 0;
  if (time) time.textContent = `/${exercise.time || 0} min`;
  if (description) description.textContent = exercise.description || '';

  const rating = Number(exercise.rating) || 0;
  if (ratingValue) {
    ratingValue.textContent = rating.toFixed(1);
  }

  if (ratingStars) {
    const stars = ratingStars.querySelectorAll('.exercise-modal__rating-star');
    const rounded = Math.round(rating);

    stars.forEach((star, index) => {
      const path = star.querySelector('path');
      if (!path) return;
      if (index < rounded) {
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

  const modal = document.getElementById(EXERCISE_MODAL_ID);
  if (modal && exercise._id) {
    modal.dataset.exerciseId = exercise._id;
  }
}

// Функція для відкриття модального вікна з даними вправи
export function openExerciseModal(exerciseId) {
  const modal = document.getElementById(EXERCISE_MODAL_ID);
  if (!modal) return;

  // Зберігаємо ID вправи для рейтингу
  currentExerciseIdForRating = exerciseId;

  // Показуємо модальне вікно з індикатором завантаження
  openModal(EXERCISE_MODAL_ID);

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
  if (ratingStars) {
    const stars = ratingStars.querySelectorAll('.exercise-modal__rating-star');
    stars.forEach(star => {
      const path = star.querySelector('path');
      if (!path) return;
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'rgba(255,255,255,0.3)');
      path.setAttribute('stroke-width', '1.5');
    });
  }

  // Завантажуємо детальну інформацію про вправу
  fetch(`https://your-energy.b.goit.study/api/exercises/${exerciseId}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch exercise details');
      }
      return response.json();
    })
    .then(exercise => {
      renderExerciseModal(exercise);

      // Оновлюємо стан кнопки Favorites
      updateFavoriteButton(exerciseId);

      // Підключення кнопки "Give a rating"
      const ratingBtn = document.getElementById('js-exercise-modal-rating-btn');
      if (ratingBtn) {
        // Видаляємо попередні обробники
        const newRatingBtn = ratingBtn.cloneNode(true);
        ratingBtn.parentNode.replaceChild(newRatingBtn, ratingBtn);

        newRatingBtn.addEventListener('click', () => {
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

function renderFavoriteButtonState(button, isInFavorites) {
  if (!button) return;

  const label = button.querySelector('.modal-btn__label');
  const iconUse = button.querySelector('.modal-btn__icon use');

  if (isInFavorites) {
    button.classList.add(FAVORITE_CLASS);
    if (label) label.textContent = FAVORITE_TEXT_REMOVE;
    if (iconUse) iconUse.setAttribute('href', `${SPRITE_PATH}#icon-trash`);
  } else {
    button.classList.remove(FAVORITE_CLASS);
    if (label) label.textContent = FAVORITE_TEXT_ADD;
    if (iconUse) iconUse.setAttribute('href', `${SPRITE_PATH}#icon-heart`);
  }
}

// Функція для оновлення стану кнопки Favorites
function updateFavoriteButton(exerciseId) {
  const favoriteBtn = document.getElementById('js-exercise-modal-favorites');
  if (!favoriteBtn) return;

  renderFavoriteButtonState(favoriteBtn, isFavorite(exerciseId));
}

// Експорт функції закриття для використання в інших модулях
export { closeExerciseModal };

// Ініціалізація event listeners для модального вікна
export function initExerciseModal() {
  // Обробники для модального вікна
  const modalCloseBtn = document.getElementById('js-exercise-modal-close');

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeExerciseModal);
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

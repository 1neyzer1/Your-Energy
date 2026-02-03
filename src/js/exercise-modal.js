import { openRatingModal } from './rating-modal.js';
import { isFavorite, toggleFavorite } from './favorites.js';
import { getCurrentPage } from './header.js';
import { loadFavoritesExercises } from './exercises.js';

let currentExerciseIdForRating = null;
let listenersAttached = false;

function getModalElements() {
  const modal = document.getElementById('js-exercise-modal');
  if (!modal) return null;

  return {
    modal,
    overlay: modal.querySelector('.exercise-modal__overlay'),
    closeBtn: document.getElementById('js-exercise-modal-close'),
    image: document.getElementById('js-exercise-modal-image'),
    video: document.getElementById('js-exercise-modal-video'),
    title: document.getElementById('js-exercise-modal-title'),
    ratingValue: modal.querySelector('.exercise-modal__rating-value'),
    ratingStars: modal.querySelector('.exercise-modal__rating-stars'),
    target: document.getElementById('js-exercise-modal-target'),
    bodyPart: document.getElementById('js-exercise-modal-body-part'),
    equipment: document.getElementById('js-exercise-modal-equipment'),
    popular: document.getElementById('js-exercise-modal-popular'),
    calories: document.getElementById('js-exercise-modal-calories'),
    time: document.getElementById('js-exercise-modal-time'),
    description: document.getElementById('js-exercise-modal-description'),
    favoriteBtn: document.getElementById('js-exercise-modal-favorites'),
    ratingBtn: document.getElementById('js-exercise-modal-rating-btn'),
  };
}

function handleClose() {
  closeExerciseModal();
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) {
    closeExerciseModal();
  }
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    closeExerciseModal();
  }
}

function handleFavoriteClick() {
  const exerciseId = currentExerciseIdForRating;
  if (!exerciseId) return;

  const wasAdded = toggleFavorite(exerciseId);
  updateFavoriteButton(exerciseId);

  if (!wasAdded && getCurrentPage() === 'favorites') {
    closeExerciseModal();
    loadFavoritesExercises();
  }
}

function handleRatingClick() {
  const exerciseId = currentExerciseIdForRating;
  if (!exerciseId) return;

  closeExerciseModal();
  openRatingModal(exerciseId, {
    onSuccess: () => openExerciseModal(exerciseId),
  });
}

function attachListeners() {
  if (listenersAttached) return;
  const elements = getModalElements();
  if (!elements) return;

  elements.closeBtn?.addEventListener('click', handleClose);
  elements.overlay?.addEventListener('click', handleOverlayClick);
  elements.favoriteBtn?.addEventListener('click', handleFavoriteClick);
  elements.ratingBtn?.addEventListener('click', handleRatingClick);
  document.addEventListener('keydown', handleKeydown);

  listenersAttached = true;
}

function detachListeners() {
  if (!listenersAttached) return;
  const elements = getModalElements();
  if (!elements) return;

  elements.closeBtn?.removeEventListener('click', handleClose);
  elements.overlay?.removeEventListener('click', handleOverlayClick);
  elements.favoriteBtn?.removeEventListener('click', handleFavoriteClick);
  elements.ratingBtn?.removeEventListener('click', handleRatingClick);
  document.removeEventListener('keydown', handleKeydown);

  listenersAttached = false;
}

function updateFavoriteButton(exerciseId) {
  const elements = getModalElements();
  if (!elements?.favoriteBtn) return;

  const isInFavorites = isFavorite(exerciseId);
  const btnText = elements.favoriteBtn.querySelector('span');
  const btnIcon = elements.favoriteBtn.querySelector('svg path');

  if (isInFavorites) {
    elements.favoriteBtn.classList.add('active');
    if (btnText) btnText.textContent = 'Remove from favorites';
    if (btnIcon) {
      btnIcon.setAttribute('fill', 'currentColor');
      btnIcon.removeAttribute('stroke');
      btnIcon.removeAttribute('stroke-width');
    }
  } else {
    elements.favoriteBtn.classList.remove('active');
    if (btnText) btnText.textContent = 'Add to favorites';
    if (btnIcon) {
      btnIcon.setAttribute('fill', 'none');
      btnIcon.setAttribute('stroke', 'currentColor');
      btnIcon.setAttribute('stroke-width', '2');
    }
  }
}

export function openExerciseModal(exerciseId) {
  const elements = getModalElements();
  if (!elements) return;

  currentExerciseIdForRating = exerciseId;

  elements.modal.classList.add('exercise-modal--open');
  document.body.style.overflow = 'hidden';

  attachListeners();

  if (elements.title) elements.title.textContent = 'Loading...';
  if (elements.ratingValue) elements.ratingValue.textContent = '0.0';
  if (elements.target) elements.target.textContent = '';
  if (elements.bodyPart) elements.bodyPart.textContent = '';
  if (elements.equipment) elements.equipment.textContent = '';
  if (elements.popular) elements.popular.textContent = '0';
  if (elements.calories) elements.calories.textContent = '0';
  if (elements.time) elements.time.textContent = '/0 min';
  if (elements.description) elements.description.textContent = '';
  if (elements.image) {
    elements.image.src = '';
    elements.image.classList.remove('is-hidden');
  }
  if (elements.video) {
    elements.video.src = '';
    elements.video.classList.remove('is-visible');
    elements.video.pause();
  }

  fetch(`https://your-energy.b.goit.study/api/exercises/${exerciseId}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch exercise details');
      }
      return response.json();
    })
    .then(exercise => {
      const videoUrl = exercise.videoUrl || exercise.video || exercise.videoURL;

      if (videoUrl && elements.video) {
        elements.video.src = videoUrl;
        elements.video.classList.add('is-visible');
        if (elements.image) {
          elements.image.classList.add('is-hidden');
        }
      } else if (elements.image) {
        elements.image.src = exercise.gifUrl || '';
      }

      if (elements.title) elements.title.textContent = exercise.name || '';
      if (elements.target) elements.target.textContent = exercise.target || '';
      if (elements.bodyPart)
        elements.bodyPart.textContent = exercise.bodyPart || '';
      if (elements.equipment)
        elements.equipment.textContent = exercise.equipment || '';
      if (elements.popular)
        elements.popular.textContent = exercise.popularity || 0;
      if (elements.calories)
        elements.calories.textContent = exercise.burnedCalories || 0;
      if (elements.time)
        elements.time.textContent = `/${exercise.time || 0} min`;
      if (elements.description)
        elements.description.textContent = exercise.description || '';

      if (elements.ratingValue) {
        elements.ratingValue.textContent = (exercise.rating || 0).toFixed(1);
      }

      if (elements.ratingStars) {
        const stars = elements.ratingStars.querySelectorAll(
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

      updateFavoriteButton(exerciseId);
    })
    .catch(() => {
      if (elements.title) elements.title.textContent = 'Error loading exercise';
      if (elements.description)
        elements.description.textContent =
          'Failed to load exercise details. Please try again later.';
    });
}

export function closeExerciseModal() {
  const elements = getModalElements();
  if (!elements) return;

  detachListeners();

  elements.modal.classList.remove('exercise-modal--open');
  document.body.style.overflow = '';
  currentExerciseIdForRating = null;

  if (elements.video) {
    elements.video.pause();
    elements.video.src = '';
    elements.video.classList.remove('is-visible');
  }
}

export function initExerciseModal() {
  getModalElements();
}

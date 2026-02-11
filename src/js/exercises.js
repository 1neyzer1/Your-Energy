import { openExerciseModal } from './exercise-modal.js';
import { getFavorites, removeFromFavorites } from './favorites.js';
import { showGlobalNotification } from './global-notification.js';
import { getExerciseById, getExercises, getFilters } from '../api.js';

let currentFilter = 'Muscles';
let currentPage = 1;
let currentCategory = null;
let currentSearchKeyword = '';
let currentMode = 'home';

const TABLET_MIN_WIDTH = 748;
const FILTER_PARAM_MAP = {
  Muscles: 'muscles',
  'Body parts': 'bodypart',
  Equipment: 'equipment',
};

const filtersCache = new Map();
const exercisesCache = new Map();

const requestState = {
  filters: { controller: null, requestId: 0 },
  exercises: { controller: null, requestId: 0 },
  favorites: { controller: null, requestId: 0 },
};

const getCardsContainer = () => document.getElementById('js-exercises-cards');
const getPaginationContainer = () =>
  document.querySelector('.exercises__content__pagination');
const getSearchForm = () => document.getElementById('js-exercises-search');
const getSearchInput = () =>
  document.getElementById('js-exercises-search-input');
const getHeading = () => document.getElementById('js-exercises-heading');
const getBreadcrumbs = () => document.getElementById('js-exercises-breadcrumbs');
const getContentContainer = () =>
  document.querySelector('.exercises__content');

function beginRequest(state) {
  if (state.controller) {
    state.controller.abort();
  }
  const controller = new AbortController();
  state.controller = controller;
  state.requestId += 1;
  return { controller, requestId: state.requestId };
}

function cancelRequest(state) {
  if (state.controller) {
    state.controller.abort();
  }
  state.controller = null;
  state.requestId += 1;
}

function isLatestRequest(state, requestId) {
  return state.requestId === requestId;
}

function isAbortError(error) {
  return error?.name === 'AbortError';
}

function isTabletViewport() {
  return window.matchMedia(`(min-width: ${TABLET_MIN_WIDTH}px)`).matches;
}

function getFiltersLimit() {
  return isTabletViewport() ? 12 : 9;
}

function getExercisesLimit() {
  return isTabletViewport() ? 10 : 8;
}

function getFiltersCache(filter, page, limit) {
  const filterCache = filtersCache.get(filter);
  if (!filterCache) {
    return null;
  }
  return filterCache.get(`${page}:${limit}`) || null;
}

function setFiltersCache(filter, page, limit, data) {
  if (!filtersCache.has(filter)) {
    filtersCache.set(filter, new Map());
  }
  filtersCache.get(filter).set(`${page}:${limit}`, data);
}

function getExercisesCache(key) {
  return exercisesCache.get(key) || null;
}

function setExercisesCache(key, data) {
  exercisesCache.set(key, data);
}

function setCardsBusy(isBusy) {
  const cardsContainer = getCardsContainer();
  if (!cardsContainer) return;
  cardsContainer.setAttribute('aria-busy', isBusy ? 'true' : 'false');
}

function showSearchField() {
  const searchField = getSearchForm();
  if (searchField) {
    searchField.classList.remove('exercises__content__header-search--hidden');
  }
}

function hideSearchField() {
  const searchField = getSearchForm();
  const searchInput = getSearchInput();
  if (searchField) {
    searchField.classList.add('exercises__content__header-search--hidden');
  }
  if (searchInput) {
    searchInput.value = '';
  }
  currentSearchKeyword = '';
}

function formatCategoryLabel(label) {
  if (!label) return '';
  const trimmed = label.trim();
  if (!trimmed) return label;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function createBreadcrumbEntry(node) {
  const entry = document.createElement('li');
  entry.className = 'exercises__content__header-breadcrumbs-entry';
  entry.appendChild(node);
  return entry;
}

function updateHeadingLabel(label) {
  const heading = getHeading();
  if (heading) {
    heading.textContent = label;
  }
}

export function updateBreadcrumbs(categoryName = null) {
  const breadcrumbsContainer = getBreadcrumbs();
  if (!breadcrumbsContainer) {
    return;
  }

  breadcrumbsContainer.innerHTML = '';

  if (currentMode === 'favorites') {
    updateHeadingLabel('Favorites');

    const favoritesTitle = document.createElement('span');
    favoritesTitle.className =
      'exercises__content__header-title exercises__content__header-breadcrumbs-current';
    favoritesTitle.textContent = 'Favorites';
    favoritesTitle.setAttribute('aria-current', 'page');
    breadcrumbsContainer.appendChild(createBreadcrumbEntry(favoritesTitle));
    return;
  }

  if (!categoryName) {
    updateHeadingLabel('Exercises');

    const exercisesTitle = document.createElement('span');
    exercisesTitle.className =
      'exercises__content__header-title exercises__content__header-breadcrumbs-current';
    exercisesTitle.textContent = 'Exercises';
    exercisesTitle.setAttribute('aria-current', 'page');
    breadcrumbsContainer.appendChild(createBreadcrumbEntry(exercisesTitle));
    return;
  }

  const categoryLabel = formatCategoryLabel(categoryName);
  updateHeadingLabel(`Exercises: ${categoryLabel}`);

  const exercisesBtn = document.createElement('button');
  exercisesBtn.className =
    'exercises__content__header-title exercises__content__header-breadcrumbs-item';
  exercisesBtn.textContent = 'Exercises';
  exercisesBtn.setAttribute('data-breadcrumb', 'exercises');
  exercisesBtn.type = 'button';
  exercisesBtn.addEventListener('click', () => {
    currentCategory = null;
    currentPage = 1;
    loadExerciseCards(currentFilter, currentPage);
  });
  breadcrumbsContainer.appendChild(createBreadcrumbEntry(exercisesBtn));

  const separator = document.createElement('span');
  separator.className = 'exercises__content__header-breadcrumbs-separator';
  separator.textContent = '/';
  separator.setAttribute('aria-hidden', 'true');
  breadcrumbsContainer.appendChild(createBreadcrumbEntry(separator));

  const categorySpan = document.createElement('span');
  categorySpan.className = 'exercises__content__header-breadcrumbs-current';
  categorySpan.textContent = categoryLabel;
  categorySpan.setAttribute('aria-current', 'page');
  breadcrumbsContainer.appendChild(createBreadcrumbEntry(categorySpan));
}

function setActiveFilter(filter) {
  currentFilter = filter;

  const filterButtons = document.querySelectorAll(
    '.exercises__content__header-filters-item'
  );
  filterButtons.forEach(button => {
    const isActive = button.getAttribute('data-filter') === filter;
    button.classList.toggle(
      'exercises__content__header-filters-item--active',
      isActive
    );
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

export function initFilters() {
  const filterButtons = document.querySelectorAll(
    '.exercises__content__header-filters-item'
  );

  if (!filterButtons.length) {
    return;
  }

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.getAttribute('data-filter');
      if (!filter) return;

      setActiveFilter(filter);
      currentCategory = null;
      currentSearchKeyword = '';
      loadExerciseCards(filter, 1);
    });
  });

  setActiveFilter(currentFilter);
}

function createCategoryCard(category) {
  const categoryName = category.name || '';
  const categoryFilter = category.filter || '';
  const imageUrl = category.imgURL || '';

  return `
    <li>
      <button
        class="exercises__content__main__cards-item exercise-card exercise-card--category"
        type="button"
        data-action="open-category"
        data-category-name="${categoryName}"
        aria-label="Open ${categoryName} category">
        <div class="exercises__content__main__cards-item-image exercise-card__image">
          <img src="${imageUrl}" alt="${categoryName} exercise" loading="lazy" decoding="async" />
          <div class="exercises__content__main__cards-item-overlay exercise-card__overlay">
            <div class="exercises__content__main__cards-item-overlay-name exercise-card__overlay-name">${categoryName}</div>
            <div class="exercises__content__main__cards-item-overlay-category exercise-card__overlay-category">${categoryFilter}</div>
          </div>
        </div>
      </button>
    </li>
  `;
}

function createExerciseCard(exercise) {
  const rating = exercise.rating || 0;
  const burnedCalories = exercise.burnedCalories || 0;
  const time = exercise.time || 0;
  const bodyPart = exercise.bodyPart || '';
  const target = exercise.target || '';
  const exerciseId = exercise._id || '';

  const removeButtonHTML =
    currentMode === 'favorites'
      ? `
      <button
        class="exercises__content__main__cards-item-remove exercise-card__remove"
        type="button"
        data-action="remove-favorite"
        aria-label="Remove from favorites">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
          <path d="M3 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M8 6V4H16V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M19 6L18 20H6L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10 10V16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M14 10V16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    `
      : '';

  return `
    <li>
      <article
        class="exercises__content__main__cards-item exercises__content__main__cards-item--exercise exercise-card exercise-card--exercise"
        data-exercise-id="${exerciseId}">
        <button
          class="exercises__content__main__cards-item-open exercise-card__open"
          type="button"
          data-action="open-exercise"
          aria-label="Open ${exercise.name}">
        </button>
        <div class="exercises__content__main__cards-item-header exercise-card__header">
          <span class="exercises__content__main__cards-item-workout-btn exercise-card__badge">WORKOUT</span>
          <div class="exercises__content__main__cards-item-rating exercise-card__rating">
            <span class="exercises__content__main__cards-item-rating-value exercise-card__rating-value">${rating.toFixed(
              1
            )}</span>
            <svg class="exercises__content__main__cards-item-rating-star exercise-card__rating-star" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <path d="M9 0L11.0206 6.21885L17.5595 6.21885L12.2694 10.0623L14.2901 16.2812L9 12.4377L3.70993 16.2812L5.73056 10.0623L0.440492 6.21885L6.97937 6.21885L9 0Z" fill="#EEA10C"/>
            </svg>
          </div>
          <button
            class="exercises__content__main__cards-item-start-btn exercise-card__start"
            type="button"
            data-action="open-exercise">
            Start
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <path d="M6.75 4.5L11.25 9L6.75 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="exercises__content__main__cards-item-body exercise-card__body">
          <div class="exercises__content__main__cards-item-icon exercise-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="exercises__content__main__cards-item-title exercise-card__title">${exercise.name}</h3>
        </div>
        <ul class="exercises__content__main__cards-item-footer exercise-card__meta">
          <li class="exercises__content__main__cards-item-info exercise-card__meta-item">
            <span class="exercises__content__main__cards-item-info-label exercise-card__meta-label">Burned calories:</span>
            <span class="exercises__content__main__cards-item-info-value exercise-card__meta-value">${burnedCalories}</span>
            <span class="exercises__content__main__cards-item-info-label exercise-card__meta-label">/ ${time} min</span>
          </li>
          <li class="exercises__content__main__cards-item-info exercise-card__meta-item">
            <span class="exercises__content__main__cards-item-info-label exercise-card__meta-label">Body part:</span>
            <span class="exercises__content__main__cards-item-info-value exercise-card__meta-value">${bodyPart}</span>
          </li>
          <li class="exercises__content__main__cards-item-info exercise-card__meta-item">
            <span class="exercises__content__main__cards-item-info-label exercise-card__meta-label">Target:</span>
            <span class="exercises__content__main__cards-item-info-value exercise-card__meta-value">${target}</span>
          </li>
        </ul>
        ${removeButtonHTML}
      </article>
    </li>
  `;
}

function renderCategoryCards(categories) {
  const cardsContainer = getCardsContainer();
  if (!cardsContainer) return;

  cardsContainer.classList.remove(
    'exercises__content__main__cards--exercises',
    'exercise-cards--exercises'
  );
  cardsContainer.innerHTML = categories.map(createCategoryCard).join('');
}

function renderExerciseCards(exercises) {
  const cardsContainer = getCardsContainer();
  if (!cardsContainer) return;

  cardsContainer.classList.add(
    'exercises__content__main__cards--exercises',
    'exercise-cards--exercises'
  );
  cardsContainer.innerHTML = exercises.map(createExerciseCard).join('');
}

function renderEmptyState(message) {
  const cardsContainer = getCardsContainer();
  if (!cardsContainer) return;

  cardsContainer.classList.add(
    'exercises__content__main__cards--exercises',
    'exercise-cards--exercises'
  );
  cardsContainer.innerHTML = `
    <li class="exercises__content__main__empty-state">
      <p class="exercises__content__main__empty-state-text">
        ${message}
      </p>
    </li>
  `;
}

function renderCategoriesEmptyState() {
  renderEmptyState('Unfortunately, no categories were found for this filter.');
}

function renderExercisesEmptyState() {
  renderEmptyState(
    'Unfortunately, no results were found. You may want to consider other search options.'
  );
}

function renderFavoritesEmptyState() {
  renderEmptyState(
    "It appears that you haven't added any exercises to your favorites yet. To get started, you can add exercises that you like to your favorites for easier access in the future."
  );
}

function renderCategoryResponse(data, page) {
  const categories = data?.results || data?.exercises || data || [];
  const totalPages =
    data?.totalPages || data?.total_pages || data?.pageCount || 1;

  updateBreadcrumbs(null);

  if (Array.isArray(categories) && categories.length > 0) {
    renderCategoryCards(categories);
    renderPagination(totalPages, page);
  } else {
    renderCategoriesEmptyState();
    renderPagination(1, 1);
  }
}

function renderExercisesResponse(data, page, categoryName) {
  const exercises = data?.results || [];
  const totalPages = data?.totalPages || 1;

  updateBreadcrumbs(categoryName);

  if (Array.isArray(exercises) && exercises.length > 0) {
    renderExerciseCards(exercises);
    renderPagination(totalPages, page);
  } else {
    renderExercisesEmptyState();
    renderPagination(1, 1);
  }
}

function renderPagination(totalPages, page = 1) {
  const paginationContainer = getPaginationContainer();
  if (!paginationContainer) {
    return;
  }

  paginationContainer.innerHTML = '';
  paginationContainer.setAttribute('role', 'navigation');
  paginationContainer.setAttribute('aria-label', 'Pagination');

  if (totalPages <= 1) {
    return;
  }

  const fragment = document.createDocumentFragment();

  const goToPage = pageNumber => {
    currentPage = pageNumber;
    if (currentCategory) {
      loadExercisesByCategory(currentCategory, pageNumber, currentSearchKeyword);
    } else {
      loadExerciseCards(currentFilter, pageNumber);
    }
  };

  const createArrowButton = (label, disabled, onClick) => {
    const button = document.createElement('button');
    button.className = 'exercises__content__pagination-arrow';
    button.type = 'button';
    button.innerHTML = label;
    button.disabled = disabled;
    button.addEventListener('click', onClick);
    return button;
  };

  fragment.appendChild(
    createArrowButton('&laquo;', page === 1, () => goToPage(1))
  );
  fragment.appendChild(
    createArrowButton('&lsaquo;', page === 1, () => goToPage(page - 1))
  );

  const createPageButton = pageNumber => {
    const pageButton = document.createElement('button');
    pageButton.className = 'exercises__content__pagination-page';
    pageButton.type = 'button';
    pageButton.textContent = pageNumber;

    if (pageNumber === page) {
      pageButton.classList.add('exercises__content__pagination-page--active');
      pageButton.setAttribute('aria-current', 'page');
    }

    pageButton.addEventListener('click', () => goToPage(pageNumber));
    return pageButton;
  };

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      fragment.appendChild(createPageButton(i));
    }
  } else {
    fragment.appendChild(createPageButton(1));
    fragment.appendChild(createPageButton(2));
    fragment.appendChild(createPageButton(3));

    const ellipsis = document.createElement('span');
    ellipsis.className = 'exercises__content__pagination-ellipsis';
    ellipsis.textContent = '...';
    fragment.appendChild(ellipsis);

    fragment.appendChild(createPageButton(totalPages - 1));
    fragment.appendChild(createPageButton(totalPages));
  }

  fragment.appendChild(
    createArrowButton('&rsaquo;', page === totalPages, () => goToPage(page + 1))
  );
  fragment.appendChild(
    createArrowButton('&raquo;', page === totalPages, () => goToPage(totalPages))
  );

  paginationContainer.appendChild(fragment);
}

export async function loadExerciseCards(filter, page = 1) {
  if (currentMode === 'favorites') {
    return;
  }

  const filtersLimit = getFiltersLimit();
  setActiveFilter(filter);
  currentPage = page;
  currentCategory = null;
  currentSearchKeyword = '';

  hideSearchField();
  cancelRequest(requestState.exercises);

  const { controller, requestId } = beginRequest(requestState.filters);
  const cached = getFiltersCache(filter, page, filtersLimit);

  if (cached) {
    renderCategoryResponse(cached, page);
    if (isLatestRequest(requestState.filters, requestId)) {
      setCardsBusy(false);
    }
    return;
  }

  setCardsBusy(true);

  try {
    const data = await getFilters({
      filter,
      page,
      limit: filtersLimit,
      signal: controller.signal,
    });

    if (!isLatestRequest(requestState.filters, requestId)) {
      return;
    }

    if (currentMode === 'favorites') {
      return;
    }

    setFiltersCache(filter, page, filtersLimit, data);
    renderCategoryResponse(data, page);
  } catch (error) {
    if (!isLatestRequest(requestState.filters, requestId) || isAbortError(error)) {
      return;
    }

    updateBreadcrumbs(null);
    renderCategoriesEmptyState();
    renderPagination(1, 1);
    showGlobalNotification(
      error.message || 'Failed to load categories.',
      'error'
    );
  } finally {
    if (isLatestRequest(requestState.filters, requestId)) {
      setCardsBusy(false);
    }
  }
}

export async function loadExercisesByCategory(
  categoryName,
  page = 1,
  keyword = currentSearchKeyword
) {
  if (currentMode === 'favorites') {
    return;
  }

  const exercisesLimit = getExercisesLimit();
  currentCategory = categoryName;
  currentPage = page;
  currentSearchKeyword = keyword?.trim() || '';

  showSearchField();
  cancelRequest(requestState.filters);

  const paramName = FILTER_PARAM_MAP[currentFilter] || 'muscles';
  const cacheKey = `${paramName}:${categoryName}:${page}:${exercisesLimit}:${currentSearchKeyword}`;

  const { controller, requestId } = beginRequest(requestState.exercises);
  const cached = getExercisesCache(cacheKey);

  if (cached) {
    renderExercisesResponse(cached, page, categoryName);
    if (isLatestRequest(requestState.exercises, requestId)) {
      setCardsBusy(false);
    }
    return;
  }

  setCardsBusy(true);

  try {
    const data = await getExercises({
      [paramName]: categoryName,
      page,
      limit: exercisesLimit,
      keyword: currentSearchKeyword,
      signal: controller.signal,
    });

    if (!isLatestRequest(requestState.exercises, requestId)) {
      return;
    }

    if (currentMode === 'favorites') {
      return;
    }

    setExercisesCache(cacheKey, data);
    renderExercisesResponse(data, page, categoryName);
  } catch (error) {
    if (
      !isLatestRequest(requestState.exercises, requestId) ||
      isAbortError(error)
    ) {
      return;
    }

    renderExercisesEmptyState();
    renderPagination(1, 1);
    showGlobalNotification(
      error.message || 'Failed to load exercises.',
      'error'
    );
  } finally {
    if (isLatestRequest(requestState.exercises, requestId)) {
      setCardsBusy(false);
    }
  }
}

export function initSearch() {
  const searchForm = getSearchForm();
  const searchInput = getSearchInput();

  if (!searchForm || !searchInput) {
    return;
  }

  searchForm.addEventListener('submit', event => {
    event.preventDefault();

    if (!currentCategory || currentMode === 'favorites') {
      return;
    }

    const keyword = searchInput.value.trim();
    loadExercisesByCategory(currentCategory, 1, keyword);
  });
}

export async function loadFavoritesExercises() {
  const favoriteIds = getFavorites();
  const paginationContainer = getPaginationContainer();

  updateBreadcrumbs(null);

  if (paginationContainer) {
    paginationContainer.innerHTML = '';
  }

  if (favoriteIds.length === 0) {
    cancelRequest(requestState.favorites);
    renderFavoritesEmptyState();
    return;
  }

  const { controller, requestId } = beginRequest(requestState.favorites);
  setCardsBusy(true);

  try {
    const results = await Promise.allSettled(
      favoriteIds.map(id =>
        getExerciseById(id, { signal: controller.signal })
      )
    );

    if (
      !isLatestRequest(requestState.favorites, requestId) ||
      currentMode !== 'favorites'
    ) {
      return;
    }

    const validExercises = results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);

    if (validExercises.length > 0) {
      renderExerciseCards(validExercises);
    } else {
      renderFavoritesEmptyState();
    }
  } catch (error) {
    if (
      !isLatestRequest(requestState.favorites, requestId) ||
      isAbortError(error)
    ) {
      return;
    }
    renderFavoritesEmptyState();
    showGlobalNotification(
      error.message || 'Failed to load favorite exercises.',
      'error'
    );
  } finally {
    if (isLatestRequest(requestState.favorites, requestId)) {
      setCardsBusy(false);
    }
  }
}

export function initCardsEventListener() {
  const cardsContainer = getCardsContainer();

  if (!cardsContainer) {
    return;
  }

  cardsContainer.addEventListener('click', event => {
    const removeButton = event.target.closest('[data-action="remove-favorite"]');
    if (removeButton) {
      event.preventDefault();
      const card = removeButton.closest('[data-exercise-id]');
      const exerciseId = card?.getAttribute('data-exercise-id');

      if (exerciseId) {
        removeFromFavorites(exerciseId);

        if (currentMode === 'favorites') {
          const listItem = removeButton.closest('li');
          if (listItem) {
            listItem.remove();
          }

          if (!getCardsContainer()?.children.length) {
            renderFavoritesEmptyState();
          }
        }
      }
      return;
    }

    const categoryButton = event.target.closest('[data-action="open-category"]');
    if (categoryButton) {
      const categoryName = categoryButton.getAttribute('data-category-name');
      if (categoryName) {
        loadExercisesByCategory(categoryName, 1);
      }
      return;
    }

    const openButton = event.target.closest('[data-action="open-exercise"]');
    if (openButton) {
      const card = openButton.closest('[data-exercise-id]');
      const exerciseId = card?.getAttribute('data-exercise-id');
      if (exerciseId) {
        openExerciseModal(exerciseId);
      }
    }
  });
}

export function switchToHome() {
  currentMode = 'home';
  currentCategory = null;
  currentSearchKeyword = '';
  cancelRequest(requestState.favorites);

  const contentContainer = getContentContainer();
  if (contentContainer) {
    contentContainer.classList.remove('exercises__content--favorites');
  }

  loadExerciseCards(currentFilter, 1);
}

export function switchToFavorites() {
  currentMode = 'favorites';
  currentCategory = null;
  currentSearchKeyword = '';

  hideSearchField();
  cancelRequest(requestState.filters);
  cancelRequest(requestState.exercises);
  setCardsBusy(false);

  const contentContainer = getContentContainer();
  if (contentContainer) {
    contentContainer.classList.add('exercises__content--favorites');
  }

  loadFavoritesExercises();
}

export function getCurrentFilter() {
  return currentFilter;
}

export function setFilter(filter) {
  setActiveFilter(filter);
}

export function getCurrentMode() {
  return currentMode;
}

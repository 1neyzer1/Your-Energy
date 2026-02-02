import { openExerciseModal } from './exercise-modal.js';
import { getFavorites } from './favorites.js';

// Глобальні змінні для фільтра та сторінки
let currentFilter = 'Muscles';
let currentPage = 1;
let currentCategory = null;
let currentSearchKeyword = '';
let currentMode = 'home'; // 'home' або 'favorites'

// Функція для показу поля пошуку
function showSearchField() {
  const searchField = document.getElementById('js-exercises-search');
  if (searchField) {
    searchField.style.display = 'flex';
  }
}

// Функція для приховування поля пошуку
function hideSearchField() {
  const searchField = document.getElementById('js-exercises-search');
  const searchInput = document.getElementById('js-exercises-search-input');
  if (searchField) {
    searchField.style.display = 'none';
  }
  if (searchInput) {
    searchInput.value = '';
  }
  currentSearchKeyword = '';
}

// Функція для ініціалізації слухача подій на контейнері карток (event delegation)
export function initCardsEventListener() {
  const cardsContainer = document.querySelector(
    '.exercises__content__main__cards'
  );

  if (!cardsContainer) {
    return;
  }

  // Один слухач на весь контейнер замість багатьох на кожній картці
  cardsContainer.addEventListener('click', event => {
    // Знаходимо найближчу картку від місця кліку
    const card = event.target.closest('.exercises__content__main__cards-item');

    if (!card) {
      return;
    }

    // Перевіряємо, чи це картка категорії
    const categoryName = card.getAttribute('data-category-name');
    if (categoryName) {
      loadExercisesByCategory(categoryName);
      return;
    }

    // Перевіряємо, чи це картка вправи
    const exerciseId = card.getAttribute('data-exercise-id');
    if (exerciseId) {
      openExerciseModal(exerciseId);
      return;
    }
  });
}

// Функція для створення HTML картки категорії
function createExerciseCard(exercise) {
  return `
    <div class="exercises__content__main__cards-item" data-category-name="${exercise.name}">
      <div class="exercises__content__main__cards-item-image">
        <img src="${exercise.imgURL}" alt="${exercise.name} exercise" />
        <div class="exercises__content__main__cards-item-overlay">
          <div class="exercises__content__main__cards-item-overlay-name">${exercise.name}</div>
          <div class="exercises__content__main__cards-item-overlay-category">${exercise.filter}</div>
        </div>
      </div>
    </div>
  `;
}

// Функція для створення HTML картки вправи
function createExerciseItemCard(exercise) {
  const rating = exercise.rating || 0;
  const burnedCalories = exercise.burnedCalories || 0;
  const time = exercise.time || 0;
  const bodyPart = exercise.bodyPart || '';
  const target = exercise.target || '';
  const exerciseId = exercise._id || '';

  return `
    <div class="exercises__content__main__cards-item exercises__content__main__cards-item--exercise" data-exercise-id="${exerciseId}">
      <div class="exercises__content__main__cards-item-header">
        <button class="exercises__content__main__cards-item-workout-btn">WORKOUT</button>
        <div class="exercises__content__main__cards-item-rating">
          <span class="exercises__content__main__cards-item-rating-value">${rating.toFixed(
            1
          )}</span>
          <svg class="exercises__content__main__cards-item-rating-star" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 0L11.0206 6.21885L17.5595 6.21885L12.2694 10.0623L14.2901 16.2812L9 12.4377L3.70993 16.2812L5.73056 10.0623L0.440492 6.21885L6.97937 6.21885L9 0Z" fill="#EEA10C"/>
          </svg>
        </div>
        <button class="exercises__content__main__cards-item-start-btn">
          Start
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.75 4.5L11.25 9L6.75 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div class="exercises__content__main__cards-item-body">
        <div class="exercises__content__main__cards-item-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3 class="exercises__content__main__cards-item-title">${
          exercise.name
        }</h3>
      </div>
      <div class="exercises__content__main__cards-item-footer">
        <div class="exercises__content__main__cards-item-info">
          <span class="exercises__content__main__cards-item-info-label">Burned calories:</span>
          <span class="exercises__content__main__cards-item-info-value">${burnedCalories}</span>
          <span class="exercises__content__main__cards-item-info-label">/ ${time} min</span>
        </div>
        <div class="exercises__content__main__cards-item-info">
          <span class="exercises__content__main__cards-item-info-label">Body part:</span>
          <span class="exercises__content__main__cards-item-info-value">${bodyPart}</span>
        </div>
        <div class="exercises__content__main__cards-item-info">
          <span class="exercises__content__main__cards-item-info-label">Target:</span>
          <span class="exercises__content__main__cards-item-info-value">${target}</span>
        </div>
      </div>
    </div>
  `;
}

// Функція для рендерингу карток категорій
function renderExerciseCards(exercises) {
  const cardsContainer = document.querySelector(
    '.exercises__content__main__cards'
  );

  if (!cardsContainer) {
    return;
  }

  // Видаляємо клас для карток вправ (якщо був)
  cardsContainer.classList.remove('exercises__content__main__cards--exercises');

  // Очищаємо контейнер
  cardsContainer.innerHTML = '';

  // Рендеримо кожну картку
  exercises.forEach(exercise => {
    const cardHTML = createExerciseCard(exercise);
    cardsContainer.insertAdjacentHTML('beforeend', cardHTML);
  });
}

// Функція для рендерингу карток вправ
function renderExerciseItemCards(exercises) {
  const cardsContainer = document.querySelector(
    '.exercises__content__main__cards'
  );

  if (!cardsContainer) {
    return;
  }

  // Додаємо клас для карток вправ
  cardsContainer.classList.add('exercises__content__main__cards--exercises');

  // Очищаємо контейнер
  cardsContainer.innerHTML = '';

  // Рендеримо кожну картку
  exercises.forEach(exercise => {
    const cardHTML = createExerciseItemCard(exercise);
    cardsContainer.insertAdjacentHTML('beforeend', cardHTML);
  });
}

// Функція для відображення empty state
function renderEmptyState() {
  const cardsContainer = document.querySelector(
    '.exercises__content__main__cards'
  );

  if (!cardsContainer) {
    return;
  }

  // Додаємо клас для карток вправ
  cardsContainer.classList.add('exercises__content__main__cards--exercises');

  // Очищаємо контейнер
  cardsContainer.innerHTML = '';

  // Додаємо empty state
  const emptyStateHTML = `
    <div class="exercises__content__main__empty-state">
      <p class="exercises__content__main__empty-state-text">
        Unfortunately, no results were found. You may want to consider other search options.
      </p>
    </div>
  `;

  cardsContainer.insertAdjacentHTML('beforeend', emptyStateHTML);
}

// Функція для оновлення breadcrumbs
export function updateBreadcrumbs(categoryName = null) {
  const breadcrumbsContainer = document.getElementById(
    'js-exercises-breadcrumbs'
  );

  if (!breadcrumbsContainer) {
    return;
  }

  breadcrumbsContainer.innerHTML = '';

  // Якщо режим Favorites - показуємо тільки заголовок "Favorites"
  if (currentMode === 'favorites') {
    const favoritesTitle = document.createElement('button');
    favoritesTitle.className =
      'exercises__content__header-breadcrumbs-item exercises__content__header-breadcrumbs-item--active';
    favoritesTitle.textContent = 'Favorites';
    favoritesTitle.setAttribute('data-breadcrumb', 'favorites');
    breadcrumbsContainer.appendChild(favoritesTitle);
    return;
  }

  // Завжди додаємо "Exercises"
  const exercisesBtn = document.createElement('button');
  exercisesBtn.className = 'exercises__content__header-breadcrumbs-item';
  exercisesBtn.textContent = 'Exercises';
  exercisesBtn.setAttribute('data-breadcrumb', 'exercises');

  if (!categoryName) {
    exercisesBtn.classList.add(
      'exercises__content__header-breadcrumbs-item--active'
    );
  }

  exercisesBtn.addEventListener('click', () => {
    currentCategory = null;
    currentPage = 1;
    loadExerciseCards(currentFilter, currentPage);
  });

  breadcrumbsContainer.appendChild(exercisesBtn);

  // Якщо є категорія, додаємо її
  if (categoryName) {
    const separator = document.createElement('span');
    separator.className = 'exercises__content__header-breadcrumbs-separator';
    separator.textContent = '/';
    breadcrumbsContainer.appendChild(separator);

    const categoryBtn = document.createElement('button');
    categoryBtn.className =
      'exercises__content__header-breadcrumbs-item exercises__content__header-breadcrumbs-item--active';
    categoryBtn.textContent = categoryName;
    breadcrumbsContainer.appendChild(categoryBtn);
  }
}

// Функція для рендерингу пагінації
function renderPagination(totalPages, page = 1) {
  const paginationContainer = document.querySelector(
    '.exercises__content__pagination'
  );

  if (!paginationContainer) {
    return;
  }

  // Очищаємо контейнер
  paginationContainer.innerHTML = '';

  // Якщо лише одна сторінка - не відображаємо пагінацію
  if (totalPages === 1) {
    return;
  }

  // Функція для переходу на сторінку
  const goToPage = pageNumber => {
    currentPage = pageNumber;
    if (currentCategory) {
      loadExercisesByCategory(currentCategory, pageNumber);
    } else {
      loadExerciseCards(currentFilter, pageNumber);
    }
  };

  // Кнопка "На першу сторінку"
  const firstButton = document.createElement('button');
  firstButton.className = 'exercises__content__pagination-arrow';
  firstButton.innerHTML = '&laquo;';
  firstButton.disabled = page === 1;
  firstButton.addEventListener('click', () => goToPage(1));
  paginationContainer.appendChild(firstButton);

  // Кнопка "Попередня сторінка"
  const prevButton = document.createElement('button');
  prevButton.className = 'exercises__content__pagination-arrow';
  prevButton.innerHTML = '&lsaquo;';
  prevButton.disabled = page === 1;
  prevButton.addEventListener('click', () => goToPage(page - 1));
  paginationContainer.appendChild(prevButton);

  // Функція для створення кнопки сторінки
  const createPageButton = pageNumber => {
    const pageButton = document.createElement('button');
    pageButton.className = 'exercises__content__pagination-page';
    pageButton.textContent = pageNumber;

    if (pageNumber === page) {
      pageButton.classList.add('exercises__content__pagination-page--active');
    }

    pageButton.addEventListener('click', () => goToPage(pageNumber));
    return pageButton;
  };

  // Логіка відображення номерів сторінок
  if (totalPages <= 5) {
    // Відображаємо всі сторінки
    for (let i = 1; i <= totalPages; i++) {
      paginationContainer.appendChild(createPageButton(i));
    }
  } else {
    // Відображаємо 1, 2, 3, ..., передостання, остання
    paginationContainer.appendChild(createPageButton(1));
    paginationContainer.appendChild(createPageButton(2));
    paginationContainer.appendChild(createPageButton(3));

    // Додаємо ellipsis
    const ellipsis = document.createElement('span');
    ellipsis.className = 'exercises__content__pagination-ellipsis';
    ellipsis.textContent = '...';
    paginationContainer.appendChild(ellipsis);

    // Передостання сторінка
    paginationContainer.appendChild(createPageButton(totalPages - 1));

    // Остання сторінка
    paginationContainer.appendChild(createPageButton(totalPages));
  }

  // Кнопка "Наступна сторінка"
  const nextButton = document.createElement('button');
  nextButton.className = 'exercises__content__pagination-arrow';
  nextButton.innerHTML = '&rsaquo;';
  nextButton.disabled = page === totalPages;
  nextButton.addEventListener('click', () => goToPage(page + 1));
  paginationContainer.appendChild(nextButton);

  // Кнопка "На останню сторінку"
  const lastButton = document.createElement('button');
  lastButton.className = 'exercises__content__pagination-arrow';
  lastButton.innerHTML = '&raquo;';
  lastButton.disabled = page === totalPages;
  lastButton.addEventListener('click', () => goToPage(totalPages));
  paginationContainer.appendChild(lastButton);
}

// Функція для завантаження карток категорій
export function loadExerciseCards(filter, page = 1) {
  currentFilter = filter;
  currentPage = page;

  // Приховуємо поле пошуку при переході до списку категорій
  hideSearchField();

  // Кодуємо параметри для безпечного передавання в URL
  const encodedFilter = encodeURIComponent(filter);
  const url = `https://your-energy.b.goit.study/api/filters?filter=${encodedFilter}&page=${page}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      // Припускаємо, що API повертає масив exercises або об'єкт з полем results/exercises
      const exercises = data.results || data.exercises || data || [];

      // Отримуємо загальну кількість сторінок
      const totalPages =
        data.totalPages || data.total_pages || data.pageCount || 1;

      if (Array.isArray(exercises) && exercises.length > 0) {
        currentCategory = null; // Скидаємо поточну категорію
        updateBreadcrumbs(null);
        renderExerciseCards(exercises);
        renderPagination(totalPages, page);
      } else {
        updateBreadcrumbs(null);
        renderPagination(1, 1);
      }
    })
}

// Функція для завантаження вправ за категорією
export function loadExercisesByCategory(
  categoryName,
  page = 1,
  keyword = currentSearchKeyword
) {
  currentCategory = categoryName;
  currentPage = page;
  currentSearchKeyword = keyword;

  // Показуємо поле пошуку
  showSearchField();

  // Визначаємо параметр залежно від типу фільтра
  let paramName = '';
  if (currentFilter === 'Muscles') {
    paramName = 'muscles';
  } else if (currentFilter === 'Body parts') {
    paramName = 'bodyPart';
  } else if (currentFilter === 'Equipment') {
    paramName = 'equipment';
  }

  // Кодуємо параметри для безпечного передавання в URL
  const encodedCategory = encodeURIComponent(categoryName);
  let url = `https://your-energy.b.goit.study/api/exercises?${paramName}=${encodedCategory}&page=${page}&limit=10`;

  // Додаємо параметр пошуку якщо він є
  if (keyword && keyword.trim() !== '') {
    const encodedKeyword = encodeURIComponent(keyword.trim());
    url += `&keyword=${encodedKeyword}`;
  }

  fetch(url)
    .then(response => response.json())
    .then(data => {
      // Отримуємо масив вправ
      const exercises = data.results || [];

      // Отримуємо загальну кількість сторінок
      const totalPages = data.totalPages || 1;

      updateBreadcrumbs(categoryName);

      if (Array.isArray(exercises) && exercises.length > 0) {
        renderExerciseItemCards(exercises);
        renderPagination(totalPages, page);
      } else {
        // Показуємо empty state
        renderEmptyState();
        // Приховуємо пагінацію
        const paginationContainer = document.querySelector(
          '.exercises__content__pagination'
        );
        if (paginationContainer) {
          paginationContainer.innerHTML = '';
        }
      }
    })
}

// Функція для ініціалізації обробників пошуку
export function initSearch() {
  const searchInput = document.getElementById('js-exercises-search-input');

  if (!searchInput) {
    return;
  }

  let searchTimeout = null;

  // Обробка введення тексту з затримкою 1 секунда
  searchInput.addEventListener('input', () => {
    // Очищаємо попередній таймер
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Встановлюємо новий таймер
    searchTimeout = setTimeout(() => {
      const keyword = searchInput.value.trim();
      if (currentCategory) {
        loadExercisesByCategory(currentCategory, 1, keyword);
      }
    }, 1000);
  });
}

// Функція для відображення empty state для favorites
function renderFavoritesEmptyState() {
  const cardsContainer = document.querySelector(
    '.exercises__content__main__cards'
  );

  if (!cardsContainer) {
    return;
  }

  // Додаємо клас для карток вправ
  cardsContainer.classList.add('exercises__content__main__cards--exercises');

  // Очищаємо контейнер
  cardsContainer.innerHTML = '';

  // Додаємо empty state
  const emptyStateHTML = `
    <div class="exercises__content__main__empty-state">
      <p class="exercises__content__main__empty-state-text">
        It appears that you haven't added any exercises to your favorites yet. 
        To get started, you can add exercises that you like to your favorites 
        for easier access in the future.
      </p>
    </div>
  `;

  cardsContainer.insertAdjacentHTML('beforeend', emptyStateHTML);
}

// Функція для завантаження вправ з обраного
export function loadFavoritesExercises() {
  const favoriteIds = getFavorites();

  // Оновлюємо breadcrumbs
  updateBreadcrumbs(null);

  // Приховуємо пагінацію
  const paginationContainer = document.querySelector(
    '.exercises__content__pagination'
  );
  if (paginationContainer) {
    paginationContainer.innerHTML = '';
  }

  // Якщо немає обраних вправ
  if (favoriteIds.length === 0) {
    renderFavoritesEmptyState();
    return;
  }

  // Завантажуємо деталі кожної вправи
  const promises = favoriteIds.map(id =>
    fetch(`https://your-energy.b.goit.study/api/exercises/${id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch exercise');
        }
        return response.json();
      })
      .catch(error => {
        return null;
      })
  );

  Promise.all(promises).then(exercises => {
    // Фільтруємо null значення (вправи, які не вдалося завантажити)
    const validExercises = exercises.filter(ex => ex !== null);

    if (validExercises.length > 0) {
      renderExerciseItemCards(validExercises);
    } else {
      renderFavoritesEmptyState();
    }
  });
}

// Функція для перемикання в режим Home
export function switchToHome() {
  currentMode = 'home';
  currentCategory = null;
  currentSearchKeyword = '';

  // Показуємо фільтри
  const filtersContainer = document.querySelector(
    '.exercises__content__header-filters'
  );
  if (filtersContainer) {
    filtersContainer.style.display = 'flex';
  }

  // Видаляємо клас favorites з контейнера
  const contentContainer = document.querySelector('.exercises__content');
  if (contentContainer) {
    contentContainer.classList.remove('exercises__content--favorites');
  }

  // Завантажуємо стандартні картки
  loadExerciseCards(currentFilter, 1);
}

// Функція для перемикання в режим Favorites
export function switchToFavorites() {
  currentMode = 'favorites';
  currentCategory = null;
  currentSearchKeyword = '';

  // Приховуємо фільтри та пошук
  const filtersContainer = document.querySelector(
    '.exercises__content__header-filters'
  );
  if (filtersContainer) {
    filtersContainer.style.display = 'none';
  }

  hideSearchField();

  // Додаємо клас favorites до контейнера
  const contentContainer = document.querySelector('.exercises__content');
  if (contentContainer) {
    contentContainer.classList.add('exercises__content--favorites');
  }

  // Завантажуємо обрані вправи
  loadFavoritesExercises();
}

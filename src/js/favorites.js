const FAVORITES_KEY = 'your-energy:favorites';
const LEGACY_FAVORITES_KEY = 'favorites';

export function safeJsonParse(value, fallback) {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

export function loadFavorites() {
  try {
    const stored = safeJsonParse(localStorage.getItem(FAVORITES_KEY), null);
    const favorites = new Set();

    if (Array.isArray(stored)) {
      stored.forEach(id => {
        if (id !== null && id !== undefined && id !== '') {
          favorites.add(String(id));
        }
      });
      return favorites;
    }

    const legacy = safeJsonParse(
      localStorage.getItem(LEGACY_FAVORITES_KEY),
      null
    );

    if (Array.isArray(legacy)) {
      legacy.forEach(id => {
        if (id !== null && id !== undefined && id !== '') {
          favorites.add(String(id));
        }
      });
      saveFavorites(favorites);
      localStorage.removeItem(LEGACY_FAVORITES_KEY);
    }

    return favorites;
  } catch (error) {
    return new Set();
  }
}

export function saveFavorites(favorites) {
  try {
    const normalized = Array.from(favorites || []).map(id => String(id));
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(normalized));
    localStorage.removeItem(LEGACY_FAVORITES_KEY);
  } catch (error) {
    // Ignore write errors to keep UX responsive.
  }
}

export function getFavorites() {
  return Array.from(loadFavorites());
}

export function addToFavorites(exerciseId) {
  try {
    const favorites = loadFavorites();
    const id = String(exerciseId);
    if (!favorites.has(id)) {
      favorites.add(id);
      saveFavorites(favorites);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

export function removeFromFavorites(exerciseId) {
  try {
    const favorites = loadFavorites();
    const id = String(exerciseId);
    if (favorites.has(id)) {
      favorites.delete(id);
      saveFavorites(favorites);
    }
    return true;
  } catch (error) {
    return false;
  }
}

export function isFavorite(exerciseId) {
  const favorites = loadFavorites();
  return favorites.has(String(exerciseId));
}

export function toggleFavorite(exerciseId) {
  if (isFavorite(exerciseId)) {
    removeFromFavorites(exerciseId);
    return false;
  }
  addToFavorites(exerciseId);
  return true;
}

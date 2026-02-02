// LocalStorage key for favorites
const FAVORITES_KEY = 'favorites';

// Get all favorite exercise IDs from LocalStorage
export function getFavorites() {
  try {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    return [];
  }
}

// Add exercise ID to favorites
export function addToFavorites(exerciseId) {
  try {
    const favorites = getFavorites();
    if (!favorites.includes(exerciseId)) {
      favorites.push(exerciseId);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

// Remove exercise ID from favorites
export function removeFromFavorites(exerciseId) {
  try {
    const favorites = getFavorites();
    const filteredFavorites = favorites.filter(id => id !== exerciseId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filteredFavorites));
    return true;
  } catch (error) {
    return false;
  }
}

// Check if exercise is in favorites
export function isFavorite(exerciseId) {
  const favorites = getFavorites();
  return favorites.includes(exerciseId);
}

// Toggle favorite status (add if not exists, remove if exists)
export function toggleFavorite(exerciseId) {
  if (isFavorite(exerciseId)) {
    removeFromFavorites(exerciseId);
    return false; // removed
  } else {
    addToFavorites(exerciseId);
    return true; // added
  }
}


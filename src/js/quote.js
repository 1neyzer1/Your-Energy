import { getQuote } from '../api.js';
import { showGlobalNotification } from './global-notification.js';

const QUOTE_KEY = 'your-energy:quote';
const LEGACY_QUOTE_KEYS = {
  text: 'quote-text',
  author: 'quote-author',
  date: 'quote-date',
};

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function safeJsonParse(value, fallback) {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function loadQuote() {
  try {
    const stored = safeJsonParse(localStorage.getItem(QUOTE_KEY), null);
    if (stored && typeof stored === 'object' && stored.quote && stored.author) {
      return stored;
    }

    const legacyQuote = {
      quote: localStorage.getItem(LEGACY_QUOTE_KEYS.text),
      author: localStorage.getItem(LEGACY_QUOTE_KEYS.author),
      date: localStorage.getItem(LEGACY_QUOTE_KEYS.date),
    };

    if (legacyQuote.quote && legacyQuote.author) {
      saveQuote(legacyQuote);
      localStorage.removeItem(LEGACY_QUOTE_KEYS.text);
      localStorage.removeItem(LEGACY_QUOTE_KEYS.author);
      localStorage.removeItem(LEGACY_QUOTE_KEYS.date);
      return legacyQuote;
    }

    return null;
  } catch (error) {
    return null;
  }
}

function saveQuote(quote) {
  try {
    localStorage.setItem(QUOTE_KEY, JSON.stringify(quote));
    localStorage.removeItem(LEGACY_QUOTE_KEYS.text);
    localStorage.removeItem(LEGACY_QUOTE_KEYS.author);
    localStorage.removeItem(LEGACY_QUOTE_KEYS.date);
  } catch (error) {
    // Ignore write errors to keep UX responsive.
  }
}

// Function to load quote data with caching logic
async function loadQuoteOfTheDay() {
  const cachedQuote = loadQuote();
  const todayDate = getTodayDate();

  if (
    cachedQuote &&
    cachedQuote.quote &&
    cachedQuote.author &&
    cachedQuote.date === todayDate
  ) {
    return { quote: cachedQuote.quote, author: cachedQuote.author };
  }

  // Fetch new quote from API
  try {
    const data = await getQuote();
    const nextQuote = {
      quote: data?.quote,
      author: data?.author,
      date: todayDate,
    };

    if (nextQuote.quote && nextQuote.author) {
      saveQuote(nextQuote);
    }

    // Return the quote data
    return { quote: data?.quote, author: data?.author };
  } catch (error) {
    // If fetch fails but we have cached data, use it
    if (cachedQuote?.quote && cachedQuote?.author) {
      return { quote: cachedQuote.quote, author: cachedQuote.author };
    }

    // Return null if no data available
    if (!cachedQuote?.quote || !cachedQuote?.author) {
      showGlobalNotification('Failed to load quote of the day.', 'error');
    }
    return null;
  }
}

// Function to display quote in DOM
export async function displayQuote() {
  const quoteData = await loadQuoteOfTheDay();

  if (!quoteData) {
    return;
  }

  const quoteTextElement = document.getElementById('js-exercises-quote-text');
  const quoteAuthorElement = document.getElementById(
    'js-exercises-quote-author'
  );

  if (quoteTextElement) {
    quoteTextElement.textContent = quoteData.quote;
  }

  if (quoteAuthorElement) {
    quoteAuthorElement.textContent = quoteData.author;
  }
}

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Function to load quote data with caching logic
async function loadQuoteOfTheDay() {
  const cachedQuoteText = localStorage.getItem('quote-text');
  const cachedQuoteAuthor = localStorage.getItem('quote-author');
  const cachedQuoteDate = localStorage.getItem('quote-date');
  const todayDate = getTodayDate();

  // Check if cached data exists
  if (cachedQuoteText && cachedQuoteAuthor && cachedQuoteDate) {
    // Compare dates
    if (cachedQuoteDate === todayDate) {
      // Return cached data if date matches
      return { quote: cachedQuoteText, author: cachedQuoteAuthor };
    }
  }

  // Fetch new quote from API
  try {
    const response = await fetch('https://your-energy.b.goit.study/api/quote');
    const data = await response.json();

    // Save to localStorage
    localStorage.setItem('quote-text', data.quote);
    localStorage.setItem('quote-author', data.author);
    localStorage.setItem('quote-date', todayDate);

    // Return the quote data
    return { quote: data.quote, author: data.author };
  } catch (error) {
    // If fetch fails but we have cached data, use it
    if (cachedQuoteText && cachedQuoteAuthor) {
      return { quote: cachedQuoteText, author: cachedQuoteAuthor };
    }

    // Return null if no data available
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

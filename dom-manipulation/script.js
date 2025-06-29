// Initial quotes data
let quotes = [
  { text: "The only way to do great work is to love what you do.", category: "inspiration" },
  { text: "Innovation distinguishes between a leader and a follower.", category: "business" },
  { text: "Your time is limited, don't waste it living someone else's life.", category: "life" },
  { text: "Stay hungry, stay foolish.", category: "motivation" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", category: "life" }
];

// DOM elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const showFormBtn = document.getElementById('showForm');
const addQuoteForm = document.getElementById('addQuoteForm');
const categorySelect = document.getElementById('categorySelect');

// Initialize the application
function init() {
  // Display a random quote on page load
  showRandomQuote();
  
  // Set up event listeners
  newQuoteBtn.addEventListener('click', showRandomQuote);
  showFormBtn.addEventListener('click', toggleAddQuoteForm);
  
  // Populate category filter
  updateCategoryFilter();
}

// Display a random quote
function showRandomQuote() {
  const selectedCategory = categorySelect.value;
  let filteredQuotes = quotes;
  
  if (selectedCategory !== 'all') {
    filteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
  }
  
  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = '<p>No quotes available for this category.</p>';
    return;
  }
  
  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];
  
  renderQuote(quote);
}

// Render a quote to the display area
function renderQuote(quote) {
  quoteDisplay.innerHTML = `
    <div class="quote-text">"${quote.text}"</div>
    <div class="quote-category">— ${quote.category}</div>
  `;
}

// Toggle the add quote form visibility
function toggleAddQuoteForm() {
  if (addQuoteForm.style.display === 'none') {
    addQuoteForm.style.display = 'block';
    showFormBtn.textContent = 'Cancel';
  } else {
    addQuoteForm.style.display = 'none';
    showFormBtn.textContent = 'Add New Quote';
    // Clear form fields
    document.getElementById('newQuoteText').value = '';
    document.getElementById('newQuoteCategory').value = '';
  }
}

// Add a new quote
function addQuote() {
  const textInput = document.getElementById('newQuoteText');
  const categoryInput = document.getElementById('newQuoteCategory');
  
  const text = textInput.value.trim();
  const category = categoryInput.value.trim();
  
  if (!text || !category) {
    alert('Please enter both quote text and category');
    return;
  }
  
  // Add the new quote
  const newQuote = { text, category };
  quotes.push(newQuote);
  
  // Update UI
  renderQuote(newQuote);
  toggleAddQuoteForm();
  updateCategoryFilter();
  
  // Show success message
  alert('Quote added successfully!');
}

// Update the category filter dropdown
function updateCategoryFilter() {
  // Get all unique categories
  const categories = ['all', ...new Set(quotes.map(quote => quote.category))];
  
  // Clear existing options
  categorySelect.innerHTML = '';
  
  // Add new options
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category === 'all' ? 'All Categories' : category;
    categorySelect.appendChild(option);
  });
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);

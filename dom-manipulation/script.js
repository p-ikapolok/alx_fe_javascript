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
function toggleAddQuote





























































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































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
  showFormBtn.addEventListener('click', createAddQuoteForm); // Changed to createAddQuoteForm

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

/**
 * Creates and displays a form for adding new quotes
 */
function createAddQuoteForm() {
  // Check if form already exists in DOM
  if (document.getElementById('addQuoteForm')) {
    return;
  }

  // Create form container
  const formContainer = document.createElement('div');
  formContainer.id = 'addQuoteForm';
  formContainer.style.marginTop = '20px';
  formContainer.style.padding = '15px';
  formContainer.style.border = '1px solid #ddd';
  formContainer.style.borderRadius = '5px';

  // Create form title
  const title = document.createElement('h3');
  title.textContent = 'Add New Quote';
  formContainer.appendChild(title);

  // Create text input
  const textInput = document.createElement('input');
  textInput.id = 'newQuoteText';
  textInput.type = 'text';
  textInput.placeholder = 'Enter quote text';
  textInput.style.width = '100%';
  textInput.style.marginBottom = '10px';
  formContainer.appendChild(textInput);

  // Create category input
  const categoryInput = document.createElement('input');
  categoryInput.id = 'newQuoteCategory';
  categoryInput.type = 'text';
  categoryInput.placeholder = 'Enter category';
  categoryInput.style.width = '100%';
  categoryInput.style.marginBottom = '10px';
  formContainer.appendChild(categoryInput);

  // Create submit button
  const submitButton = document.createElement('button');
  submitButton.textContent = 'Add Quote';
  submitButton.style.marginRight = '10px';
  submitButton.onclick = addQuote;
  formContainer.appendChild(submitButton);

  // Create cancel button
  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  cancelButton.onclick = () => {
    document.body.removeChild(formContainer);
    document.getElementById('newQuote').disabled = false;
    showFormBtn.textContent = 'Add New Quote';
  };
  formContainer.appendChild(cancelButton);

  // Disable other quote button while form is open
  document.getElementById('newQuote').disabled = true;
  showFormBtn.textContent = 'Cancel';

  // Add form to document
  document.body.appendChild(formContainer);
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

  // Add the new quote to our array
  const newQuote = { text, category };
  quotes.push(newQuote);

  // Clear form inputs
  textInput.value = '';
  categoryInput.value = '';

  // Remove the form
  const form = document.getElementById('addQuoteForm');
  if (form) {
    document.body.removeChild(form);
  }

  // Re-enable buttons
  document.getElementById('newQuote').disabled = false;
  showFormBtn.textContent = 'Add New Quote';

  // Show confirmation
  alert('Quote added successfully!');

  // Update the display with the new quote
  showRandomQuote();

  // Update categories in filter
  updateCategoryFilter();
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

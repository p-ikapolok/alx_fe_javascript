// Initial quotes data - now checks localStorage first
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "The only way to do great work is to love what you do.", category: "inspiration" },
  { text: "Innovation distinguishes between a leader and a follower.", category: "business" },
  { text: "Your time is limited, don't waste it living someone else's life.", category: "life" },
  { text: "Stay hungry, stay foolish.", category: "motivation" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", category: "life" }
];

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Save selected filter to localStorage
function saveSelectedFilter(category) {
  localStorage.setItem('selectedFilter', category);
}

// Get selected filter from localStorage
function getSelectedFilter() {
  return localStorage.getItem('selectedFilter') || 'all';
}

// DOM elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const showFormBtn = document.getElementById('showForm');
const exportQuotesBtn = document.getElementById('exportQuotes');
const importQuotesBtn = document.getElementById('importQuotes');
const fileInput = document.getElementById('fileInput');
const addQuoteForm = document.getElementById('addQuoteForm');
const categoryFilter = document.getElementById('categoryFilter');

// Initialize the application
function init() {
  // Populate categories dropdown
  populateCategories();
  
  // Set the last selected filter
  const lastFilter = getSelectedFilter();
  categoryFilter.value = lastFilter;
  
  // Display quotes based on filter
  filterQuotes();
  
  // Set up event listeners
  newQuoteBtn.addEventListener('click', showRandomQuote);
  showFormBtn.addEventListener('click', createAddQuoteForm);
  exportQuotesBtn.addEventListener('click', exportToJsonFile);
  importQuotesBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', importFromJsonFile);
  categoryFilter.addEventListener('change', filterQuotes);
}

// Populate categories dropdown
function populateCategories() {
  // Get all unique categories
  const categories = ['all', ...new Set(quotes.map(quote => quote.category))];
  
  // Clear existing options
  categoryFilter.innerHTML = '';
  
  // Add new options
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category === 'all' ? 'All Categories' : category;
    categoryFilter.appendChild(option);
  });
}

// Filter quotes based on selected category
function filterQuotes() {
  const selectedCategory = categoryFilter.value;
  
  // Save the selected filter
  saveSelectedFilter(selectedCategory);
  
  // Filter quotes
  let filteredQuotes = quotes;
  if (selectedCategory !== 'all') {
    filteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
  }
  
  // Display a random quote from the filtered list
  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = '<p>No quotes available for this category.</p>';
    return;
  }
  
  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];
  renderQuote(quote);
}

// Display a random quote (now uses filtered quotes)
function showRandomQuote() {
  filterQuotes();
}

// Export quotes to JSON file
function exportToJsonFile() {
  try {
    const dataStr = JSON.stringify(quotes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const dataUrl = URL.createObjectURL(dataBlob);
    
    const exportFileDefaultName = 'quotes.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUrl);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    // Clean up by revoking the object URL
    setTimeout(() => {
      URL.revokeObjectURL(dataUrl);
    }, 100);
  } catch (error) {
    alert('Error exporting quotes: ' + error.message);
  }
}

// Import quotes from JSON file
function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      
      if (!Array.isArray(importedQuotes)) {
        throw new Error('File does not contain a valid array of quotes');
      }
      
      // Validate each quote has text and category
      const isValid = importedQuotes.every(quote => 
        quote.text && quote.category && 
        typeof quote.text === 'string' && 
        typeof quote.category === 'string'
      );
      
      if (!isValid) {
        throw new Error('Invalid quote format in file');
      }
      
      // Confirm with user before overwriting
      if (confirm(`Import ${importedQuotes.length} quotes? This will replace your current quotes.`)) {
        quotes = importedQuotes;
        saveQuotes();
        populateCategories();
        filterQuotes();
        alert('Quotes imported successfully!');
      }
    } catch (error) {
      alert('Error importing quotes: ' + error.message);
    }
    // Reset file input
    event.target.value = '';
  };
  reader.onerror = () => {
    alert('Error reading file');
    event.target.value = '';
  };
  reader.readAsText(file);
}

// Render a quote to the display area
function renderQuote(quote) {
  quoteDisplay.innerHTML = `
    <div class="quote-text">"${quote.text}"</div>
    <div class="quote-category">— ${quote.category}</div>
  `;
}

// Create and display form for adding new quotes
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
  
  // Save to localStorage
  saveQuotes();

  // Update categories dropdown
  populateCategories();
  
  // Set the filter to the new category
  categoryFilter.value = category;
  saveSelectedFilter(category);

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
  filterQuotes();
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);































































































































































































































































































































































































































































































































































































































































































































































































































































































// Initial quotes data - now checks localStorage first
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "The only way to do great work is to love what you do.", category: "inspiration" },
  { text: "Innovation distinguishes between a leader and a follower.", category: "business" },
  { text: "Your time is limited, don't waste it living someone else's life.", category: "life" },
  { text: "Stay hungry, stay foolish.", category: "motivation" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", category: "life" }
];

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

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
  
  // Save to localStorage
  saveQuotes();

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

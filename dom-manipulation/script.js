let quotes = [];

(async function initializeQuotes() {
  const storedQuotes = localStorage.getItem('quotes');
  if (storedQuotes) {
    quotes = JSON.parse(storedQuotes);
  } else {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
      const data = await response.json();
      quotes = data.map(post => ({
        text: post.title,
        category: 'server'
      }));
      saveQuotes(); // Store in localStorage after fetching
    } catch (err) {
      console.error("Failed to fetch initial quotes from server:", err);
      quotes = [
        { text: "Default fallback quote.", category: "fallback" }
      ];
      saveQuotes();
    }
  }
})();

let syncInProgress = false;
let conflicts = [];

// DOM Elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const showFormBtn = document.getElementById('showForm');
const exportQuotesBtn = document.getElementById('exportQuotes');
const importQuotesBtn = document.getElementById('importQuotes');
const syncQuotesBtn = document.getElementById('syncQuotes');
const fileInput = document.getElementById('fileInput');
const categoryFilter = document.getElementById('categoryFilter');
const syncStatus = document.getElementById('syncStatus');
const conflictModal = document.getElementById('conflictResolutionModal');
const conflictQuotesContainer = document.getElementById('conflictQuotesContainer');

// Save Quotes
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
  localStorage.setItem('lastUpdateTime', new Date().toISOString());
}

// Initialize App
function init() {
  populateCategories();
  filterQuotes();
  newQuoteBtn.addEventListener('click', showRandomQuote);
  showFormBtn.addEventListener('click', toggleAddQuoteForm);
  exportQuotesBtn.addEventListener('click', exportToJsonFile);
  importQuotesBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', importFromJsonFile);
  syncQuotesBtn.addEventListener('click', syncWithServer);
  categoryFilter.addEventListener('change', filterQuotes);

  setInterval(syncWithServer, 5 * 60 * 1000);
}

// Fetch from simulated server (mock API)
async function fetchQuotesFromServer() {
  return new Promise(resolve => {
    setTimeout(() => {
      const serverQuotes = JSON.parse(JSON.stringify(quotes));
      if (Math.random() < 0.3) {
        serverQuotes.forEach(q => {
          if (Math.random() < 0.3) q.text = "[Server Updated] " + q.text;
        });
      }
      if (Math.random() < 0.2) {
        serverQuotes.push({
          text: "A new quote from server",
          category: "server"
        });
      }
      resolve(serverQuotes);
    }, 1000);
  });
}

// Simulate posting data
async function postToServer(data) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true, quotes: data, timestamp: new Date().toISOString() });
    }, 1000);
  });
}

// Sync Logic
async function syncWithServer() {
  if (syncInProgress) return;
  syncInProgress = true;
  showSyncStatus("Syncing with server...", "");

  try {
    const serverQuotes = await fetchQuotesFromServer();
    const localMap = Object.fromEntries(quotes.map(q => [q.text, q]));
    const conflictList = [];

    serverQuotes.forEach(sq => {
      const lq = localMap[sq.text];
      if (lq && lq.category !== sq.category) {
        conflictList.push({ local: lq, server: sq });
      }
    });

    if (conflictList.length > 0) {
      conflicts = conflictList;
      showConflictResolutionDialog(conflicts);
      showSyncStatus("Conflicts detected. Please resolve.", "sync-conflict");
      return;
    }

    await mergeQuotes(quotes, serverQuotes);
    const result = await postToServer(quotes);
    localStorage.setItem('lastSyncTime', result.timestamp);
    showSyncStatus("Sync successful!", "sync-success");
  } catch (err) {
    console.error(err);
    showSyncStatus("Sync failed: " + err.message, "sync-error");
  } finally {
    syncInProgress = false;
    setTimeout(() => (syncStatus.style.display = 'none'), 5000);
  }
}

function mergeQuotes(local, server) {
  const merged = [...server];
  const texts = new Set(server.map(q => q.text));
  local.forEach(q => {
    if (!texts.has(q.text)) merged.push(q);
  });
  quotes = merged;
  saveQuotes();
  populateCategories();
  filterQuotes();
}

function showSyncStatus(msg, className) {
  syncStatus.textContent = msg;
  syncStatus.className = '';
  if (className) syncStatus.classList.add(className);
  syncStatus.style.display = 'block';
}

// Conflict UI
function showConflictResolutionDialog(conflicts) {
  conflictQuotesContainer.innerHTML = '';
  conflicts.forEach((conf, i) => {
    const div = document.createElement('div');
    div.className = 'conflict-quote';
    div.innerHTML = `
      <p><strong>Local:</strong> "${conf.local.text}" - ${conf.local.category}</p>
      <p><strong>Server:</strong> "${conf.server.text}" - ${conf.server.category}</p>
    `;
    conflictQuotesContainer.appendChild(div);
  });
  conflictModal.style.display = 'flex';
}

function resolveConflicts(type) {
  if (type === 'server') {
    conflicts.forEach(conf => {
      const index = quotes.findIndex(q => q.text === conf.local.text);
      if (index !== -1) quotes[index] = conf.server;
    });
  } else if (type === 'merge') {
    conflicts.forEach(conf => {
      if (!quotes.some(q => q.text === conf.server.text)) {
        quotes.push(conf.server);
      }
    });
  }
  saveQuotes();
  populateCategories();
  filterQuotes();
  conflictModal.style.display = 'none';
  syncWithServer();
}

// Add quote form toggle
function toggleAddQuoteForm() {
  const form = document.getElementById('addQuoteForm');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
  showFormBtn.textContent = form.style.display === 'block' ? 'Cancel' : 'Add New Quote';
}

// Add quote
function addQuote() {
  const text = document.getElementById('newQuoteText').value.trim();
  const category = document.getElementById('newQuoteCategory').value.trim();
  if (!text || !category) return alert('Please enter both quote and category');
  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  filterQuotes();
  toggleAddQuoteForm();
}

// Quote render
function renderQuote(quote) {
  quoteDisplay.innerHTML = `
    <div class="quote-text">"${quote.text}"</div>
    <div class="quote-category">— ${quote.category}</div>
  `;
}

function showRandomQuote() {
  const cat = categoryFilter.value;
  const list = cat === 'all' ? quotes : quotes.filter(q => q.category === cat);
  if (!list.length) {
    quoteDisplay.innerHTML = '<p>No quotes found in this category.</p>';
    return;
  }
  const q = list[Math.floor(Math.random() * list.length)];
  renderQuote(q);
}

// Populate dropdown
function populateCategories() {
  const categories = ['all', ...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = '';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat === 'all' ? 'All Categories' : cat;
    categoryFilter.appendChild(opt);
  });
}

// Export
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'quotes.json';
  link.click();
  URL.revokeObjectURL(url);
}

// Import
function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error("Invalid format");
      quotes = imported;
      saveQuotes();
      populateCategories();
      filterQuotes();
      alert("Quotes imported!");
    } catch (e) {
      alert("Import failed: " + e.message);
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

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

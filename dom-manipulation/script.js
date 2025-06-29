 // Enhanced Quote Generator with Server Sync and Conflict Resolution
    const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts';
    const SYNC_INTERVAL = 30000; // 30 seconds
    let conflictNotification = null;
    let syncIntervalId = null;

    // Initial quotes data - now checks localStorage first
    let quotes = JSON.parse(localStorage.getItem('quotes')) || [
      { id: 'local_1', text: "The only way to do great work is to love what you do.", category: "inspiration", timestamp: Date.now() },
      { id: 'local_2', text: "Innovation distinguishes between a leader and a follower.", category: "business", timestamp: Date.now() },
      { id: 'local_3', text: "Your time is limited, don't waste it living someone else's life.", category: "life", timestamp: Date.now() },
      { id: 'local_4', text: "Stay hungry, stay foolish.", category: "motivation", timestamp: Date.now() },
      { id: 'local_5', text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", category: "life", timestamp: Date.now() }
    ];

    // DOM elements
    const quoteDisplay = document.getElementById('quoteDisplay');
    const newQuoteBtn = document.getElementById('newQuote');
    const showFormBtn = document.getElementById('showForm');
    const exportQuotesBtn = document.getElementById('exportQuotes');
    const importQuotesBtn = document.getElementById('importQuotes');
    const syncNowBtn = document.getElementById('syncNow');
    const fileInput = document.getElementById('fileInput');
    const addQuoteForm = document.getElementById('addQuoteForm');
    const categoryFilter = document.getElementById('categoryFilter');
    const lastSyncTimeElement = document.getElementById('lastSyncTime');
    const syncStatusElement = document.getElementById('syncStatus');

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
      syncNowBtn.addEventListener('click', syncWithServer);
      fileInput.addEventListener('change', importFromJsonFile);
      categoryFilter.addEventListener('change', filterQuotes);

      // Start periodic sync
      startSyncInterval();

      // Initial sync
      syncWithServer();
    }

    // Save quotes to localStorage
    function saveQuotes() {
      localStorage.setItem('quotes', JSON.stringify(quotes));
      updateLastSyncTime();
    }

    // Save selected filter to localStorage
    function saveSelectedFilter(category) {
      localStorage.setItem('selectedFilter', category);
    }

    // Get selected filter from localStorage
    function getSelectedFilter() {
      return localStorage.getItem('selectedFilter') || 'all';
    }

    // Start periodic sync interval
    function startSyncInterval() {
      if (syncIntervalId) clearInterval(syncIntervalId);
      syncIntervalId = setInterval(syncWithServer, SYNC_INTERVAL);
    }

    // Update last sync time display
    function updateLastSyncTime() {
      const lastSync = localStorage.getItem('lastSyncTime');
      if (lastSync) {
        const date = new Date(parseInt(lastSync));
        lastSyncTimeElement.textContent = date.toLocaleString();
      } else {
        lastSyncTimeElement.textContent = 'Never';
      }
    }

    // Sync with server
    async function syncWithServer() {
      try {
        syncStatusElement.textContent = 'Syncing...';
        const response = await fetch(SERVER_URL);
        const serverData = await response.json();
        
        // Transform server data to our quote format
        const serverQuotes = serverData.slice(0, 5).map(post => ({
          id: `server_${post.id}`,
          text: post.title,
          category: `category_${post.userId}`,
          timestamp: Date.now()
        }));

        // Merge with local quotes
        mergeQuotes(serverQuotes);
        
        // Update sync status
        localStorage.setItem('lastSyncTime', Date.now());
        updateLastSyncTime();
        syncStatusElement.textContent = 'Synced successfully';
        displayNotification('Data synced with server');
      } catch (error) {
        console.error('Sync failed:', error);
        syncStatusElement.textContent = 'Sync failed';
        displayNotification('Failed to sync with server', true);
      }
    }

    // Merge server and local quotes with conflict resolution
    function mergeQuotes(serverQuotes) {
      let conflictsDetected = false;
      
      serverQuotes.forEach(serverQuote => {
        const localIndex = quotes.findIndex(q => q.id === serverQuote.id);
        
        if (localIndex >= 0) {
          // Conflict resolution - server version wins if newer
          if (serverQuote.timestamp > quotes[localIndex].timestamp) {
            conflictsDetected = true;
            quotes[localIndex] = serverQuote;
          }
        } else {
          // New quote from server
          quotes.push(serverQuote);
        }
      });

      // Save merged quotes
      saveQuotes();
      populateCategories();
      filterQuotes();
      
      if (conflictsDetected) {
        displayConflictNotification();
      }
    }

    // Display conflict notification
    function displayConflictNotification() {
      if (conflictNotification) return;
      
      conflictNotification = document.createElement('div');
      conflictNotification.className = 'conflict-notification';
      conflictNotification.innerHTML = `
        <p>Conflict detected: Server changes were applied</p>
        <button id="undo-conflict">Undo</button>
        <button id="dismiss-conflict">Dismiss</button>
      `;
      document.body.appendChild(conflictNotification);
      
      document.getElementById('undo-conflict').addEventListener('click', () => {
        // In a real app, we would implement proper undo functionality
        displayNotification('Undo not fully implemented in this demo');
        conflictNotification.remove();
        conflictNotification = null;
      });
      
      document.getElementById('dismiss-conflict').addEventListener('click', () => {
        conflictNotification.remove();
        conflictNotification = null;
      });
    }

    // Display notification
    function displayNotification(message, isError = false) {
      const notification = document.createElement('div');
      notification.className = `notification ${isError ? 'error' : ''}`;
      notification.textContent = message;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
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
          
          // Validate each quote has required fields
          const isValid = importedQuotes.every(quote => 
            quote.text && quote.category && 
            typeof quote.text === 'string' && 
            typeof quote.category === 'string'
          );
          
          if (!isValid) {
            throw new Error('Invalid quote format in file');
          }
          
          // Add IDs and timestamps if missing
          const processedQuotes = importedQuotes.map(quote => ({
            id: quote.id || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: quote.text,
            category: quote.category,
            timestamp: quote.timestamp || Date.now()
          }));
          
          // Confirm with user before overwriting
          if (confirm(`Import ${processedQuotes.length} quotes? This will merge with your current quotes.`)) {
            mergeQuotes(processedQuotes);
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
      const newQuote = { 
        id: `local_${Date.now()}`,
        text, 
        category,
        timestamp: Date.now()
      };
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
      displayNotification('Quote added successfully!');
      
      // Update the display with the new quote
      filterQuotes();

      // Sync with server after adding
      syncWithServer();
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

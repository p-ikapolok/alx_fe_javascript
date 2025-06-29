// Initial quotes data - now checks localStorage first
    let quotes = JSON.parse(localStorage.getItem('quotes')) || [
      { text: "The only way to do great work is to love what you do.", category: "inspiration" },
      { text: "Innovation distinguishes between a leader and a follower.", category: "business" },
      { text: "Your time is limited, don't waste it living someone else's life.", category: "life" },
      { text: "Stay hungry, stay foolish.", category: "motivation" },
      { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", category: "life" }
    ];

    // Track last sync time
    let lastSyncTime = localStorage.getItem('lastSyncTime') || null;
    let syncInProgress = false;
    let conflicts = [];

    // Save quotes to localStorage
    function saveQuotes() {
      localStorage.setItem('quotes', JSON.stringify(quotes));
      localStorage.setItem('lastUpdateTime', new Date().toISOString());
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
    const syncQuotesBtn = document.getElementById('syncQuotes');
    const fileInput = document.getElementById('fileInput');
    const addQuoteForm = document.getElementById('addQuoteForm');
    const categoryFilter = document.getElementById('categoryFilter');
    const syncStatus = document.getElementById('syncStatus');
    const conflictModal = document.getElementById('conflictResolutionModal');
    const conflictQuotesContainer = document.getElementById('conflictQuotesContainer');

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
      syncQuotesBtn.addEventListener('click', syncWithServer);
      fileInput.addEventListener('change', importFromJsonFile);
      categoryFilter.addEventListener('change', filterQuotes);

      // Set up periodic sync (every 5 minutes)
      setInterval(syncWithServer, 5 * 60 * 1000);
    }

    // Simulate fetching quotes from server
    async function fetchFromServer() {
      // In a real app, this would be an actual API call
      // For simulation, we'll use a mock response with a chance of returning modified data
      return new Promise((resolve) => {
        setTimeout(() => {
          // 30% chance to return modified quotes to simulate server changes
          if (Math.random() < 0.3) {
            const serverQuotes = JSON.parse(JSON.stringify(quotes));
            
            // Modify some quotes (30% chance per quote)
            serverQuotes.forEach(quote => {
              if (Math.random() < 0.3) {
                quote.text = "[Server Modified] " + quote.text;
              }
            });
            
            // Add a new quote 20% of the time
            if (Math.random() < 0.2) {
              serverQuotes.push({
                text: "New quote from server sync",
                category: "server"
              });
            }
            
            resolve(serverQuotes);
          } else {
            // Return the same quotes 70% of the time
            resolve(JSON.parse(JSON.stringify(quotes)));
          }
        }, 1000); // Simulate network delay
      });
    }

    // Simulate posting quotes to server
    async function postToServer(quotesToPost) {
      // In a real app, this would be an actual API call
      return new Promise((resolve) => {
        setTimeout(() => {
          // Simulate server processing
          resolve({
            success: true,
            timestamp: new Date().toISOString(),
            // Server might modify some data
            quotes: quotesToPost.map(quote => {
              // 10% chance server modifies each quote
              if (Math.random() < 0.1) {
                return {
                  text: "[Server Processed] " + quote.text,
                  category: quote.category
                };
              }
              return quote;
            })
          });
        }, 1000); // Simulate network delay
      });
    }

    // Sync quotes with server
    async function syncWithServer() {
      if (syncInProgress) return;
      
      syncInProgress = true;
      showSyncStatus("Syncing with server...", "");
      
      try {
        // Step 1: Fetch current server state
        const serverQuotes = await fetchFromServer();
        
        // Step 2: Compare with local quotes
        const localQuotes = JSON.parse(localStorage.getItem('quotes')) || [];
        const lastUpdateTime = localStorage.getItem('lastUpdateTime');
        
        // Find conflicts (quotes that exist in both but were modified differently)
        conflicts = [];
        const localMap = {};
        localQuotes.forEach(quote => {
          localMap[quote.text] = quote;
        });
        
        serverQuotes.forEach(serverQuote => {
          const localQuote = localMap[serverQuote.text];
          if (localQuote && localQuote.category !== serverQuote.category) {
            conflicts.push({
              local: localQuote,
              server: serverQuote
            });
          }
        });
        
        // Step 3: Handle conflicts if any
        if (conflicts.length > 0) {
          showSyncStatus("Found conflicts that need resolution", "sync-conflict");
          showConflictResolutionDialog(conflicts);
          return;
        }
        
        // Step 4: No conflicts - merge changes
        await mergeQuotes(localQuotes, serverQuotes);
        
        // Step 5: Post our merged quotes back to server
        const result = await postToServer(quotes);
        lastSyncTime = result.timestamp;
        localStorage.setItem('lastSyncTime', lastSyncTime);
        
        showSyncStatus("Sync completed successfully!", "sync-success");
      } catch (error) {
        console.error("Sync error:", error);
        showSyncStatus("Sync failed: " + error.message, "sync-error");
      } finally {
        syncInProgress = false;
        
        // Hide status after 5 seconds
        setTimeout(() => {
          syncStatus.style.display = 'none';
        }, 5000);
      }
    }

    // Merge local and server quotes
    async function mergeQuotes(localQuotes, serverQuotes) {
      // Create a map of quotes by text for easy lookup
      const quoteMap = {};
      
      // First add all server quotes
      serverQuotes.forEach(quote => {
        quoteMap[quote.text] = quote;
      });
      
      // Then add local quotes, overwriting only if they're newer
      localQuotes.forEach(localQuote => {
        // If server doesn't have this quote or it's unchanged locally, add it
        if (!quoteMap[localQuote.text]) {
          quoteMap[localQuote.text] = localQuote;
        }
      });
      
      // Convert back to array
      const mergedQuotes = Object.values(quoteMap);
      
      // Update our local quotes
      quotes = mergedQuotes;
      saveQuotes();
      
      // Update UI
      populateCategories();
      filterQuotes();
    }

    // Show sync status message
    function showSyncStatus(message, className) {
      syncStatus.textContent = message;
      syncStatus.className = '';
      syncStatus.classList.add(className);
      syncStatus.style.display = 'block';
    }

    // Show conflict resolution dialog
    function showConflictResolutionDialog(conflicts) {
      conflictQuotesContainer.innerHTML = '';
      
      conflicts.forEach((conflict, index) => {
        const conflictDiv = document.createElement('div');
        conflictDiv.className = 'conflict-quote';
        conflictDiv.innerHTML = `
          <h4>Conflict #${index + 1}</h4>
          <div>
            <p><strong>Local Version:</strong> "${conflict.local.text}" (Category: ${conflict.local.category})</p>
            <p><strong>Server Version:</strong> "${conflict.server.text}" (Category: ${conflict.server.category})</p>
          </div>
        `;
        conflictQuotesContainer.appendChild(conflictDiv);
      });
      
      conflictModal.style.display = 'flex';
    }

    // Resolve conflicts based on user choice
    function resolveConflicts(resolutionType) {
      conflictModal.style.display = 'none';
      
      // Apply the resolution
      if (resolutionType === 'server') {
        // Use server version for all conflicts
        conflicts.forEach(conflict => {
          const index = quotes.findIndex(q => q.text === conflict.local.text);
          if (index !== -1) {
            quotes[index] = conflict.server;
          }
        });
      } else if (resolutionType === 'local') {
        // Keep local version - no changes needed
      } else if (resolutionType === 'merge') {
        // Merge changes - keep both versions
        conflicts.forEach(conflict => {
          if (!quotes.some(q => q.text === conflict.server.text)) {
            quotes.push(conflict.server);
          }
        });
      }
      
      // Save changes
      saveQuotes();
      populateCategories();
      filterQuotes();
      
      // Continue with sync
      syncWithServer();
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

// State management
let allRecommendations = { given: [], received: [] };
let filteredRecommendations = { given: [], received: [] };

// DOM elements
const gistUrlInput = document.getElementById('gistUrl');
const loadBtn = document.getElementById('loadBtn');
const searchInput = document.getElementById('searchInput');
const errorDiv = document.getElementById('error');
const loadingDiv = document.getElementById('loading');
const recommendationsDiv = document.getElementById('recommendations');
const givenList = document.getElementById('given-list');
const receivedList = document.getElementById('received-list');
const givenCount = document.getElementById('given-count');
const receivedCount = document.getElementById('received-count');

// Event listeners
loadBtn.addEventListener('click', loadRecommendations);
searchInput.addEventListener('input', handleSearch);

// Allow Enter key to load recommendations
gistUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loadRecommendations();
    }
});

// Toggle section collapse/expand
function toggleSection(section) {
    const content = document.getElementById(`${section}-content`);
    const icon = document.getElementById(`${section}-icon`);
    
    content.classList.toggle('collapsed');
    icon.classList.toggle('collapsed');
}

// Show error message
function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    loadingDiv.classList.add('hidden');
    recommendationsDiv.classList.add('hidden');
}

// Hide error message
function hideError() {
    errorDiv.classList.add('hidden');
}

// Show loading state
function showLoading() {
    loadingDiv.classList.remove('hidden');
    hideError();
    recommendationsDiv.classList.add('hidden');
}

// Hide loading state
function hideLoading() {
    loadingDiv.classList.add('hidden');
}

// Extract gist ID from URL or construct URL from username
function parseGistInput(input) {
    input = input.trim();
    
    if (!input) {
        throw new Error('Please enter a GitHub username or gist URL');
    }
    
    // Check if it's a full gist URL
    const gistUrlPattern = /gist\.github\.com\/([^\/]+)\/([a-f0-9]+)/;
    const match = input.match(gistUrlPattern);
    
    if (match) {
        return {
            username: match[1],
            gistId: match[2]
        };
    }
    
    // Check if it's just a gist ID (hex string)
    if (/^[a-f0-9]+$/.test(input)) {
        throw new Error('Please provide the full gist URL or just the username');
    }
    
    // Assume it's a username - we'll need to find their recommendations.js gist
    return {
        username: input,
        gistId: null
    };
}

// Find the recommendations.js gist for a user
async function findRecommendationsGist(username) {
    try {
        const response = await fetch(`https://api.github.com/users/${username}/gists`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch gists for user ${username}`);
        }
        
        const gists = await response.json();
        
        // Look for a gist with a file named recommendations.js
        for (const gist of gists) {
            if (gist.files && gist.files['recommendations.js']) {
                return gist.id;
            }
        }
        
        throw new Error(`No gist named "recommendations.js" found for user ${username}`);
    } catch (error) {
        throw new Error(`Error finding recommendations: ${error.message}`);
    }
}

// Load recommendations from gist
async function loadRecommendations() {
    const input = gistUrlInput.value;
    
    try {
        showLoading();
        
        const { username, gistId } = parseGistInput(input);
        
        // If we don't have a gist ID, find it
        const actualGistId = gistId || await findRecommendationsGist(username);
        
        // Fetch the gist
        const response = await fetch(`https://api.github.com/gists/${actualGistId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch gist. Please check the URL or username.');
        }
        
        const gist = await response.json();
        
        // Get the recommendations.js file
        const recsFile = gist.files['recommendations.js'];
        
        if (!recsFile) {
            throw new Error('Gist does not contain a file named "recommendations.js"');
        }
        
        // Parse the JavaScript file content
        // The file should export a recommendations object
        const content = recsFile.content;
        
        // Extract the JSON data from the JavaScript file
        // We'll evaluate it in a safe way
        try {
            // Try to parse as JSON directly first
            const data = parseRecommendationsJS(content);
            
            if (!data || (!data.given && !data.received)) {
                throw new Error('Invalid recommendations format. Expected "given" and/or "received" arrays.');
            }
            
            allRecommendations = {
                given: data.given || [],
                received: data.received || []
            };
            
            // Initialize filtered recommendations
            filteredRecommendations = { ...allRecommendations };
            
            hideLoading();
            displayRecommendations();
            
        } catch (parseError) {
            throw new Error(`Failed to parse recommendations.js: ${parseError.message}`);
        }
        
    } catch (error) {
        showError(error.message);
    }
}

// Parse recommendations.js content
function parseRecommendationsJS(content) {
    // Try multiple parsing strategies
    
    // Strategy 1: Direct JSON
    try {
        return JSON.parse(content);
    } catch (e) {
        // Not direct JSON, continue
    }
    
    // Strategy 2: JavaScript variable assignment (const recommendations = {...})
    const varMatch = content.match(/(?:const|let|var)\s+\w+\s*=\s*(\{[\s\S]*\})/);
    if (varMatch) {
        try {
            return JSON.parse(varMatch[1]);
        } catch (e) {
            // Continue
        }
    }
    
    // Strategy 3: Module exports (module.exports = {...})
    const exportsMatch = content.match(/module\.exports\s*=\s*(\{[\s\S]*\})/);
    if (exportsMatch) {
        try {
            return JSON.parse(exportsMatch[1]);
        } catch (e) {
            // Continue
        }
    }
    
    // Strategy 4: Just find the JSON object
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0]);
        } catch (e) {
            // Continue
        }
    }
    
    throw new Error('Could not parse recommendations data');
}

// Display recommendations
function displayRecommendations() {
    recommendationsDiv.classList.remove('hidden');
    
    renderRecommendationList('given', filteredRecommendations.given);
    renderRecommendationList('received', filteredRecommendations.received);
    
    updateCounts();
}

// Render a list of recommendations
function renderRecommendationList(type, recommendations) {
    const listElement = type === 'given' ? givenList : receivedList;
    
    if (recommendations.length === 0) {
        listElement.innerHTML = '<div class="no-results">No recommendations to display</div>';
        return;
    }
    
    listElement.innerHTML = recommendations.map(rec => createRecommendationCard(rec)).join('');
}

// Create HTML for a recommendation card
function createRecommendationCard(rec) {
    const name = rec.name || 'Unknown';
    const relationship = rec.relationship || '';
    const title = rec.title || '';
    const company = rec.company || '';
    const date = rec.date || '';
    const text = rec.text || rec.recommendation || '';
    
    return `
        <div class="recommendation-card" data-search-text="${getSearchableText(rec)}">
            <div class="recommendation-header">
                <div class="recommendation-name">${escapeHtml(name)}</div>
                ${date ? `<div class="recommendation-date">${escapeHtml(date)}</div>` : ''}
            </div>
            ${relationship ? `<div class="recommendation-relationship">${escapeHtml(relationship)}</div>` : ''}
            ${title ? `<div class="recommendation-title">${escapeHtml(title)}</div>` : ''}
            ${company ? `<div class="recommendation-company">${escapeHtml(company)}</div>` : ''}
            ${text ? `<div class="recommendation-text">${escapeHtml(text)}</div>` : ''}
        </div>
    `;
}

// Get all searchable text from a recommendation
function getSearchableText(rec) {
    const fields = [
        rec.name,
        rec.relationship,
        rec.title,
        rec.company,
        rec.date,
        rec.text,
        rec.recommendation
    ];
    
    return fields.filter(f => f).join(' ').toLowerCase();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Update counts
function updateCounts() {
    const givenVisible = filteredRecommendations.given.length;
    const givenTotal = allRecommendations.given.length;
    const receivedVisible = filteredRecommendations.received.length;
    const receivedTotal = allRecommendations.received.length;
    
    givenCount.textContent = givenVisible === givenTotal 
        ? `(${givenTotal})` 
        : `(${givenVisible} of ${givenTotal})`;
    
    receivedCount.textContent = receivedVisible === receivedTotal 
        ? `(${receivedTotal})` 
        : `(${receivedVisible} of ${receivedTotal})`;
}

// Handle search/filter
function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();
    
    if (!query) {
        // No search query, show all recommendations
        filteredRecommendations = {
            given: [...allRecommendations.given],
            received: [...allRecommendations.received]
        };
    } else {
        // Filter recommendations based on query
        filteredRecommendations = {
            given: allRecommendations.given.filter(rec => 
                getSearchableText(rec).includes(query)
            ),
            received: allRecommendations.received.filter(rec => 
                getSearchableText(rec).includes(query)
            )
        };
    }
    
    displayRecommendations();
}

// Initialize app
function init() {
    let username = null;
    
    // Check for redirected path from 404.html
    const urlParams = new URLSearchParams(window.location.search);
    const pathParam = urlParams.get('path');
    
    if (pathParam) {
        // Path was passed from 404 redirect
        const pathParts = pathParam.split('/').filter(part => part.length > 0);
        if (pathParts.length > 0) {
            username = pathParts[0];
        }
    } else {
        // Check if there's a username in the URL path (e.g., /dalevross or /dalevross/)
        const pathname = window.location.pathname;
        const pathParts = pathname.split('/').filter(part => part.length > 0);
        
        // If there's a path component and it's not index.html, use it as the username
        if (pathParts.length > 0 && pathParts[0] !== 'index.html') {
            username = pathParts[0];
        }
    }
    
    // Direct URL parameters take precedence
    const gistParam = urlParams.get('gist') || urlParams.get('user');
    
    if (gistParam) {
        username = gistParam;
    }
    
    if (username) {
        gistUrlInput.value = username;
        loadRecommendations();
    }
}

// Run initialization when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

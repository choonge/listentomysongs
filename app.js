import { LocationPin, loadPins } from './pins.js';

// Map configuration and state
let map;
let markers = [];
let activeFilters = new Set();
let currentInfoWindow = null; // Track the currently open info window
let selectedTags = new Set();

// Mobile menu handling
function initializeMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const filterPanel = document.querySelector('.filter-panel');
    
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        filterPanel.classList.toggle('active');
    });

    // Close menu when clicking outside of the menu and the toggle button
    document.addEventListener('click', (e) => {
        if (!filterPanel.contains(e.target) && 
            !menuToggle.contains(e.target) && 
            filterPanel.classList.contains('active')) {
            menuToggle.classList.remove('active');
            filterPanel.classList.remove('active');
        }
    });
}

// Initialize the map
async function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 2,
        center: { lat: 20, lng: 0 },
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });

    // Load pins and set initial view
    const pins = await loadPins();
    
    // Prepare bounds for map fitting
    const bounds = new google.maps.LatLngBounds();
    let visiblePinsCount = 0;

    // Add all pins and extend bounds
    pins.forEach(pin => {
        addPin(pin);
        bounds.extend(new google.maps.LatLng(pin.position.lat, pin.position.lng));
        visiblePinsCount++;
    });

    // Adjust map view if there are pins
    if (visiblePinsCount > 0) {
        // If only one pin, zoom in a bit more
        if (visiblePinsCount === 1) {
            map.setZoom(6);
            map.setCenter(bounds.getCenter());
        } else {
            // Fit bounds with some padding
            map.fitBounds(bounds, {
                top: 50,    // Top padding
                bottom: 50, // Bottom padding
                left: 50,   // Left padding
                right: 50   // Right padding
            });
        }
    }

    // Initialize tag filters and add pins
    await initializeTagFilters(pins);
    
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Initialize clear filters button
    const clearFiltersButton = document.getElementById('clear-filters');
    if (clearFiltersButton) {
        clearFiltersButton.addEventListener('click', clearAllFilters);
    }
    
    // Close info window when clicking on the map
    map.addListener('click', () => {
        if (currentInfoWindow) {
            currentInfoWindow.close();
            currentInfoWindow = null;
        }
    });
}

// Clear all filters and reset the map view
function clearAllFilters() {
    // Clear tag filters
    selectedTags.clear();
    
    // Uncheck all tag filter checkboxes
    const tagCheckboxes = document.querySelectorAll('#tag-filters input[type="checkbox"]');
    tagCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Refresh pins (this will reset the map view)
    refreshPins();
}

// Initialize tag filters
async function initializeTagFilters(pins) {
    const tagSet = new Set();
    pins.forEach(pin => {
        pin.tags.forEach(tag => tagSet.add(tag));
    });

    const tagFiltersContainer = document.getElementById('tag-filters');
    tagFiltersContainer.innerHTML = '';

    Array.from(tagSet).sort().forEach(tag => {
        const button = document.createElement('button');
        button.textContent = tag;
        button.classList.add('tag-button');
        
        button.addEventListener('click', () => {
            button.classList.toggle('active');
            if (selectedTags.has(tag)) {
                selectedTags.delete(tag);
            } else {
                selectedTags.add(tag);
            }
            refreshPins();
        });
        
        tagFiltersContainer.appendChild(button);
    });
}

// Refresh pins on the map based on filters
async function refreshPins() {
    // Close any open info window
    if (currentInfoWindow) {
        currentInfoWindow.close();
    }

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    // Get all pins
    const pins = await loadPins();

    // Prepare bounds for map fitting
    const bounds = new google.maps.LatLngBounds();
    let visiblePinsCount = 0;

    // Apply filters and create markers
    pins.forEach(pin => {
        if (selectedTags.size === 0 || pin.tags.some(tag => selectedTags.has(tag))) {
            addPin(pin);
            
            // Extend bounds with pin location
            bounds.extend(new google.maps.LatLng(pin.position.lat, pin.position.lng));
            visiblePinsCount++;
        }
    });

    // Adjust map view if there are visible pins
    if (visiblePinsCount > 0) {
        // If only one pin, zoom in a bit more
        if (visiblePinsCount === 1) {
            map.setZoom(6);
            map.setCenter(bounds.getCenter());
        } else {
            // Fit bounds with some padding
            map.fitBounds(bounds, {
                top: 50,    // Top padding
                bottom: 50, // Bottom padding
                left: 50,   // Left padding
                right: 50   // Right padding
            });
        }
    } else {
        // Reset to world view if no pins match filters
        map.setZoom(2);
        map.setCenter({ lat: 20, lng: 0 });
    }
}

// Add a pin to the map
function addPin(pin) {
    const marker = new google.maps.Marker({
        position: pin.position,
        map: map,
        title: pin.title
    });

    const infoWindow = createInfoWindow(pin);

    marker.addListener('click', () => {
        // Close the currently open info window if there is one
        if (currentInfoWindow) {
            currentInfoWindow.close();
        }
        // Open the new info window and update the reference
        infoWindow.open(map, marker);
        currentInfoWindow = infoWindow;
    });

    markers.push(marker);
}

// Create info window content
function createInfoWindow(pin) {
    const tagsHtml = pin.tags
        .map(tag => `<span class="tag">${tag}</span>`)
        .join('');

    const content = `
        <div class="info-window">
            <div class="info-window-header">
                <h3>${pin.title}</h3>
            </div>
            <div class="info-window-content">
                <div class="info-window-media">
                    <a href="${pin.youtubeLink}" target="_blank" rel="noopener noreferrer" class="youtube-link">
                        <svg class="youtube-icon" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                    </a>
                    <div class="rating">
                        <span class="rating-stars">
                            ${'<span class="star filled">★</span>'.repeat(pin.rating)}
                            ${'<span class="star">★</span>'.repeat(5-pin.rating)}
                        </span>
                    </div>
                </div>
                <p class="description">${pin.description}</p>
                <div class="tags">${tagsHtml}</div>
            </div>
        </div>
    `;

    return new google.maps.InfoWindow({
        content: content
    });
}

// Load pins when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    const pins = await loadPins();
    // Initialize tag filters with loaded pins
    await initializeTagFilters(pins);
    
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Refresh pins
    refreshPins();
});

// Initialize the map when the page loads
window.addEventListener('load', initMap);

import { LocationPin, getLocationPins } from './pins.js';

// Map configuration and state
let map;
let markers = [];
let activeFilters = new Set();
let currentInfoWindow = null; // Track the currently open info window
let selectedTags = new Set();
let selectedContinent = null;

// Define continent coordinates and zoom levels
const continentViews = {
    world: {
        center: { lat: 20, lng: 0 },
        zoom: 2
    },
    asia: {
        center: { lat: 23.5, lng: 121.5 }, // Centered on Taiwan
        zoom: 4
    },
    us: {
        center: { lat: 39.8283, lng: -98.5795 },
        zoom: 4
    },
    europe: {
        center: { lat: 54.5260, lng: 15.2551 },
        zoom: 4
    }
};

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

// Get the last selected region or default to world view
function getInitialRegion() {
    const savedRegion = localStorage.getItem('selectedRegion');
    return savedRegion || 'world';
}

// Save the selected region
function saveRegion(region) {
    if (region) {
        localStorage.setItem('selectedRegion', region);
    } else {
        localStorage.removeItem('selectedRegion');
    }
}

// Initialize the map
async function initMap() {
    const initialRegion = getInitialRegion();
    const defaultView = continentViews[initialRegion] || { center: { lat: 20, lng: 0 }, zoom: 2 };
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: defaultView.zoom,
        center: defaultView.center,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });

    // Initialize tag filters and add pins
    const pins = await getLocationPins();
    await initializeTagFilters(pins);
    
    // Initialize continent buttons
    initializeContinentButtons(initialRegion);
    
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Initialize clear filters button
    const clearFiltersButton = document.getElementById('clear-filters');
    if (clearFiltersButton) {
        clearFiltersButton.addEventListener('click', clearAllFilters);
    }
    
    // Add initial pins to the map
    await refreshPins();

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
    // Clear selected tags
    selectedTags.clear();
    
    // Reset tag buttons UI
    const tagButtons = document.querySelectorAll('.tag-button');
    tagButtons.forEach(button => button.classList.remove('active'));
   
    // Refresh pins
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

// Initialize continent buttons
function initializeContinentButtons(initialRegion) {
    const buttons = document.querySelectorAll('.continent-button');
    let activeButton = null;

    buttons.forEach(button => {
        const region = button.dataset.region;
        
        // Set initial active state
        if (region === initialRegion) {
            button.classList.add('active');
            activeButton = button;
        }

        button.addEventListener('click', () => {
            // If clicking the same button that's already active, do nothing
            if (activeButton === button) {
                return;
            }

            // Remove active class from previous button
            if (activeButton) {
                activeButton.classList.remove('active');
            }

            // Set new view
            const view = continentViews[region];
            map.setZoom(view.zoom);
            map.setCenter(view.center);
            button.classList.add('active');
            activeButton = button;
            saveRegion(region);
            selectedContinent = region;
        });
    });
}

// Refresh pins on the map based on filters
async function refreshPins() {
    // Close any open info window
    if (currentInfoWindow) {
        currentInfoWindow.close();
        currentInfoWindow = null;
    }

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    // Get fresh pins from the sheet
    const pins = await getLocationPins();
    
    // Apply filters and create markers
    pins.forEach(pin => {
        if (selectedTags.size === 0 || pin.tags.some(tag => selectedTags.has(tag))) {
            if (!selectedContinent || isPinInContinent(pin, selectedContinent)) {
                addPin(pin);
            }
        }
    });
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

// Check if a pin is in a continent
function isPinInContinent(pin, continent) {
    const continentBounds = {
        asia: { north: 55, south: -10, east: 170, west: 60 },
        us: { north: 50, south: 20, east: -60, west: -125 },
        europe: { north: 70, south: 30, east: 60, west: -25 }
    };

    const bounds = continentBounds[continent];
    return pin.position.lat <= bounds.north &&
           pin.position.lat >= bounds.south &&
           pin.position.lng <= bounds.east &&
           pin.position.lng >= bounds.west;
}

// Initialize the map when the page loads
window.addEventListener('load', initMap);

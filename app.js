import { LocationPin, locationPins } from './pins.js';

// Map configuration and state
let map;
let markers = [];
let activeFilters = new Set();
let currentInfoWindow = null; // Track the currently open info window

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
function initMap() {
    const initialRegion = getInitialRegion();
    const defaultView = continentViews[initialRegion];
    
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

    // Close info window when clicking on the map
    map.addListener('click', () => {
        if (currentInfoWindow) {
            currentInfoWindow.close();
            currentInfoWindow = null;
        }
    });

    // Initialize tag filters
    initializeTagFilters();
    
    // Initialize continent buttons
    initializeContinentButtons(initialRegion);
    
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Add all pins to the map
    refreshPins();
}

// Initialize tag filters
function initializeTagFilters() {
    const tagSet = new Set();
    locationPins.forEach(pin => {
        pin.tags.forEach(tag => tagSet.add(tag));
    });

    const tagFiltersContainer = document.getElementById('tag-filters');
    Array.from(tagSet).sort().forEach(tag => {
        const button = document.createElement('button');
        button.className = 'tag-button';
        button.textContent = tag;
        button.addEventListener('click', () => toggleFilter(tag, button));
        tagFiltersContainer.appendChild(button);
    });

    document.getElementById('clear-filters').addEventListener('click', clearFilters);
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
            // Remove active class from previous button
            if (activeButton) {
                activeButton.classList.remove('active');
            }

            // If clicking the same button that's already active, do nothing
            if (activeButton === button) {
                return;
            }

            // Set new view
            const view = continentViews[region];
            map.setZoom(view.zoom);
            map.setCenter(view.center);
            button.classList.add('active');
            activeButton = button;
            saveRegion(region);
        });
    });
}

// Toggle filter for a tag
function toggleFilter(tag, button) {
    if (activeFilters.has(tag)) {
        activeFilters.delete(tag);
        button.classList.remove('active');
    } else {
        activeFilters.add(tag);
        button.classList.add('active');
    }
    refreshPins();
}

// Clear all filters
function clearFilters() {
    activeFilters.clear();
    document.querySelectorAll('.tag-button').forEach(button => {
        button.classList.remove('active');
    });
    refreshPins();
}

// Refresh pins based on active filters
function refreshPins() {
    // Close any open info window
    if (currentInfoWindow) {
        currentInfoWindow.close();
        currentInfoWindow = null;
    }

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    // Add filtered pins
    locationPins.forEach(pin => {
        if (activeFilters.size === 0 || pin.tags.some(tag => activeFilters.has(tag))) {
            addPin(pin);
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
            <h3>${pin.title}</h3>
            <div class="rating">Rating: ${'★'.repeat(pin.rating)}${'☆'.repeat(5-pin.rating)}</div>
            <div class="tags">${tagsHtml}</div>
            <a href="${pin.youtubeLink}" target="_blank" rel="noopener noreferrer" class="youtube-link">
                Watch on YouTube
            </a>
        </div>
    `;

    return new google.maps.InfoWindow({
        content: content
    });
}

// Initialize the map when the page loads
window.addEventListener('load', initMap);

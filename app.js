import { LocationPin, loadPins } from './pins.js';

// Map configuration and state
let map;
let markers = [];
let currentInfoWindow = null; // Track the currently open info window
let selectedTags = new Set();
let allPins = []; // Store all pins after initial load

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
        backgroundColor: '#aadaff', // Light blue color matching Google Maps ocean
        styles: [
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#aadaff"
                    }
                ]
            },
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });

    // Load pins once
    allPins = await loadPins();

    // Initialize tag filters and add pins
    await initializeTagFilters(allPins);
        
    // Initialize clear filters button
    const clearFiltersButton = document.getElementById('clear-filters');
    if (clearFiltersButton) {
        clearFiltersButton.addEventListener('click', clearAllFilters);
    }

    // Initial refresh to show all pins
    refreshPins();
    
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
    
    // Remove active class from all tag buttons
    const tagButtons = document.querySelectorAll('.tag-button.active');
    tagButtons.forEach(button => button.classList.remove('active'));
    
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

    // Prepare bounds for map fitting
    const bounds = new google.maps.LatLngBounds();
    let visiblePinsCount = 0;

    // Apply filters and create markers
    allPins.forEach(pin => {
        if (selectedTags.size === 0 || pin.tags.some(tag => selectedTags.has(tag))) {
            addPin(pin);
            
            // Extend bounds with pin location
            bounds.extend(new google.maps.LatLng(pin.position.lat, pin.position.lng));
            visiblePinsCount++;
        }
    });

    // Adjust map view if there are visible pins
    if (visiblePinsCount > 0) {
        // If only one pin, zoom in closer
        if (visiblePinsCount === 1) {
            smoothMapTransition(map, {
                center: bounds.getCenter(),
                zoom: 10
            });
        } else {
            // Fit bounds with smooth transition
            smoothMapTransition(map, { bounds });
        }
    } else {
        // Reset to world view if no pins match filters
        smoothMapTransition(map, {
            center: { lat: 20, lng: 0 },
            zoom: 2
        });
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

// Smoothly animate map view changes
function smoothMapTransition(map, options) {
    const { center, zoom, bounds } = options;

    // Animate center if provided
    if (center) {
        map.panTo(center);
    }

    // Animate zoom if provided
    if (zoom !== undefined) {
        // Create a smooth zoom transition
        const currentZoom = map.getZoom();
        const zoomDiff = zoom - currentZoom;
        const steps = Math.abs(zoomDiff);
        const direction = zoomDiff > 0 ? 1 : -1;

        let currentStep = 0;
        const zoomInterval = setInterval(() => {
            if (currentStep < steps) {
                map.setZoom(currentZoom + (currentStep + 1) * direction);
                currentStep++;
            } else {
                clearInterval(zoomInterval);
            }
        }, 100); // Adjust speed of zoom transition
    }

    // Fit bounds if provided
    if (bounds) {
        // First pan to the center of the bounds
        map.panTo(bounds.getCenter());
        
        // Then smoothly zoom to fit bounds
        const currentZoom = map.getZoom();
        const targetBounds = new google.maps.LatLngBounds(bounds.getSouthWest(), bounds.getNorthEast());
        targetBounds.extend(bounds.getSouthWest());
        targetBounds.extend(bounds.getNorthEast());
        
        // Calculate target zoom level
        const targetZoom = map.getZoom();
        map.fitBounds(targetBounds, {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
        });
        const finalZoom = map.getZoom();
        map.setZoom(currentZoom);
        
        // Smoothly transition to target zoom
        let step = 0;
        const steps = Math.abs(finalZoom - currentZoom);
        const zoomInterval = setInterval(() => {
            if (step < steps) {
                const newZoom = currentZoom + ((finalZoom - currentZoom) * (step + 1)) / steps;
                map.setZoom(newZoom);
                step++;
            } else {
                clearInterval(zoomInterval);
                // Final adjustment
                map.fitBounds(bounds, {
                    top: 50,
                    bottom: 50,
                    left: 50,
                    right: 50
                });
            }
        }, 100);
    }
}

// Load pins when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize mobile menu
    initializeMobileMenu();
});

// Initialize the map when the page loads
window.addEventListener('load', initMap);

// Map configuration and state
let map;
let markers = [];
let activeFilters = new Set();

// Data structure for a pin
class LocationPin {
    constructor({
        title,
        youtubeLink,
        rating,
        lat,
        lng,
        tags
    }) {
        this.title = title;
        this.category = category;
        this.youtubeLink = youtubeLink;
        this.rating = rating;
        this.position = { lat, lng };
        this.tags = tags;
    }
}

// Hardcoded list of location pins
const locationPins = [
    new LocationPin({
        title: "First Song Location",
        youtubeLink: "https://www.youtube.com/watch?v=BP9wwPW78UE",
        rating: 4,
        lat: 35.7102278,
        lng: 139.7509408,
        tags: ["hotel", "all you can eat", "breakfast", "buffet"]
    }),
    new LocationPin({
        title: "Second Song Location",
        youtubeLink: "https://www.youtube.com/watch?v=example2",
        rating: 4,
        lat: 40.7128,
        lng: -74.0060,
        tags: ["music", "dance"]
    }),
];

// Initialize the map
function initMap() {
    // Center the map on a default location (can be adjusted)
    const defaultCenter = { lat: 39.8283, lng: -98.5795 }; // Center of the US
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: defaultCenter,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });

    // Initialize tag filters
    initializeTagFilters();
    
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
        infoWindow.open(map, marker);
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

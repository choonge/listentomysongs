// Map configuration and state
let map;
let markers = [];

// Sample data structure for a pin
class LocationPin {
    constructor(title, category, youtubeLink, rating, lat, lng) {
        this.title = title;
        this.category = category;
        this.youtubeLink = youtubeLink;
        this.rating = rating;
        this.position = { lat, lng };
    }
}

// Initialize the map
function initMap() {
    // Center the map on a default location (can be adjusted)
    const defaultCenter = { lat: 0, lng: 0 };
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 3,
        center: defaultCenter,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });

    // Add click listener for adding new pins
    map.addListener('click', (event) => {
        const position = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
        };
        promptForPinInfo(position);
    });

    // Load saved pins (if any)
    loadSavedPins();
}

// Prompt user for pin information
function promptForPinInfo(position) {
    // In a real application, you might want to use a modal or form
    const title = prompt('Enter location title:');
    if (!title) return;

    const category = prompt('Enter category:');
    if (!category) return;

    const youtubeLink = prompt('Enter YouTube link:');
    if (!youtubeLink) return;

    const rating = prompt('Enter rating (1-5):');
    if (!rating || isNaN(rating) || rating < 1 || rating > 5) return;

    const pin = new LocationPin(
        title,
        category,
        youtubeLink,
        parseFloat(rating),
        position.lat,
        position.lng
    );

    addPin(pin);
    savePin(pin);
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
    const content = `
        <div class="info-window">
            <h3>${pin.title}</h3>
            <div class="category">${pin.category}</div>
            <div class="rating">Rating: ${'★'.repeat(pin.rating)}${'☆'.repeat(5-pin.rating)}</div>
            <a href="${pin.youtubeLink}" target="_blank" rel="noopener noreferrer" class="youtube-link">
                Watch on YouTube
            </a>
        </div>
    `;

    return new google.maps.InfoWindow({
        content: content
    });
}

// Save pin to localStorage
function savePin(pin) {
    const savedPins = JSON.parse(localStorage.getItem('pins') || '[]');
    savedPins.push(pin);
    localStorage.setItem('pins', JSON.stringify(savedPins));
}

// Load saved pins from localStorage
function loadSavedPins() {
    const savedPins = JSON.parse(localStorage.getItem('pins') || '[]');
    savedPins.forEach(pin => addPin(pin));
}

// Initialize the map when the page loads
window.addEventListener('load', initMap);

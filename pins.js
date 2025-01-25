// Data structure for a pin
export class LocationPin {
    constructor({
        title,
        description,
        youtubeLink,
        rating,
        lat,
        lng,
        tags
    }) {
        this.title = title;
        this.description = description;
        this.youtubeLink = youtubeLink;
        this.rating = rating;
        this.position = { lat, lng };
        this.tags = tags;
    }
}

// Variable to store pins
let cachedPins = null;

// Function to fetch and parse Google Sheets data
async function fetchPinsFromSheet() {
    const sheetId = '1euCzUeDrPyuUntuJiKjcMbFs1oPnYm1crItU35OGG0w';
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch sheet data');
        }
        
        const text = await response.text();
        // Parse the JSONP response
        const jsonText = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/)[1];
        const data = JSON.parse(jsonText);
        
        // Transform rows into LocationPin objects
        return data.table.rows
            .filter(row => {
                // Check if the first cell (title) is not null or empty
                const title = row.c[0] ? row.c[0].v : null;
                
                // Check if latitude and longitude are valid numbers
                const lat = row.c[4] ? parseFloat(row.c[4].v) : null;
                const lng = row.c[5] ? parseFloat(row.c[5].v) : null;
                
                // Return true only if title is not empty and both lat and lng are valid numbers
                return title && title.trim() !== '' && 
                       !isNaN(lat) && !isNaN(lng) && 
                       lat !== null && lng !== null;
            })
            .map(row => {
                const values = row.c.map(cell => cell ? cell.v : null);
                return new LocationPin({
                    title: values[0],
                    description: values[1],
                    youtubeLink: values[2],
                    rating: parseInt(values[3]),
                    lat: parseFloat(values[4]),
                    lng: parseFloat(values[5]),
                    // Sort tags alphabetically and remove any empty tags
                    tags: values[6] ? 
                        values[6].split(',')
                            .map(tag => tag.trim())
                            .filter(tag => tag !== '')
                            .sort((a, b) => a.localeCompare(b)) : 
                        []
                });
            });
    } catch (error) {
        console.error('Error fetching pins:', error);
        // Return empty array if fetch fails
        return [];
    }
}

// Function to load pins only once
async function loadPins() {
    if (!cachedPins) {
        cachedPins = await fetchPinsFromSheet();
    }
    return cachedPins;
}

// Export the function to get pins
export { loadPins };

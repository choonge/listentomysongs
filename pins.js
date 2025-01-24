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
        return data.table.rows.map(row => {
            const values = row.c.map(cell => cell ? cell.v : null);
            return new LocationPin({
                title: values[0],
                description: values[1],
                youtubeLink: values[2],
                rating: parseInt(values[3]),
                lat: parseFloat(values[4]),
                lng: parseFloat(values[5]),
                tags: values[6] ? values[6].split(',').map(tag => tag.trim()) : []
            });
        });
    } catch (error) {
        console.error('Error fetching pins:', error);
        // Return empty array if fetch fails
        return [];
    }
}

// Export the function to get pins
export async function getLocationPins() {
    const pins = await fetchPinsFromSheet();
    // Return fetched pins or fallback to empty array if fetch fails
    return pins;
}

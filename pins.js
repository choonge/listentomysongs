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
        this.youtubeLink = youtubeLink;
        this.rating = rating;
        this.position = { lat, lng };
        this.tags = tags;
    }
}

// Hardcoded list of location pins
export const locationPins = [
    new LocationPin({
        title: "Dormy Inn Korakuen",
        youtubeLink: "https://www.youtube.com/watch?v=BP9wwPW78UE",
        rating: 4,
        lat: 35.7102278,
        lng: 139.7509408,
        tags: ["hotel", "all you can eat", "breakfast", "buffet"]
    }),
    new LocationPin({
        title: "Don Pollon",
        youtubeLink: "https://www.youtube.com/watch?v=0iwUrxPrC2Q",
        rating: 5,
        lat: 34.02837,
        lng: -118.1571796,
        tags: ["food truck"]
    })
];

export { LocationPin };

// Data structure for a pin
class LocationPin {
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

// Hardcoded list of location pins
export const locationPins = [
    new LocationPin({
        title: "Dormy Inn Korakuen",
        description: "Capsule hotel with all you can eat breakfast.",
        youtubeLink: "https://www.youtube.com/watch?v=BP9wwPW78UE",
        rating: 4,
        lat: 35.7102278,
        lng: 139.7509408,
        tags: ["hotel", "all you can eat", "breakfast", "buffet"]
    }),
    new LocationPin({
        title: "Don Pollon",
        description: "Mexican food truck.",
        youtubeLink: "https://www.youtube.com/watch?v=0iwUrxPrC2Q",
        rating: 5,
        lat: 34.02837,
        lng: -118.1571796,
        tags: ["food truck"]
    }),
    new LocationPin({
        title: "Bun & Blanket",
        description: "American Korean fusion burger truck.",
        youtubeLink: "https://www.youtube.com/watch?v=0iwUrxPrC2Q",
        rating: 4,
        lat: 34.1300681,
        lng: -118.2619128,
        tags: ["food truck"]
    }),
    new LocationPin({
        title: "Kogi BBQ",
        description: "Mexican Korean food truck. They move around, see https://kogibbq.com/ for locations.",
        youtubeLink: "https://www.youtube.com/watch?v=0iwUrxPrC2Q",
        rating: 4,
        lat: 34.0200392,
        lng: -118.741362,
        tags: ["food truck"]
    }),
];

export { LocationPin };

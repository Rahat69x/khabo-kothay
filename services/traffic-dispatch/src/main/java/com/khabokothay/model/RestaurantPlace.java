package com.khabokothay.model;

import java.util.List;

/**
 * Representation of a discovered dining venue in Dhaka.
 */
public record RestaurantPlace(
        String id,
        String name,
        Coordinates coordinates,
        String areaName,
        double rating,
        int reviewCount,
        int priceTier,
        List<String> tags
) {
    public RestaurantPlace {
        if (id == null || id.isBlank()) throw new IllegalArgumentException("ID cannot be empty");
        if (name == null || name.isBlank()) throw new IllegalArgumentException("Name cannot be empty");
        if (coordinates == null) throw new IllegalArgumentException("Coordinates cannot be null");
    }

    public double distanceTo(Coordinates origin) {
        return this.coordinates.distanceToKm(origin);
    }
}

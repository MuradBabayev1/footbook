package com.example.footbook.enums;

public enum StadiumType {
    GRASS("Natural Grass Field"),
    ARTIFICIAL_TURF("Artificial Turf Field"),
    INDOOR("Indoor Stadium"),
    HYBRID("Hybrid Surface");

    private final String description;

    StadiumType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}

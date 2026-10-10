package com.khabokothay.model;

/**
 * Supported Dhaka transit modes for cafe routing.
 */
public enum TransitMode {
    WALKING("Walking", 4.5, 0.0, 0.0, false),
    RICKSHAW("Rickshaw", 10.0, 30.0, 25.0, false),
    CNG("CNG Auto-Rickshaw", 24.0, 60.0, 42.0, true),
    CAR("Uber / Private Car", 28.0, 120.0, 55.0, true);

    private final String displayName;
    private final double avgSpeedKmh;
    private final double baseFareBdt;
    private final double perKmFareBdt;
    private final boolean motorized;

    TransitMode(String displayName, double avgSpeedKmh, double baseFareBdt, double perKmFareBdt, boolean motorized) {
        this.displayName = displayName;
        this.avgSpeedKmh = avgSpeedKmh;
        this.baseFareBdt = baseFareBdt;
        this.perKmFareBdt = perKmFareBdt;
        this.motorized = motorized;
    }

    public String getDisplayName() {
        return displayName;
    }

    public double getAvgSpeedKmh() {
        return avgSpeedKmh;
    }

    public double getBaseFareBdt() {
        return baseFareBdt;
    }

    public double getPerKmFareBdt() {
        return perKmFareBdt;
    }

    public boolean isMotorized() {
        return motorized;
    }
}

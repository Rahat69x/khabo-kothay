package com.khabokothay.traffic;

import com.khabokothay.geofence.DhakaGeofenceManager;
import com.khabokothay.model.Coordinates;
import com.khabokothay.model.TransitMode;
import com.khabokothay.model.TripQuote;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

/**
 * Real-time Traffic Dispatch & Fare Engine for Dhaka transit.
 * Calculates dynamic travel times, peak hour congestion curves, monsoon surge,
 * and geofenced transit feasibility.
 */
public class TrafficDispatchEngine {

    public enum WeatherCondition {
        CLEAR(1.00),
        LIGHT_RAIN(1.30),
        HEAVY_MONSOON(1.65);

        private final double multiplier;

        WeatherCondition(double multiplier) {
            this.multiplier = multiplier;
        }

        public double getMultiplier() {
            return multiplier;
        }
    }

    private final DhakaGeofenceManager geofenceManager;

    public TrafficDispatchEngine(DhakaGeofenceManager geofenceManager) {
        this.geofenceManager = Objects.requireNonNull(geofenceManager, "GeofenceManager must not be null");
    }

    public TrafficDispatchEngine() {
        this(new DhakaGeofenceManager());
    }

    /**
     * Calculates time-of-day traffic surge factor based on empirical Dhaka congestion patterns.
     */
    public double calculateTimeOfDaySurge(LocalTime time) {
        int minutes = time.getHour() * 60 + time.getMinute();

        // Morning Rush: 08:30 (510 min) - 10:30 (630 min)
        if (minutes >= 510 && minutes <= 630) {
            return 1.60;
        }
        // Afternoon Lunch / School rush: 13:00 (780 min) - 14:30 (870 min)
        if (minutes >= 780 && minutes <= 870) {
            return 1.35;
        }
        // Evening Peak (Office dispersal + Dinner): 17:00 (1020 min) - 20:30 (1230 min)
        if (minutes >= 1020 && minutes <= 1230) {
            return 1.95;
        }
        // Late Night: 22:00 - 06:00
        if (minutes >= 1320 || minutes < 360) {
            return 0.95;
        }
        // Regular mid-day baseline
        return 1.15;
    }

    /**
     * Generates a trip quote for a specific mode between two locations.
     */
    public TripQuote quoteTrip(
            TransitMode mode,
            Coordinates origin,
            Coordinates destination,
            LocalTime departureTime,
            WeatherCondition weather
    ) {
        double distKm = origin.distanceToKm(destination);
        boolean permitted = geofenceManager.isTransitPermitted(mode, origin, destination);

        if (!permitted) {
            String note = distKm > 5.0 && mode == TransitMode.RICKSHAW
                    ? "Exceeds 5km non-motorized municipal boundary"
                    : "Prohibited arterial flyover corridor";
            return new TripQuote(mode, distKm, 0.0, 0.0, 1.0, false, note);
        }

        if (mode == TransitMode.WALKING) {
            // Walking is unaffected by traffic congestion, but slight monsoon degradation
            double walkingSpeed = mode.getAvgSpeedKmh() / (weather == WeatherCondition.HEAVY_MONSOON ? 1.3 : 1.0);
            double durationMins = (distKm / walkingSpeed) * 60.0;
            return new TripQuote(mode, distKm, durationMins, 0.0, 1.0, true, "Permitted pedestrian route");
        }

        double timeSurge = calculateTimeOfDaySurge(departureTime);
        double zoneSurge = geofenceManager.getAggregateZoneCongestion(origin, destination);
        double weatherSurge = weather.getMultiplier();

        // Composite surge multiplier
        double compositeSurge = Math.min(2.80, (timeSurge * 0.45 + zoneSurge * 0.35 + weatherSurge * 0.20));

        // Effective transit speed after congestion degradation
        double degradedSpeed = Math.max(3.5, mode.getAvgSpeedKmh() / compositeSurge);
        double durationMins = (distKm / degradedSpeed) * 60.0 + (mode.isMotorized() ? 4.0 : 1.5); // Add wait/board time

        // Fare calculation
        double rawFare = (mode.getBaseFareBdt() + (distKm * mode.getPerKmFareBdt())) * compositeSurge;
        double roundedFare = Math.max(mode.getBaseFareBdt(), Math.round(rawFare / 5.0) * 5.0); // Round to nearest 5 BDT

        return new TripQuote(mode, distKm, durationMins, roundedFare, compositeSurge, true, "Active dispatch quote");
    }

    /**
     * Quotes all available transit options and orders them by duration.
     */
    public List<TripQuote> quoteAllModes(
            Coordinates origin,
            Coordinates destination,
            LocalTime departureTime,
            WeatherCondition weather
    ) {
        List<TripQuote> quotes = new ArrayList<>();
        for (TransitMode mode : TransitMode.values()) {
            quotes.add(quoteTrip(mode, origin, destination, departureTime, weather));
        }
        quotes.sort(Comparator.comparingDouble(q -> q.routePermitted() ? q.estimatedDurationMinutes() : Double.MAX_VALUE));
        return quotes;
    }

    public DhakaGeofenceManager getGeofenceManager() {
        return geofenceManager;
    }
}

#ifndef ROUTING_CORE_HPP
#define ROUTING_CORE_HPP

#include <string>
#include <vector>
#include <unordered_map>
#include "KDTree.hpp"

namespace KhaboKothay {

enum class VehicleMode {
    Walking,
    Rickshaw,
    CNG,
    Car
};

struct ModeParameters {
    std::string name;
    double baseFareBDT;
    double perKmRateBDT;
    double avgSpeedKmh;
    double minFareBDT;
};

struct RouteEstimate {
    VehicleMode mode;
    std::string modeName;
    double distanceMeters;
    double durationMinutes;
    double fareBDT;
    std::string trafficCondition;
};

struct PlaceRecommendation {
    GeoPoint place;
    double rankScore;
    double travelDurationMinutes;
    double travelFareBDT;
    std::string bestVehicleMode;
    std::string recommendationReason;
};

class RoutingCore {
public:
    RoutingCore();

    // Mode configuration
    void setModeParams(VehicleMode mode, const ModeParameters& params);
    ModeParameters getModeParams(VehicleMode mode) const;

    // Traffic congestion modifier (1.0 = normal, 1.4 = moderate, 1.9 = heavy)
    void setCongestionFactor(double factor);
    double getCongestionFactor() const;

    // Calculate individual route estimate
    RouteEstimate calculateRoute(double lat1, double lng1, double lat2, double lng2, VehicleMode mode) const;

    // Calculate all route options
    std::vector<RouteEstimate> compareAllModes(double lat1, double lng1, double lat2, double lng2) const;

    // Rank candidate restaurants using multi-criteria utility function
    std::vector<PlaceRecommendation> rankCandidates(
        double userLat,
        double userLng,
        const std::vector<GeoPoint>& candidates,
        const std::string& preferredCuisine = "All",
        double maxBudgetBDT = 5000.0,
        const std::string& priority = "Best Overall"
    ) const;

private:
    std::unordered_map<int, ModeParameters> parameters;
    double congestionFactor;
};

} // namespace KhaboKothay

#endif // ROUTING_CORE_HPP

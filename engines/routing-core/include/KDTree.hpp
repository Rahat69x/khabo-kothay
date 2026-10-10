#ifndef KD_TREE_HPP
#define KD_TREE_HPP

#include <vector>
#include <string>
#include <memory>
#include <cmath>
#include <limits>
#include <algorithm>

namespace KhaboKothay {

struct GeoPoint {
    std::string id;
    std::string name;
    double lat;
    double lng;
    double pricePerPerson;
    double rating;
    std::string cuisine;

    GeoPoint() : lat(0.0), lng(0.0), pricePerPerson(0.0), rating(0.0) {}

    GeoPoint(std::string id_, std::string name_, double lat_, double lng_, double price_, double rating_, std::string cuisine_)
        : id(std::move(id_)), name(std::move(name_)), lat(lat_), lng(lng_), pricePerPerson(price_), rating(rating_), cuisine(std::move(cuisine_)) {}
};

struct KDNode {
    GeoPoint point;
    std::unique_ptr<KDNode> left;
    std::unique_ptr<KDNode> right;
    int axis; // 0 for latitude, 1 for longitude

    explicit KDNode(GeoPoint p, int ax = 0)
        : point(std::move(p)), left(nullptr), right(nullptr), axis(ax) {}
};

class KDTree {
public:
    KDTree();
    ~KDTree() = default;

    void build(std::vector<GeoPoint> points);
    size_t size() const;
    bool empty() const;

    // Haversine distance in meters between two lat/lng coordinates
    static double haversineDistanceMeters(double lat1, double lng1, double lat2, double lng2);

    // Find single nearest neighbor
    GeoPoint findNearest(double lat, double lng) const;

    // Find k nearest neighbors sorted by distance
    std::vector<std::pair<GeoPoint, double>> findKNearest(double lat, double lng, size_t k) const;

    // Find all points within radius meters
    std::vector<std::pair<GeoPoint, double>> findWithinRadius(double lat, double lng, double radiusMeters) const;

private:
    std::unique_ptr<KDNode> root;
    size_t nodeCount;

    std::unique_ptr<KDNode> buildRecursive(std::vector<GeoPoint>& pts, int depth);

    void nearestRecursive(const KDNode* node, double targetLat, double targetLng,
                          const KDNode*& bestNode, double& bestDist) const;

    void kNearestRecursive(const KDNode* node, double targetLat, double targetLng, size_t k,
                           std::vector<std::pair<GeoPoint, double>>& bestList) const;

    void radiusRecursive(const KDNode* node, double targetLat, double targetLng, double radius,
                         std::vector<std::pair<GeoPoint, double>>& result) const;
};

} // namespace KhaboKothay

#endif // KD_TREE_HPP

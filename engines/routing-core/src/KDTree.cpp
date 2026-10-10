#include "../include/KDTree.hpp"

namespace KhaboKothay {

constexpr double EARTH_RADIUS_METERS = 6371000.0;
constexpr double DEG_TO_RAD = 3.14159265358979323846 / 180.0;

KDTree::KDTree() : root(nullptr), nodeCount(0) {}

size_t KDTree::size() const {
    return nodeCount;
}

bool KDTree::empty() const {
    return nodeCount == 0;
}

double KDTree::haversineDistanceMeters(double lat1, double lng1, double lat2, double lng2) {
    const double dLat = (lat2 - lat1) * DEG_TO_RAD;
    const double dLng = (lng2 - lng1) * DEG_TO_RAD;

    const double a = std::sin(dLat / 2.0) * std::sin(dLat / 2.0) +
                     std::cos(lat1 * DEG_TO_RAD) * std::cos(lat2 * DEG_TO_RAD) *
                     std::sin(dLng / 2.0) * std::sin(dLng / 2.0);

    const double c = 2.0 * std::atan2(std::sqrt(a), std::sqrt(1.0 - a));
    return EARTH_RADIUS_METERS * c;
}

void KDTree::build(std::vector<GeoPoint> points) {
    nodeCount = points.size();
    root = buildRecursive(points, 0);
}

std::unique_ptr<KDNode> KDTree::buildRecursive(std::vector<GeoPoint>& pts, int depth) {
    if (pts.empty()) return nullptr;

    const int axis = depth % 2;

    auto comparator = [axis](const GeoPoint& a, const GeoPoint& b) {
        return (axis == 0) ? (a.lat < b.lat) : (a.lng < b.lng);
    };

    const size_t medianIdx = pts.size() / 2;
    std::nth_element(pts.begin(), pts.begin() + medianIdx, pts.end(), comparator);

    auto node = std::make_unique<KDNode>(pts[medianIdx], axis);

    std::vector<GeoPoint> leftPts(pts.begin(), pts.begin() + medianIdx);
    std::vector<GeoPoint> rightPts(pts.begin() + medianIdx + 1, pts.end());

    node->left = buildRecursive(leftPts, depth + 1);
    node->right = buildRecursive(rightPts, depth + 1);

    return node;
}

GeoPoint KDTree::findNearest(double lat, double lng) const {
    if (!root) return GeoPoint();

    const KDNode* bestNode = nullptr;
    double bestDist = std::numeric_limits<double>::max();

    nearestRecursive(root.get(), lat, lng, bestNode, bestDist);
    return bestNode ? bestNode->point : GeoPoint();
}

void KDTree::nearestRecursive(const KDNode* node, double targetLat, double targetLng,
                              const KDNode*& bestNode, double& bestDist) const {
    if (!node) return;

    const double d = haversineDistanceMeters(targetLat, targetLng, node->point.lat, node->point.lng);
    if (d < bestDist) {
        bestDist = d;
        bestNode = node;
    }

    const double targetVal = (node->axis == 0) ? targetLat : targetLng;
    const double nodeVal   = (node->axis == 0) ? node->point.lat : node->point.lng;

    const KDNode* primary = (targetVal < nodeVal) ? node->left.get() : node->right.get();
    const KDNode* opposite = (targetVal < nodeVal) ? node->right.get() : node->left.get();

    nearestRecursive(primary, targetLat, targetLng, bestNode, bestDist);

    // Approximate angular distance on the split plane to determine if opposite side could be closer
    const double axisDiffDegrees = std::abs(targetVal - nodeVal);
    const double axisDiffMeters = axisDiffDegrees * (111320.0 * (node->axis == 1 ? std::cos(targetLat * DEG_TO_RAD) : 1.0));

    if (axisDiffMeters < bestDist) {
        nearestRecursive(opposite, targetLat, targetLng, bestNode, bestDist);
    }
}

std::vector<std::pair<GeoPoint, double>> KDTree::findKNearest(double lat, double lng, size_t k) const {
    std::vector<std::pair<GeoPoint, double>> bestList;
    if (!root || k == 0) return bestList;

    bestList.reserve(k);
    kNearestRecursive(root.get(), lat, lng, k, bestList);
    return bestList;
}

void KDTree::kNearestRecursive(const KDNode* node, double targetLat, double targetLng, size_t k,
                              std::vector<std::pair<GeoPoint, double>>& bestList) const {
    if (!node) return;

    const double d = haversineDistanceMeters(targetLat, targetLng, node->point.lat, node->point.lng);

    if (bestList.size() < k) {
        bestList.emplace_back(node->point, d);
        std::sort(bestList.begin(), bestList.end(), [](const auto& a, const auto& b) {
            return a.second < b.second;
        });
    } else if (d < bestList.back().second) {
        bestList.back() = { node->point, d };
        std::sort(bestList.begin(), bestList.end(), [](const auto& a, const auto& b) {
            return a.second < b.second;
        });
    }

    const double targetVal = (node->axis == 0) ? targetLat : targetLng;
    const double nodeVal   = (node->axis == 0) ? node->point.lat : node->point.lng;

    const KDNode* primary = (targetVal < nodeVal) ? node->left.get() : node->right.get();
    const KDNode* opposite = (targetVal < nodeVal) ? node->right.get() : node->left.get();

    kNearestRecursive(primary, targetLat, targetLng, k, bestList);

    const double maxBestDist = bestList.empty() ? std::numeric_limits<double>::max() : bestList.back().second;
    const double axisDiffDegrees = std::abs(targetVal - nodeVal);
    const double axisDiffMeters = axisDiffDegrees * (111320.0 * (node->axis == 1 ? std::cos(targetLat * DEG_TO_RAD) : 1.0));

    if (bestList.size() < k || axisDiffMeters < maxBestDist) {
        kNearestRecursive(opposite, targetLat, targetLng, k, bestList);
    }
}

std::vector<std::pair<GeoPoint, double>> KDTree::findWithinRadius(double lat, double lng, double radiusMeters) const {
    std::vector<std::pair<GeoPoint, double>> result;
    if (!root) return result;

    radiusRecursive(root.get(), lat, lng, radiusMeters, result);
    std::sort(result.begin(), result.end(), [](const auto& a, const auto& b) {
        return a.second < b.second;
    });
    return result;
}

void KDTree::radiusRecursive(const KDNode* node, double targetLat, double targetLng, double radius,
                            std::vector<std::pair<GeoPoint, double>>& result) const {
    if (!node) return;

    const double d = haversineDistanceMeters(targetLat, targetLng, node->point.lat, node->point.lng);
    if (d <= radius) {
        result.emplace_back(node->point, d);
    }

    const double targetVal = (node->axis == 0) ? targetLat : targetLng;
    const double nodeVal   = (node->axis == 0) ? node->point.lat : node->point.lng;

    const KDNode* primary = (targetVal < nodeVal) ? node->left.get() : node->right.get();
    const KDNode* opposite = (targetVal < nodeVal) ? node->right.get() : node->left.get();

    radiusRecursive(primary, targetLat, targetLng, radius, result);

    const double axisDiffDegrees = std::abs(targetVal - nodeVal);
    const double axisDiffMeters = axisDiffDegrees * (111320.0 * (node->axis == 1 ? std::cos(targetLat * DEG_TO_RAD) : 1.0));

    if (axisDiffMeters <= radius) {
        radiusRecursive(opposite, targetLat, targetLng, radius, result);
    }
}

} // namespace KhaboKothay

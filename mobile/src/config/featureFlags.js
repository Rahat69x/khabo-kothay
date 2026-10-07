/**
 * Feature Flags for Mobile App
 * Allows safely gating new algorithms and experimental features
 */
export const featureFlags = {
  enableWeatherAwareness: true,
  enableOfflineCache: true,
  enableLocalNotifications: true,
  enableVisitRatingPrompt: true,
  enableSentryCrashReporting: false, // Off by default as required
  enableCollaborativeFiltering: false, // Flag for collaborative recommendations
  enableDeparturePredictions: true,
  enableTimeBudgetMode: true,
  enableBanditPersonalWeights: true,
  enablePreferenceFilters: true,
  enableCounterfactualExplanations: true
};

export default featureFlags;

/**
 * Server Feature Flags
 * Controls operational, algorithmic, and experimental features
 */
export const featureFlags = {
  // P1: Reliability, Cost Control and Operations
  enableCoarseGridCache: true,
  enableTrafficCache: true,
  enableStaleWhileRevalidate: true,
  enableDeviceDailyLimit: true,
  enableMonthlyBudgetKillSwitch: true,
  enableRedisCache: Boolean(process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL),
  enableUsageCounters: true,
  enableSentry: Boolean(process.env.SENTRY_DSN && process.env.ENABLE_SENTRY === 'true'),
  enableApiV1: true,

  // P2: Smarter Decisions
  enableDeparturePredictions: true,
  enableTimeBudgetMode: true,
  enableBanditPersonalWeights: true,
  enablePreferenceFilters: true,
  enableCounterfactualExplanations: true,
  enableABTestingWeights: false,

  // Advanced features
  enableCollaborativeFiltering: false
};

export default featureFlags;

export function formatDurationMinutes(seconds) {
  if (!seconds || seconds <= 0) return '0 min';
  const mins = Math.max(1, Math.round(seconds / 60));
  return `${mins} min`;
}

export function formatDistanceKm(meters) {
  if (!meters || meters <= 0) return '0 km';
  const km = (meters / 1000).toFixed(1);
  return `${km} km`;
}

export function formatBdt(amount, isEstimate = true) {
  const val = typeof amount === 'number' ? Math.round(amount) : 0;
  return `~৳${val}${isEstimate ? ' (est)' : ''}`;
}

export function formatPriceLevel(level) {
  if (!level) return '৳৳';
  return '৳'.repeat(Math.min(4, Math.max(1, level)));
}

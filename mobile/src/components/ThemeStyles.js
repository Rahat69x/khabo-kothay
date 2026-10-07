/**
 * Brand UI Theme Style Computation
 * Pure functions mapping Brand Indigo & Saffron tokens to Button, Chip, Badge, TrafficChip, and Card styles
 */

export function getBadgeStyle(badgeName, theme) {
  const lower = String(badgeName || '').toLowerCase();
  if (lower.includes('best overall') || lower.includes('top pick') || lower.includes('best match')) {
    return {
      bg: theme.colors.badgeBest,
      text: theme.colors.badgeBestText,
      border: 'transparent'
    };
  }
  if (lower.includes('price') || lower.includes('fastest') || lower.includes('nearest')) {
    return {
      bg: theme.colors.badgeFast,
      text: theme.colors.badgeFastText,
      border: 'transparent'
    };
  }
  if (lower.includes('new') || lower.includes('try something new')) {
    return {
      bg: 'transparent',
      text: theme.colors.badgeNewText,
      border: theme.colors.badgeNewBorder
    };
  }
  if (lower.includes('verified') || lower.includes('community')) {
    return {
      bg: theme.colors.badgeVerified,
      text: theme.colors.badgeVerifiedText,
      border: 'transparent'
    };
  }
  return {
    bg: theme.colors.surfaceAlt,
    text: theme.colors.textMuted,
    border: 'transparent'
  };
}

export function getTrafficChipStyle(level, theme) {
  const norm = String(level || '').toLowerCase();
  if (norm.includes('low') || norm.includes('light')) {
    return {
      bg: theme.colors.trafficLowTint,
      text: theme.colors.trafficLow,
      icon: '🟢',
      label: 'Low Traffic'
    };
  }
  if (norm.includes('moderate') || norm.includes('medium')) {
    return {
      bg: theme.colors.trafficModerateTint,
      text: theme.colors.trafficModerate,
      icon: '🟡',
      label: 'Moderate Traffic'
    };
  }
  return {
    bg: theme.colors.trafficHeavyTint,
    text: theme.colors.trafficHeavy,
    icon: '🔴',
    label: 'Heavy Traffic'
  };
}

export function getChipStyle(active, theme) {
  return {
    container: {
      backgroundColor: active ? theme.colors.primary : theme.colors.surface,
      borderColor: active ? theme.colors.primary : theme.colors.border,
      borderWidth: 1
    },
    text: {
      color: active ? theme.colors.onPrimary : theme.colors.text
    }
  };
}

export function getButtonStyle(variant = 'primary', theme) {
  if (variant === 'secondary') {
    return {
      container: {
        backgroundColor: theme.colors.surfaceAlt,
        borderColor: theme.colors.border,
        borderWidth: 1
      },
      text: {
        color: theme.colors.text
      }
    };
  }
  if (variant === 'outline') {
    return {
      container: {
        backgroundColor: 'transparent',
        borderColor: theme.colors.primary,
        borderWidth: 1
      },
      text: {
        color: theme.colors.primary
      }
    };
  }
  return {
    container: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      borderWidth: 0
    },
    text: {
      color: theme.colors.onPrimary
    }
  };
}

export function getResultCardStyle(theme) {
  return {
    container: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1
    },
    title: {
      color: theme.colors.text
    },
    muted: {
      color: theme.colors.textMuted
    },
    rank: {
      color: theme.colors.primary
    },
    scoreBadge: {
      backgroundColor: theme.colors.primaryTint
    },
    scoreText: {
      color: theme.colors.primary
    }
  };
}

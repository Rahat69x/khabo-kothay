import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * Brand UI Theme Helper Functions & Components
 * Enforces Indigo & Saffron Design Tokens across Mobile
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

export function BrandBadge({ label, theme, style, textStyle }) {
  const bStyle = getBadgeStyle(label, theme);
  return React.createElement(
    View,
    {
      style: [
        styles.badge,
        {
          backgroundColor: bStyle.bg,
          borderColor: bStyle.border,
          borderWidth: bStyle.border !== 'transparent' ? 1 : 0
        },
        style
      ]
    },
    React.createElement(Text, { style: [styles.badgeText, { color: bStyle.text }, textStyle] }, label)
  );
}

export function BrandTrafficChip({ level, theme, style, textStyle }) {
  const tStyle = getTrafficChipStyle(level, theme);
  return React.createElement(
    View,
    { style: [styles.trafficChip, { backgroundColor: tStyle.bg }, style] },
    React.createElement(Text, { style: [styles.trafficText, { color: tStyle.text }, textStyle] }, `${tStyle.icon} ${tStyle.label}`)
  );
}

export function BrandChip({ label, active, theme, onPress, style, textStyle }) {
  const cStyle = getChipStyle(active, theme);
  return React.createElement(
    TouchableOpacity,
    {
      style: [styles.chip, cStyle.container, style],
      onPress,
      activeOpacity: 0.7
    },
    React.createElement(Text, { style: [styles.chipText, cStyle.text, textStyle] }, label)
  );
}

export function BrandButton({ title, variant = 'primary', theme, onPress, style, textStyle }) {
  const btnStyle = getButtonStyle(variant, theme);
  return React.createElement(
    TouchableOpacity,
    {
      style: [styles.button, btnStyle.container, style],
      onPress,
      activeOpacity: 0.8
    },
    React.createElement(Text, { style: [styles.buttonText, btnStyle.text, textStyle] }, title)
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  trafficChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  trafficText: {
    fontSize: 11,
    fontWeight: '700'
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600'
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700'
  }
});

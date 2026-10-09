import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export const ShimmerBlock: React.FC<{
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}> = ({ width = '100%', height = 16, borderRadius = 6, style }) => {
  const { isDark } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const baseBg = isDark ? '#334155' : '#e2e8f0';

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: baseBg,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
};

export const YouTubeTopProgressBar: React.FC<{ active: boolean }> = ({ active }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      progressAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, progressAnim]);

  if (!active) return null;

  const left = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-30%', '100%'],
  });

  return (
    <View style={styles.topProgressBarContainer}>
      <Animated.View style={[styles.topProgressBarIndicator, { left }]} />
    </View>
  );
};

export const DashboardSkeleton: React.FC = () => {
  const { colors, isDark } = useTheme();
  const cardBg = colors.card;
  const borderColor = colors.cardBorder;

  return (
    <View style={styles.skeletonContainer}>
      {/* 4 KPI Cards Grid Placeholder */}
      <View style={styles.kpiGrid}>
        {[1, 2, 3, 4].map((item) => (
          <View
            key={item}
            style={[
              styles.kpiCardSkeleton,
              { backgroundColor: cardBg, borderColor },
            ]}>
            <ShimmerBlock width="65%" height={12} borderRadius={4} />
            <ShimmerBlock width="50%" height={24} borderRadius={6} style={{ marginVertical: 8 }} />
            <ShimmerBlock width="80%" height={10} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* Monthly Overview Section Placeholder */}
      <View style={[styles.sectionCardSkeleton, { backgroundColor: cardBg, borderColor }]}>
        <ShimmerBlock width="45%" height={16} borderRadius={4} style={{ marginBottom: 14 }} />
        <View style={styles.horizontalRow}>
          {[1, 2, 3, 4].map((m) => (
            <View
              key={m}
              style={[
                styles.overviewItemSkeleton,
                { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor },
              ]}>
              <ShimmerBlock width="70%" height={12} borderRadius={4} />
              <ShimmerBlock width="90%" height={14} borderRadius={4} style={{ marginVertical: 6 }} />
              <ShimmerBlock width="80%" height={10} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>

      {/* Customers Section Placeholder */}
      <View style={[styles.sectionCardSkeleton, { backgroundColor: cardBg, borderColor }]}>
        <ShimmerBlock width="50%" height={18} borderRadius={4} />
        <ShimmerBlock width="70%" height={12} borderRadius={4} style={{ marginTop: 6, marginBottom: 16 }} />

        {/* Search Input Placeholder */}
        <ShimmerBlock width="100%" height={44} borderRadius={10} style={{ marginBottom: 14 }} />

        {/* 3 Customer Cards */}
        {[1, 2, 3].map((c) => (
          <View
            key={c}
            style={[
              styles.custCardSkeleton,
              { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor },
            ]}>
            <View style={styles.custHeaderRow}>
              <ShimmerBlock width={40} height={40} borderRadius={20} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ShimmerBlock width="60%" height={14} borderRadius={4} />
                <ShimmerBlock width="40%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
              </View>
              <ShimmerBlock width={60} height={16} borderRadius={4} />
            </View>
            <View style={styles.actionRowSkeleton}>
              <ShimmerBlock width="30%" height={32} borderRadius={8} />
              <ShimmerBlock width="38%" height={32} borderRadius={8} />
              <ShimmerBlock width="26%" height={32} borderRadius={8} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export const CollectionSkeleton: React.FC = () => {
  const { colors, isDark } = useTheme();
  const cardBg = colors.card;
  const borderColor = colors.cardBorder;

  return (
    <View style={styles.skeletonContainer}>
      {/* Financial Summary Strip Skeleton */}
      <View style={[styles.summaryStripSkeleton, { backgroundColor: cardBg, borderColor }]}>
        <ShimmerBlock width="30%" height={24} borderRadius={6} />
        <ShimmerBlock width="30%" height={24} borderRadius={6} />
        <ShimmerBlock width="30%" height={24} borderRadius={6} />
      </View>

      {/* Search & Filter Skeleton */}
      <View style={[styles.sectionCardSkeleton, { backgroundColor: cardBg, borderColor }]}>
        <ShimmerBlock width="100%" height={42} borderRadius={10} style={{ marginBottom: 12 }} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <ShimmerBlock width={70} height={28} borderRadius={14} />
          <ShimmerBlock width={70} height={28} borderRadius={14} />
          <ShimmerBlock width={70} height={28} borderRadius={14} />
        </View>
      </View>

      {/* Customer 12-Month Calendar Cards Skeleton */}
      {[1, 2, 3].map((item) => (
        <View
          key={item}
          style={[
            styles.custCardSkeleton,
            { backgroundColor: cardBg, borderColor, padding: 14 },
          ]}>
          <View style={styles.custHeaderRow}>
            <View style={{ flex: 1 }}>
              <ShimmerBlock width="55%" height={16} borderRadius={4} />
              <ShimmerBlock width="35%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
            <ShimmerBlock width={70} height={26} borderRadius={6} />
          </View>

          {/* 12 Month Mini Cells Skeleton (2 rows of 6) */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
              <ShimmerBlock
                key={m}
                width="14.8%"
                height={46}
                borderRadius={8}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  topProgressBarContainer: {
    height: 3,
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    overflow: 'hidden',
    position: 'relative',
  },
  topProgressBarIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '40%',
    backgroundColor: '#ef4444', // Classic YouTube red loading progress
    borderRadius: 2,
  },
  skeletonContainer: {
    padding: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  kpiCardSkeleton: {
    flex: 1,
    minWidth: '46%',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    elevation: 1,
  },
  sectionCardSkeleton: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 1,
  },
  horizontalRow: {
    flexDirection: 'row',
    gap: 10,
  },
  overviewItemSkeleton: {
    width: 95,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  custCardSkeleton: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  custHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionRowSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryStripSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
});

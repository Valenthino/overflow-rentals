import React, { useEffect, useMemo, useRef } from 'react';
import { View, Animated, StyleSheet, type ViewStyle } from 'react-native';
import { radius } from '@/lib/theme';
import { useTokens } from '@/providers/ThemeProvider';
import type { ColorTokens } from '@/lib/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius: br = radius.md,
  style,
}: SkeletonProps) {
  const c = useTokens();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: c.surface,
          width: width as number,
          height,
          borderRadius: br,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const c = useTokens();
  const styles = useMemo(() => makeCardStyles(c), [c]);
  return (
    <View style={styles.card}>
      <Skeleton width="40%" height={14} />
      <Skeleton width="60%" height={28} style={{ marginTop: 8 }} />
      <Skeleton width="30%" height={12} style={{ marginTop: 8 }} />
    </View>
  );
}

function makeCardStyles(c: ColorTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.backgroundCard,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
    },
  });
}

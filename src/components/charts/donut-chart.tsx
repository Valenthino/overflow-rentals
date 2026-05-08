import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { arc as d3Arc, pie as d3Pie } from 'd3-shape';
import { spacing } from '@/lib/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { formatCurrency } from '@/lib/utils';
import type { ColorTokens } from '@/lib/theme';

interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({
  data,
  size = 200,
  thickness = 32,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const { tokens, typography } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, typography), [tokens, typography]);

  if (data.length === 0) return null;

  const outerRadius = size / 2;
  const innerRadius = outerRadius - thickness;

  const pieGen = d3Pie<DonutSlice>().value((d) => d.value).sort(null).padAngle(0.018);
  const arcGen = d3Arc<any>().outerRadius(outerRadius).innerRadius(innerRadius).cornerRadius(4);

  const arcs = pieGen(data);

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <Svg width={size} height={size}>
          <G x={outerRadius} y={outerRadius}>
            {arcs.map((a, i) => (
              <Path key={i} d={arcGen(a as any) ?? ''} fill={data[i]?.color ?? tokens.primary} />
            ))}
          </G>
        </Svg>
        {(centerLabel || centerValue) ? (
          <View style={[styles.centerLabel, { width: size, height: size }]}>
            {centerValue ? <Text style={styles.centerValue}>{centerValue}</Text> : null}
            {centerLabel ? <Text style={styles.centerText}>{centerLabel}</Text> : null}
          </View>
        ) : null}
      </View>
      <View style={styles.legend}>
        {data.map((slice) => (
          <View key={slice.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: slice.color ?? tokens.primary }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>
              {slice.label}
            </Text>
            <Text style={styles.legendValue}>{formatCurrency(slice.value)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function makeStyles(c: ColorTokens, typography: ReturnType<typeof import('@/lib/theme').makeTypography>) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: spacing.lg,
    },
    chartWrapper: {
      position: 'relative',
    },
    centerLabel: {
      position: 'absolute',
      top: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerValue: {
      fontSize: 22,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.5,
    },
    centerText: {
      ...typography.caption,
      marginTop: 2,
    },
    legend: {
      width: '100%',
      gap: spacing.xs,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 2,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendLabel: {
      ...typography.bodySmall,
      flex: 1,
    },
    legendValue: {
      ...typography.bodySmall,
      fontWeight: '600',
      color: c.text,
    },
  });
}

export const CHART_COLORS = [
  '#593CFB', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444',
  '#EC4899', '#06B6D4', '#8B5CF6', '#14B8A6', '#F97316',
];

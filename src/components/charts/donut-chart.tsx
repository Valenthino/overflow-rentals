import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { arc as d3Arc, pie as d3Pie } from 'd3-shape';
import { colors, spacing, typography } from '@/lib/theme';
import { formatCurrency } from '@/lib/utils';

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

const CHART_COLORS = [
  colors.chartPurple,
  colors.chartBlue,
  colors.chartGreen,
  colors.chartOrange,
  colors.chartRed,
  colors.chartPink,
  colors.chartCyan,
  '#8B5CF6',
  '#14B8A6',
  '#F97316',
];

export function DonutChart({
  data,
  size = 180,
  thickness = 28,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  if (data.length === 0) return null;

  const outerRadius = size / 2;
  const innerRadius = outerRadius - thickness;

  const pieGen = d3Pie<DonutSlice>()
    .value((d) => d.value)
    .sort(null)
    .padAngle(0.02);

  const arcGen = d3Arc<any>()
    .outerRadius(outerRadius)
    .innerRadius(innerRadius)
    .cornerRadius(3);

  const arcs = pieGen(data);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <Svg width={size} height={size}>
          <G x={outerRadius} y={outerRadius}>
            {arcs.map((a, i) => (
              <Path
                key={i}
                d={arcGen(a as any) ?? ''}
                fill={data[i]?.color ?? CHART_COLORS[i % CHART_COLORS.length]}
              />
            ))}
          </G>
        </Svg>
        {(centerLabel || centerValue) && (
          <View style={[styles.centerLabel, { width: size, height: size }]}>
            {centerValue && <Text style={styles.centerValue}>{centerValue}</Text>}
            {centerLabel && <Text style={styles.centerText}>{centerLabel}</Text>}
          </View>
        )}
      </View>
      <View style={styles.legend}>
        {data.map((slice, i) => (
          <View key={slice.label} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: slice.color ?? CHART_COLORS[i % CHART_COLORS.length] },
              ]}
            />
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

export { CHART_COLORS };

const styles = StyleSheet.create({
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
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
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
    borderRadius: 3,
  },
  legendLabel: {
    ...typography.bodySmall,
    flex: 1,
  },
  legendValue: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text,
  },
});

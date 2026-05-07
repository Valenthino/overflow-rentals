import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Text as SvgText,
  G,
  Rect,
} from 'react-native-svg';
import { line, area, curveMonotoneX } from 'd3-shape';
import { scaleLinear, scalePoint } from 'd3-scale';
import { colors, spacing, typography } from '@/lib/theme';

interface DataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface AreaChartProps {
  data: DataPoint[];
  height?: number;
  showSecondary?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
}

export function AreaChart({
  data,
  height = 220,
  showSecondary = false,
  primaryColor = colors.primary,
  secondaryColor = colors.chartGreen,
  primaryLabel = 'Revenue',
  secondaryLabel = 'Profit',
}: AreaChartProps) {
  if (data.length === 0) return null;

  const width = Dimensions.get('window').width - 64;
  const chartWidth = Math.max(width, 300);
  const padding = { top: 20, right: 16, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const allValues = data.flatMap((d) =>
    showSecondary && d.secondaryValue != null ? [d.value, d.secondaryValue] : [d.value]
  );
  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues, 0);

  const xScale = scalePoint<string>()
    .domain(data.map((d) => d.label))
    .range([0, innerWidth]);

  const yScale = scaleLinear()
    .domain([Math.min(minVal, 0), maxVal * 1.1])
    .range([innerHeight, 0]);

  const lineGen = line<DataPoint>()
    .x((d) => xScale(d.label) ?? 0)
    .y((d) => yScale(d.value))
    .curve(curveMonotoneX);

  const areaGen = area<DataPoint>()
    .x((d) => xScale(d.label) ?? 0)
    .y0(innerHeight)
    .y1((d) => yScale(d.value))
    .curve(curveMonotoneX);

  const secondaryLineGen = line<DataPoint>()
    .x((d) => xScale(d.label) ?? 0)
    .y((d) => yScale(d.secondaryValue ?? 0))
    .curve(curveMonotoneX);

  const secondaryAreaGen = area<DataPoint>()
    .x((d) => xScale(d.label) ?? 0)
    .y0(innerHeight)
    .y1((d) => yScale(d.secondaryValue ?? 0))
    .curve(curveMonotoneX);

  const primaryPath = lineGen(data) ?? '';
  const primaryArea = areaGen(data) ?? '';
  const secondaryPath = showSecondary ? secondaryLineGen(data) ?? '' : '';
  const secondaryArea = showSecondary ? secondaryAreaGen(data) ?? '' : '';

  const yTicks = yScale.ticks(5);
  const labelStep = data.length > 8 ? Math.ceil(data.length / 6) : 1;

  return (
    <View>
      {(primaryLabel || secondaryLabel) && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: primaryColor }]} />
            <Text style={styles.legendText}>{primaryLabel}</Text>
          </View>
          {showSecondary && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: secondaryColor }]} />
              <Text style={styles.legendText}>{secondaryLabel}</Text>
            </View>
          )}
        </View>
      )}
      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={primaryColor} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={primaryColor} stopOpacity={0.02} />
          </LinearGradient>
          <LinearGradient id="secondaryGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={secondaryColor} stopOpacity={0.2} />
            <Stop offset="100%" stopColor={secondaryColor} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>
        <G x={padding.left} y={padding.top}>
          {yTicks.map((tick) => (
            <G key={tick}>
              <Line
                x1={0}
                y1={yScale(tick)}
                x2={innerWidth}
                y2={yScale(tick)}
                stroke={colors.border}
                strokeWidth={0.5}
                strokeDasharray="4,4"
              />
              <SvgText
                x={-8}
                y={yScale(tick) + 4}
                fontSize={10}
                fill={colors.textMuted}
                textAnchor="end"
              >
                {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick.toFixed(0)}
              </SvgText>
            </G>
          ))}

          {showSecondary && (
            <>
              <Path d={secondaryArea} fill="url(#secondaryGrad)" />
              <Path
                d={secondaryPath}
                stroke={secondaryColor}
                strokeWidth={2}
                fill="none"
                strokeDasharray="6,4"
              />
            </>
          )}

          <Path d={primaryArea} fill="url(#primaryGrad)" />
          <Path d={primaryPath} stroke={primaryColor} strokeWidth={2.5} fill="none" />

          {data.map((d, i) => {
            const cx = xScale(d.label) ?? 0;
            return (
              <G key={d.label}>
                <Rect
                  x={cx - 3}
                  y={yScale(d.value) - 3}
                  width={6}
                  height={6}
                  rx={3}
                  fill={primaryColor}
                />
                {i % labelStep === 0 && (
                  <SvgText
                    x={cx}
                    y={innerHeight + 20}
                    fontSize={10}
                    fill={colors.textMuted}
                    textAnchor="middle"
                  >
                    {d.label}
                  </SvgText>
                )}
              </G>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.sm,
    paddingLeft: 50,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...typography.caption,
  },
});

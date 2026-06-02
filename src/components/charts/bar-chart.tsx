import React, { useId, useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Rect, G, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { scaleLinear, scaleBand } from 'd3-scale';
import { radius, spacing } from '@/lib/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { formatCompact } from '@/lib/utils';
import type { ColorTokens } from '@/lib/theme';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarData[];
  height?: number;
  barColor?: string;
  horizontal?: boolean;
}

export function BarChart({ data, height = 220, barColor, horizontal = false }: BarChartProps) {
  const { tokens } = useTheme();
  const { width } = useWindowDimensions();
  const uid = useId().replace(/[:]/g, '');

  if (data.length === 0) return null;

  const color = barColor ?? tokens.primary;
  const chartWidth = Math.min(Math.max(width - 80, 280), 900);

  if (horizontal) {
    return <HorizontalBarChart data={data} barColor={color} tokens={tokens} />;
  }

  const padding = { top: 12, right: 12, bottom: 36, left: 48 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  const xScale = scaleBand<string>().domain(data.map((d) => d.label)).range([0, innerWidth]).padding(0.32);
  const yScale = scaleLinear().domain([0, maxVal * 1.1]).range([innerHeight, 0]);

  const yTicks = yScale.ticks(4);
  const barWidth = xScale.bandwidth();

  return (
    <Svg width={chartWidth} height={height}>
      <Defs>
        <LinearGradient id={`barGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={1} />
          <Stop offset="100%" stopColor={color} stopOpacity={0.55} />
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
              stroke={tokens.chartGridLine}
              strokeWidth={0.6}
              strokeDasharray="3,5"
            />
            <SvgText x={-8} y={yScale(tick) + 4} fontSize={10} fill={tokens.textMuted} textAnchor="end">
              {formatCompact(tick)}
            </SvgText>
          </G>
        ))}
        {data.map((d) => {
          const x = xScale(d.label) ?? 0;
          const barH = innerHeight - yScale(d.value);
          return (
            <G key={d.label}>
              <Rect
                x={x}
                y={yScale(d.value)}
                width={barWidth}
                height={barH}
                rx={6}
                fill={d.color ?? `url(#barGrad-${uid})`}
              />
              <SvgText
                x={x + barWidth / 2}
                y={yScale(d.value) - 6}
                fontSize={10}
                fontWeight="600"
                fill={tokens.textSecondary}
                textAnchor="middle"
              >
                {formatCompact(d.value)}
              </SvgText>
              <SvgText
                x={x + barWidth / 2}
                y={innerHeight + 20}
                fontSize={10}
                fill={tokens.textMuted}
                textAnchor="middle"
              >
                {d.label.length > 8 ? `${d.label.slice(0, 8)}…` : d.label}
              </SvgText>
            </G>
          );
        })}
      </G>
    </Svg>
  );
}

function HorizontalBarChart({
  data,
  barColor,
  tokens,
}: {
  data: BarData[];
  barColor: string;
  tokens: ColorTokens;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const styles = useMemo(() => makeHStyles(tokens), [tokens]);
  return (
    <View style={styles.container}>
      {data.map((d) => {
        const pct = (d.value / maxVal) * 100;
        return (
          <View key={d.label} style={styles.row}>
            <Text style={styles.label} numberOfLines={1}>
              {d.label}
            </Text>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  { width: `${pct}%`, backgroundColor: d.color ?? barColor },
                ]}
              />
            </View>
            <Text style={styles.value}>{formatCompact(d.value)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function makeHStyles(c: ColorTokens) {
  return StyleSheet.create({
    container: { gap: spacing.sm },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    label: { fontSize: 13, color: c.textSecondary, width: 80, textAlign: 'right' },
    barContainer: {
      flex: 1,
      height: 22,
      backgroundColor: c.surface,
      borderRadius: radius.sm,
      overflow: 'hidden',
    },
    bar: { height: '100%', borderRadius: radius.sm },
    value: { fontSize: 13, fontWeight: '600', color: c.text, width: 60 },
  });
}

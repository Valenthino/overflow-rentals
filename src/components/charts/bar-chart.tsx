import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, G, Line, Text as SvgText } from 'react-native-svg';
import { scaleLinear, scaleBand } from 'd3-scale';
import { colors, spacing, typography, radius } from '@/lib/theme';

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

export function BarChart({
  data,
  height = 200,
  barColor = colors.primary,
  horizontal = false,
}: BarChartProps) {
  if (data.length === 0) return null;

  const width = Dimensions.get('window').width - 64;
  const chartWidth = Math.max(width, 300);

  if (horizontal) {
    return <HorizontalBarChart data={data} height={height} barColor={barColor} />;
  }

  const padding = { top: 10, right: 10, bottom: 40, left: 45 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  const xScale = scaleBand<string>()
    .domain(data.map((d) => d.label))
    .range([0, innerWidth])
    .padding(0.3);

  const yScale = scaleLinear()
    .domain([0, maxVal * 1.1])
    .range([innerHeight, 0]);

  const yTicks = yScale.ticks(4);
  const barWidth = xScale.bandwidth();

  return (
    <Svg width={chartWidth} height={height}>
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
            <SvgText x={-8} y={yScale(tick) + 4} fontSize={10} fill={colors.textMuted} textAnchor="end">
              {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick.toFixed(0)}
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
                rx={4}
                fill={d.color ?? barColor}
                opacity={0.85}
              />
              <SvgText
                x={x + barWidth / 2}
                y={innerHeight + 20}
                fontSize={10}
                fill={colors.textMuted}
                textAnchor="middle"
              >
                {d.label.length > 6 ? d.label.slice(0, 6) : d.label}
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
  height,
  barColor,
}: {
  data: BarData[];
  height: number;
  barColor: string;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={hStyles.container}>
      {data.map((d) => {
        const pct = (d.value / maxVal) * 100;
        return (
          <View key={d.label} style={hStyles.row}>
            <Text style={hStyles.label} numberOfLines={1}>
              {d.label}
            </Text>
            <View style={hStyles.barContainer}>
              <View
                style={[
                  hStyles.bar,
                  { width: `${pct}%`, backgroundColor: d.color ?? barColor },
                ]}
              />
            </View>
            <Text style={hStyles.value}>{d.value.toLocaleString()}</Text>
          </View>
        );
      })}
    </View>
  );
}

const hStyles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { ...typography.bodySmall, width: 80, textAlign: 'right' },
  barContainer: { flex: 1, height: 20, backgroundColor: colors.surface, borderRadius: radius.sm },
  bar: { height: '100%', borderRadius: radius.sm },
  value: { ...typography.bodySmall, fontWeight: '600', color: colors.text, width: 60 },
});

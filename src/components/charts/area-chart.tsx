import React, { useId, useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Text as SvgText,
  G,
  Circle,
} from 'react-native-svg';
import { line, area, curveMonotoneX } from 'd3-shape';
import { scaleLinear, scalePoint } from 'd3-scale';
import { spacing } from '@/lib/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { formatCompact } from '@/lib/utils';

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
  height = 240,
  showSecondary = false,
  primaryColor,
  secondaryColor,
  primaryLabel = 'Revenue',
  secondaryLabel = 'Profit',
}: AreaChartProps) {
  const { tokens, typography } = useTheme();
  const { width } = useWindowDimensions();
  const uid = useId().replace(/[:]/g, '');
  const styles = useMemo(() => makeStyles(typography), [typography]);

  if (data.length === 0) return null;

  const pColor = primaryColor ?? tokens.primary;
  const sColor = secondaryColor ?? tokens.chartGreen;
  const chartWidth = Math.min(Math.max(width - 80, 280), 900);
  const padding = { top: 24, right: 16, bottom: 36, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const allValues = data.flatMap((d) =>
    showSecondary && d.secondaryValue != null ? [d.value, d.secondaryValue] : [d.value],
  );
  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues, 0);

  const xScale = scalePoint<string>().domain(data.map((d) => d.label)).range([0, innerWidth]);
  const yScale = scaleLinear().domain([Math.min(minVal, 0), maxVal * 1.1]).range([innerHeight, 0]);

  const lineGen = line<DataPoint>()
    .x((d) => xScale(d.label) ?? 0)
    .y((d) => yScale(d.value))
    .curve(curveMonotoneX);

  const areaGen = area<DataPoint>()
    .x((d) => xScale(d.label) ?? 0)
    .y0(yScale(0))
    .y1((d) => yScale(d.value))
    .curve(curveMonotoneX);

  const secondaryLineGen = line<DataPoint>()
    .x((d) => xScale(d.label) ?? 0)
    .y((d) => yScale(d.secondaryValue ?? 0))
    .curve(curveMonotoneX);

  const secondaryAreaGen = area<DataPoint>()
    .x((d) => xScale(d.label) ?? 0)
    .y0(yScale(0))
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
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: pColor }]} />
          <Text style={styles.legendText}>{primaryLabel}</Text>
        </View>
        {showSecondary ? (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: sColor }]} />
            <Text style={styles.legendText}>{secondaryLabel}</Text>
          </View>
        ) : null}
      </View>
      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id={`pGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={pColor} stopOpacity={0.42} />
            <Stop offset="60%" stopColor={pColor} stopOpacity={0.12} />
            <Stop offset="100%" stopColor={pColor} stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id={`sGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={sColor} stopOpacity={0.28} />
            <Stop offset="100%" stopColor={sColor} stopOpacity={0} />
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
              <SvgText
                x={-10}
                y={yScale(tick) + 4}
                fontSize={10}
                fill={tokens.textMuted}
                textAnchor="end"
              >
                {formatCompact(tick)}
              </SvgText>
            </G>
          ))}

          {showSecondary ? (
            <>
              <Path d={secondaryArea} fill={`url(#sGrad-${uid})`} />
              <Path
                d={secondaryPath}
                stroke={sColor}
                strokeWidth={2}
                fill="none"
                strokeDasharray="6,4"
                strokeLinecap="round"
              />
            </>
          ) : null}

          <Path d={primaryArea} fill={`url(#pGrad-${uid})`} />
          <Path
            d={primaryPath}
            stroke={pColor}
            strokeWidth={2.6}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {data.map((d, i) => {
            const cx = xScale(d.label) ?? 0;
            return (
              <G key={`${d.label}-${i}`}>
                <Circle cx={cx} cy={yScale(d.value)} r={4.5} fill={tokens.backgroundCard} stroke={pColor} strokeWidth={2} />
                {i % labelStep === 0 ? (
                  <SvgText
                    x={cx}
                    y={innerHeight + 22}
                    fontSize={10}
                    fill={tokens.textMuted}
                    textAnchor="middle"
                  >
                    {d.label}
                  </SvgText>
                ) : null}
              </G>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}

function makeStyles(typography: ReturnType<typeof import('@/lib/theme').makeTypography>) {
  return StyleSheet.create({
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
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendText: {
      ...typography.caption,
    },
  });
}

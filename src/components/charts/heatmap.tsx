import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { spacing } from '@/lib/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { useT } from '@/providers/LocaleProvider';
import { withAlpha } from '@/lib/utils';
import { format } from 'date-fns';
import type { ColorTokens } from '@/lib/theme';

interface HeatmapData {
  date: string;
  count: number;
}

interface HeatmapProps {
  data: HeatmapData[];
  weeks?: number;
  cellSize?: number;
  cellGap?: number;
}

function getIntensity(count: number, max: number): number {
  if (count === 0) return 0;
  if (max === 0) return 0;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function intensityColors(c: ColorTokens): string[] {
  return [
    c.surface,
    withAlpha(c.primary, 0.2),
    withAlpha(c.primary, 0.42),
    withAlpha(c.primary, 0.66),
    c.primary,
  ];
}

export function Heatmap({ data, weeks = 20, cellSize = 14, cellGap = 4 }: HeatmapProps) {
  const { tokens, typography } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(tokens, typography), [tokens, typography]);

  const palette = intensityColors(tokens);
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const totalCells = weeks * 7;
  const lookupMap = new Map(data.map((d) => [d.date, d.count]));

  const today = new Date();
  const cells: { week: number; day: number; count: number }[] = [];

  for (let i = totalCells - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = format(date, 'yyyy-MM-dd');
    const weekIdx = Math.floor((totalCells - 1 - i) / 7);
    const dayIdx = date.getDay();
    const adjustedDay = dayIdx === 0 ? 6 : dayIdx - 1;
    cells.push({ week: weekIdx, day: adjustedDay, count: lookupMap.get(key) ?? 0 });
  }

  const days = ['', t('charts.weekday_mon'), '', t('charts.weekday_wed'), '', t('charts.weekday_fri'), ''];

  const svgWidth = weeks * (cellSize + cellGap) + 30;
  const svgHeight = 7 * (cellSize + cellGap) + 10;

  return (
    <View>
      <View style={styles.container}>
        <View style={styles.dayLabels}>
          {days.map((d, i) => (
            <Text
              key={i}
              style={[styles.dayLabel, { height: cellSize + cellGap, lineHeight: cellSize + cellGap }]}
            >
              {d}
            </Text>
          ))}
        </View>
        <Svg width={svgWidth} height={svgHeight}>
          {cells.map((cell, i) => (
            <Rect
              key={i}
              x={cell.week * (cellSize + cellGap)}
              y={cell.day * (cellSize + cellGap)}
              width={cellSize}
              height={cellSize}
              rx={3}
              fill={palette[getIntensity(cell.count, maxCount)]}
            />
          ))}
        </Svg>
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>{t('charts.less')}</Text>
        {palette.map((color, i) => (
          <View key={i} style={[styles.legendCell, { backgroundColor: color }]} />
        ))}
        <Text style={styles.legendText}>{t('charts.more')}</Text>
      </View>
    </View>
  );
}

function makeStyles(_c: ColorTokens, typography: ReturnType<typeof import('@/lib/theme').makeTypography>) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    dayLabels: {
      justifyContent: 'flex-start',
    },
    dayLabel: {
      ...typography.caption,
      fontSize: 9,
      width: 28,
    },
    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 3,
      marginTop: spacing.sm,
    },
    legendCell: {
      width: 12,
      height: 12,
      borderRadius: 3,
    },
    legendText: {
      ...typography.caption,
      fontSize: 9,
    },
  });
}

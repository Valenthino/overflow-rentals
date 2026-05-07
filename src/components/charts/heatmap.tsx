import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors, spacing, typography } from '@/lib/theme';

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

const DAYS = ['Mon', '', 'Wed', '', 'Fri', '', ''];
const INTENSITY_COLORS = [
  colors.surface,
  'rgba(89, 60, 251, 0.2)',
  'rgba(89, 60, 251, 0.4)',
  'rgba(89, 60, 251, 0.65)',
  colors.primary,
];

function getIntensity(count: number, max: number): number {
  if (count === 0) return 0;
  if (max === 0) return 0;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

export function Heatmap({ data, weeks = 20, cellSize = 12, cellGap = 3 }: HeatmapProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const totalCells = weeks * 7;
  const lookupMap = new Map(data.map((d) => [d.date, d.count]));

  const today = new Date();
  const cells: { week: number; day: number; count: number }[] = [];

  for (let i = totalCells - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    const weekIdx = Math.floor((totalCells - 1 - i) / 7);
    const dayIdx = date.getDay();
    const adjustedDay = dayIdx === 0 ? 6 : dayIdx - 1;
    cells.push({ week: weekIdx, day: adjustedDay, count: lookupMap.get(key) ?? 0 });
  }

  const svgWidth = weeks * (cellSize + cellGap) + 30;
  const svgHeight = 7 * (cellSize + cellGap) + 10;

  return (
    <View>
      <View style={styles.container}>
        <View style={styles.dayLabels}>
          {DAYS.map((d, i) => (
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
              rx={2}
              fill={INTENSITY_COLORS[getIntensity(cell.count, maxCount)]}
            />
          ))}
        </Svg>
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        {INTENSITY_COLORS.map((color, i) => (
          <View key={i} style={[styles.legendCell, { backgroundColor: color }]} />
        ))}
        <Text style={styles.legendText}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    width: 24,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: spacing.sm,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    ...typography.caption,
    fontSize: 9,
  },
});

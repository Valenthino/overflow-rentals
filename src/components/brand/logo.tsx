import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Path, Circle, Rect, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTokens } from '@/providers/ThemeProvider';
import { useT } from '@/providers/LocaleProvider';

interface LogoMarkProps {
  size?: number;
  /** Force the whole mark into a single color (monochrome) — e.g. on a colored surface. */
  color?: string;
}

/**
 * The Overflow Fleet "OV" mark: a ring ("O"), a purple "V" whose right arm
 * rises into an upward trend line, and an ascending bar chart.
 * The ring adapts to the theme (white on dark, charcoal on light) so it stays
 * legible in both modes; the V / trend / bars keep the brand purple.
 */
export function LogoMark({ size = 64, color }: LogoMarkProps) {
  const c = useTokens();
  const uid = React.useId().replace(/[:]/g, '');
  const mono = color != null;
  const oColor = color ?? c.text;
  const purple = mono ? color : `url(#ovV-${uid})`;
  const speed = mono ? color : `url(#ovSpeed-${uid})`;

  return (
    <Svg width={size} height={size * 0.75} viewBox="0 0 128 96" fill="none">
      <Defs>
        <LinearGradient id={`ovV-${uid}`} x1="50" y1="73" x2="116" y2="22" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={c.primaryDark} />
          <Stop offset="1" stopColor={c.primaryLight} />
        </LinearGradient>
        <LinearGradient id={`ovSpeed-${uid}`} x1="0" y1="0" x2="14" y2="0" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={c.primaryLight} stopOpacity={0.12} />
          <Stop offset="1" stopColor={c.primary} stopOpacity={0.9} />
        </LinearGradient>
      </Defs>

      {/* speed lines */}
      <Line x1={2} y1={38} x2={13} y2={38} stroke={speed} strokeWidth={3.6} strokeLinecap="round" />
      <Line x1={0} y1={47} x2={13} y2={47} stroke={speed} strokeWidth={3.6} strokeLinecap="round" />
      <Line x1={4} y1={56} x2={13} y2={56} stroke={speed} strokeWidth={3.6} strokeLinecap="round" />

      {/* O */}
      <Circle cx={38} cy={47} r={19} stroke={oColor} strokeWidth={12.5} fill="none" />

      {/* V rising into an upward trend line */}
      <Path
        d="M50 38 L64 73 L90 33 L116 24"
        stroke={purple}
        strokeWidth={12.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* ascending bar chart */}
      <Rect x={88} y={71} width={5.5} height={9} rx={1.6} fill={purple} />
      <Rect x={96.5} y={67} width={5.5} height={13} rx={1.6} fill={purple} />
      <Rect x={105} y={62} width={5.5} height={18} rx={1.6} fill={purple} />
      <Rect x={113.5} y={56} width={5.5} height={24} rx={1.6} fill={purple} />
      <Line x1={86} y1={82} x2={121} y2={82} stroke={purple} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  showText?: boolean;
  align?: 'left' | 'center';
  style?: ViewStyle;
  inverse?: boolean;
}

const SIZES = {
  sm: { mark: 28, title: 14, tagline: 10, gap: 8 },
  md: { mark: 40, title: 18, tagline: 12, gap: 10 },
  lg: { mark: 64, title: 24, tagline: 13, gap: 14 },
  xl: { mark: 96, title: 32, tagline: 14, gap: 16 },
};

export function Logo({
  size = 'md',
  showTagline = false,
  showText = true,
  align = 'left',
  style,
  inverse = false,
}: LogoProps) {
  const c = useTokens();
  const t = useT();
  const dims = SIZES[size];
  const titleColor = inverse ? c.white : c.text;
  const taglineColor = inverse ? 'rgba(255,255,255,0.78)' : c.textSecondary;

  return (
    <View
      style={[
        styles.row,
        align === 'center' && styles.center,
        { gap: dims.gap },
        style,
      ]}
    >
      <LogoMark size={dims.mark} />
      {showText ? (
        <View style={align === 'center' ? styles.textCenter : undefined}>
          <Text
            style={{
              fontSize: dims.title,
              fontWeight: '700',
              color: titleColor,
              letterSpacing: -0.5,
              lineHeight: dims.title * 1.15,
            }}
          >
            {t('app.name')}
          </Text>
          {showTagline ? (
            <Text
              style={{
                fontSize: dims.tagline,
                fontWeight: '500',
                color: taglineColor,
                marginTop: 2,
              }}
            >
              {t('app.tagline')}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
  },
  textCenter: {
    alignItems: 'center',
  },
});

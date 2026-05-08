import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTokens } from '@/providers/ThemeProvider';
import { useT } from '@/providers/LocaleProvider';
import { spacing } from '@/lib/theme';

interface LogoMarkProps {
  size?: number;
  color?: string;
  withGradient?: boolean;
}

export function LogoMark({ size = 64, color, withGradient = true }: LogoMarkProps) {
  const c = useTokens();
  const stroke = color ?? c.brand;
  const fill = color ?? c.brand;
  const gradId = 'logoGrad';

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      {withGradient ? (
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={c.brand} />
            <Stop offset="1" stopColor={c.brandDark} />
          </LinearGradient>
        </Defs>
      ) : null}

      <Path
        d="M22 64 C22 50 28 42 36 38 L46 30 C50 27 56 25 60 25 C64 25 70 27 74 30 L84 38 C92 42 98 50 98 64 L98 74 C98 78 96 80 92 80 L88 80 C86 80 84 78 84 76 L84 72 L36 72 L36 76 C36 78 34 80 32 80 L28 80 C24 80 22 78 22 74 Z"
        fill={withGradient ? `url(#${gradId})` : fill}
        opacity={0.95}
      />
      <Path
        d="M30 60 L34 50 L86 50 L90 60 Z"
        fill={c.backgroundCard}
        opacity={0.18}
      />
      <Circle cx="38" cy="74" r="4.5" fill={c.backgroundCard} opacity={0.5} />
      <Circle cx="82" cy="74" r="4.5" fill={c.backgroundCard} opacity={0.5} />

      <Path
        d="M60 56 C52 56 46 62 46 70 C46 80 60 96 60 96 C60 96 74 80 74 70 C74 62 68 56 60 56 Z"
        fill={withGradient ? `url(#${gradId})` : fill}
      />
      <Circle cx="60" cy="69" r="9" fill={c.backgroundCard} />
      <Path
        d="M55 70 L58.5 73.5 L65 66.5"
        stroke={stroke}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
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

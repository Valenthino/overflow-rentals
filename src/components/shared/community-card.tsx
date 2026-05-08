import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { spacing, radius } from '@/lib/theme';
import type { ColorTokens } from '@/lib/theme';

interface CommunityLink {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  url: string | null;
}

const LINKS: Omit<CommunityLink, 'color'>[] = [
  {
    key: 'facebook',
    label: 'Facebook Group',
    description: 'Trade tips with other Turo hosts',
    icon: 'logo-facebook',
    url: null,
  },
  {
    key: 'discord',
    label: 'Discord Server',
    description: 'Real-time chat with the community',
    icon: 'chatbubbles',
    url: null,
  },
  {
    key: 'youtube',
    label: 'YouTube Channel',
    description: 'Tutorials and host stories',
    icon: 'logo-youtube',
    url: null,
  },
  {
    key: 'instagram',
    label: 'Instagram',
    description: 'Behind-the-scenes and updates',
    icon: 'logo-instagram',
    url: null,
  },
];

export function CommunityCard() {
  const { tokens, typography } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, typography), [tokens, typography]);

  const palette: Record<string, string> = {
    facebook: '#1877F2',
    discord: '#5865F2',
    youtube: '#FF0000',
    instagram: '#E4405F',
  };

  const open = async (url: string | null) => {
    if (!url) return;
    try {
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
    } catch {
      // ignore
    }
  };

  return (
    <Card style={styles.card}>
      <CardHeader title="Join the Community" subtitle="Connect with other Turo hosts" />
      <CardContent style={styles.body}>
        <View style={styles.placeholderNote}>
          <Ionicons name="information-circle-outline" size={14} color={tokens.textMuted} />
          <Text style={styles.placeholderText}>
            Links will be filled in once the community channels go live.
          </Text>
        </View>

        <View style={styles.grid}>
          {LINKS.map((link) => {
            const url = link.url;
            const accent = palette[link.key] ?? tokens.primary;
            const disabled = !url;
            return (
              <Pressable
                key={link.key}
                onPress={() => open(url)}
                disabled={disabled}
                style={((state: { hovered?: boolean }) => [
                  styles.tile,
                  state.hovered && !disabled ? { backgroundColor: tokens.backgroundHover } : null,
                  disabled ? styles.tileDisabled : null,
                ]) as any}
              >
                <View style={[styles.iconCircle, { backgroundColor: accent + '22' }]}>
                  <Ionicons name={link.icon} size={20} color={accent} />
                </View>
                <View style={styles.tileText}>
                  <Text style={styles.tileLabel}>{link.label}</Text>
                  <Text style={styles.tileDesc} numberOfLines={2}>
                    {link.description}
                  </Text>
                </View>
                <Ionicons
                  name={disabled ? 'time-outline' : 'open-outline'}
                  size={16}
                  color={tokens.textMuted}
                />
              </Pressable>
            );
          })}
        </View>
      </CardContent>
    </Card>
  );
}

function makeStyles(
  c: ColorTokens,
  typography: ReturnType<typeof import('@/lib/theme').makeTypography>,
) {
  return StyleSheet.create({
    card: {
      minWidth: 320,
      flex: 1,
    },
    body: {
      gap: spacing.md,
    },
    placeholderNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: c.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    placeholderText: {
      ...typography.caption,
      flex: 1,
    },
    grid: {
      gap: spacing.sm,
    },
    tile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      ...(Platform.OS === 'web' ? { transition: 'background-color 120ms' as any } : null),
    },
    tileDisabled: {
      opacity: 0.65,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileText: {
      flex: 1,
    },
    tileLabel: {
      ...typography.label,
      color: c.text,
      fontWeight: '600',
      fontSize: 14,
    },
    tileDesc: {
      ...typography.caption,
      marginTop: 2,
    },
  });
}

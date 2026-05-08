import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { tokens, spacing, radius } from '@/lib/theme';

interface State {
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary]', error, info?.componentStack);
    }
  }

  reset = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
    } else {
      this.setState({ error: null });
    }
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const c = tokens.dark;
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.card, { backgroundColor: c.backgroundCard, borderColor: c.border }]}>
          <Text style={[styles.title, { color: c.text }]}>Something broke</Text>
          <Text style={[styles.body, { color: c.textSecondary }]}>
            The app hit an unexpected error. Reload to continue.
          </Text>
          <ScrollView style={styles.errorBox} contentContainerStyle={{ padding: spacing.md }}>
            <Text style={[styles.errorText, { color: c.danger }]} selectable>
              {error.name}: {error.message}
            </Text>
            {__DEV__ && error.stack ? (
              <Text style={[styles.stack, { color: c.textMuted }]} selectable>
                {error.stack}
              </Text>
            ) : null}
          </ScrollView>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: c.primary }]}
            onPress={this.reset}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: c.white }]}>Reload</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: { fontSize: 22, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 20 },
  errorBox: {
    maxHeight: 220,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  errorText: { fontSize: 13, fontWeight: '600' },
  stack: { fontSize: 11, marginTop: spacing.sm, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  button: {
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  buttonText: { fontSize: 15, fontWeight: '600' },
});

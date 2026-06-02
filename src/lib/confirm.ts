import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

/**
 * Cross-platform confirmation dialog. Resolves `true` when the user confirms.
 * Uses the native Alert on iOS/Android and window.confirm on web.
 */
export function confirm({
  title = 'Are you sure?',
  message = '',
  confirmText = 'OK',
  cancelText = 'Cancel',
  destructive = false,
}: ConfirmOptions = {}): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || typeof window.confirm !== 'function') {
      return Promise.resolve(true);
    }
    const text = message ? `${title}\n\n${message}` : title;
    return Promise.resolve(window.confirm(text));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message || undefined, [
      { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmText,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}

/**
 * Confirmation tuned for delete actions. Pass a short label for the record
 * (e.g. "2024 Toyota Camry") to make the prompt specific.
 */
export function confirmDelete(itemLabel?: string): Promise<boolean> {
  return confirm({
    title: itemLabel ? `Delete ${itemLabel}?` : 'Delete this item?',
    message: 'This action cannot be undone.',
    confirmText: 'Delete',
    destructive: true,
  });
}

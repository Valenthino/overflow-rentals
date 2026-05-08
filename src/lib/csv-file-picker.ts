import { Platform } from 'react-native';

/**
 * Open a system file picker, return the selected file's contents as a string.
 *
 * Returns:
 *   - `{ ok: true, name, text }` on success
 *   - `{ ok: false, reason: 'cancelled' }` when the user dismisses the dialog
 *   - `{ ok: false, reason: 'error', message }` on read failure
 *
 * On web we use a hidden `<input type="file">` so we don't pull in
 * `expo-document-picker`'s web shim (which doesn't return file contents).
 * On native we use `expo-document-picker` + `expo-file-system`.
 */
export type CsvFileResult =
  | { ok: true; name: string; text: string }
  | { ok: false; reason: 'cancelled' }
  | { ok: false; reason: 'error'; message: string };

export async function pickCsvFile(): Promise<CsvFileResult> {
  if (Platform.OS === 'web') return pickCsvFileWeb();
  return pickCsvFileNative();
}

// ---------------------------------------------------------------------------
// Web: HTML file input
// ---------------------------------------------------------------------------

function pickCsvFileWeb(): Promise<CsvFileResult> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve({ ok: false, reason: 'error', message: 'No DOM available' });
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv,application/vnd.ms-excel,text/plain';
    input.style.display = 'none';

    const cleanup = () => {
      try {
        document.body.removeChild(input);
      } catch {
        // ignore
      }
    };

    let resolved = false;
    const finish = (r: CsvFileResult) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(r);
    };

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        finish({ ok: false, reason: 'cancelled' });
        return;
      }
      try {
        const text = await file.text();
        finish({ ok: true, name: file.name, text });
      } catch (e: any) {
        finish({ ok: false, reason: 'error', message: e?.message ?? 'Failed to read file' });
      }
    };

    // The browser doesn't fire any event when the user hits Cancel on the
    // native file dialog. Listen for window focus as a fallback so we don't
    // leave the input attached forever.
    const onFocus = () => {
      window.removeEventListener('focus', onFocus);
      setTimeout(() => {
        if (!input.files || input.files.length === 0) {
          finish({ ok: false, reason: 'cancelled' });
        }
      }, 300);
    };
    window.addEventListener('focus', onFocus, { once: true });

    document.body.appendChild(input);
    input.click();
  });
}

// ---------------------------------------------------------------------------
// Native: expo-document-picker + expo-file-system
// ---------------------------------------------------------------------------

async function pickCsvFileNative(): Promise<CsvFileResult> {
  let DocumentPicker: typeof import('expo-document-picker') | null = null;
  let FileSystem: typeof import('expo-file-system') | null = null;
  try {
    DocumentPicker = require('expo-document-picker');
    FileSystem = require('expo-file-system');
  } catch (e) {
    return {
      ok: false,
      reason: 'error',
      message:
        'expo-document-picker / expo-file-system not installed. Rebuild the dev client after `npm install`.',
    };
  }
  if (!DocumentPicker || !FileSystem) {
    return { ok: false, reason: 'error', message: 'File picker unavailable' };
  }

  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'public.comma-separated-values-text', '*/*'],
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return { ok: false, reason: 'cancelled' };
    const asset = result.assets?.[0];
    if (!asset?.uri) return { ok: false, reason: 'error', message: 'No file URI returned' };

    // EncodingType was removed in newer expo-file-system; the string 'utf8'
    // is accepted by all current versions.
    const text = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: 'utf8' as any,
    });
    return { ok: true, name: asset.name ?? 'import.csv', text };
  } catch (e: any) {
    return { ok: false, reason: 'error', message: e?.message ?? 'Failed to read file' };
  }
}

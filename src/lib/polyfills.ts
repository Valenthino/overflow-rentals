// Web API polyfills that need to load BEFORE any other module evaluates.
//
// Why this file exists:
//
//   On Hermes + new architecture (Expo SDK 54 / React Native 0.81), some of
//   React Native's built-in polyfills (FormData, URL, etc.) race with
//   user-code evaluation. If a library reaches for `FormData`, `URL`, or
//   `URLSearchParams` during its top-level `require()` (e.g.
//   `@supabase/supabase-js` → `@supabase/realtime-js` → `phoenix`), the
//   bundle crashes with "[runtime not ready]: ReferenceError: Property
//   'FormData' doesn't exist".
//
//   Importing this module at the top of `app/_layout.tsx` (the root layout
//   that expo-router loads before any tab's static imports run) ensures the
//   polyfills are registered ahead of every dependent module.
//
// Belt-and-suspenders approach: we re-register polyfills even if they look
// present, since on some versions Hermes returns `undefined` for the
// `typeof` check despite `globalThis.FormData` being assigned later.

// URL / URLSearchParams — required by Supabase.
import 'react-native-url-polyfill/auto';

// FormData — Hermes new-arch sometimes leaves this undefined at module init.
const g: any =
  typeof globalThis !== 'undefined'
    ? (globalThis as any)
    : typeof global !== 'undefined'
      ? (global as any)
      : {};

if (typeof g.FormData === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const RNFormData = require('react-native/Libraries/Network/FormData');
    g.FormData = RNFormData?.default ?? RNFormData;
  } catch (e) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[polyfills] FormData polyfill failed to load', e);
    }
  }
}

export {};

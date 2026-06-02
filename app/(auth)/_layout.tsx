import { Stack } from 'expo-router';
import { useTokens } from '@/providers/ThemeProvider';

export default function AuthLayout() {
  const c = useTokens();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: c.background },
        animation: 'slide_from_right',
      }}
    />
  );
}

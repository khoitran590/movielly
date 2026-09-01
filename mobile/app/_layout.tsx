import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/providers/AppProviders';
import { env } from '@/config';
import { colors } from '@/theme';

Sentry.init({ dsn: env.sentryDsn, enabled: Boolean(env.sentryDsn), sendDefaultPii: false, tracesSampleRate: 0.1 });

function RootLayout() {
  return <AppProviders><StatusBar style="light"/><Stack screenOptions={{ headerStyle: { backgroundColor: colors.ink }, headerTintColor: colors.screen, headerShadowVisible: false, contentStyle: { backgroundColor: colors.ink }, headerBackButtonDisplayMode: 'minimal' }}><Stack.Screen name="index" options={{ headerShown: false }}/><Stack.Screen name="(auth)" options={{ headerShown: false }}/><Stack.Screen name="(tabs)" options={{ headerShown: false }}/><Stack.Screen name="title/[type]/[id]" options={{ title: '' }}/><Stack.Screen name="list/[token]" options={{ title: 'Shared favorites' }}/><Stack.Screen name="user/[id]" options={{ title: 'Profile' }}/><Stack.Screen name="settings" options={{ title: 'Settings' }}/><Stack.Screen name="taste" options={{ title: 'Your taste' }}/><Stack.Screen name="providers" options={{ title: 'Streaming services' }}/><Stack.Screen name="auth/callback" options={{ title: 'Signing in' }}/></Stack></AppProviders>;
}
export default Sentry.wrap(RootLayout);

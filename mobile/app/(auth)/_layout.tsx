import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { colors } from '@/theme';
export default function AuthLayout() { const { user } = useAuth(); if (user) return <Redirect href="/(tabs)"/>; return <Stack screenOptions={{ headerStyle: { backgroundColor: colors.ink }, headerTintColor: colors.screen, headerShadowVisible: false, contentStyle: { backgroundColor: colors.ink } }}><Stack.Screen name="login" options={{ headerShown: false }}/><Stack.Screen name="signup" options={{ title: '' }}/><Stack.Screen name="forgot-password" options={{ title: '' }}/><Stack.Screen name="reset-password" options={{ title: '' }}/></Stack>; }

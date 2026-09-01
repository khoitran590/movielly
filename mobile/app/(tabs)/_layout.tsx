import { Redirect, Tabs, router } from 'expo-router';
import { Binoculars, CheckCircle2, Heart, Settings, Users } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { Loading } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { colors } from '@/theme';

export default function TabsLayout() {
  const { user, loading } = useAuth(); if (loading) return <Loading/>; if (!user) return <Redirect href="/login"/>;
  return <Tabs screenOptions={{ headerStyle: { backgroundColor: colors.ink }, headerTintColor: colors.screen, headerShadowVisible: false, sceneStyle: { backgroundColor: colors.ink }, tabBarStyle: { backgroundColor: colors.velvet, borderTopColor: colors.rail, height: 82, paddingTop: 7 }, tabBarActiveTintColor: colors.gold, tabBarInactiveTintColor: colors.fog, tabBarLabelStyle: { fontSize: 11, fontWeight: '600' }, headerRight: () => <Pressable accessibilityLabel="Open settings" onPress={() => router.push('/settings')} style={{ padding: 10, marginRight: 6 }}><Settings size={21} color={colors.fog}/></Pressable> }}>
    <Tabs.Screen name="index" options={{ title: 'Browse', tabBarIcon: ({ color }) => <Binoculars color={color} size={22}/> }}/>
    <Tabs.Screen name="watched" options={{ title: 'Watched', tabBarIcon: ({ color }) => <CheckCircle2 color={color} size={22}/> }}/>
    <Tabs.Screen name="favorites" options={{ title: 'Favorites', tabBarIcon: ({ color }) => <Heart color={color} size={22}/> }}/>
    <Tabs.Screen name="friends" options={{ title: 'Friends', tabBarIcon: ({ color }) => <Users color={color} size={22}/> }}/>
  </Tabs>;
}

import { Redirect } from 'expo-router';
import { Loading } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
export default function Index() { const { user, loading } = useAuth(); if (loading) return <Loading label="Restoring your session…"/>; return <Redirect href={user ? '/(tabs)' : '/login'}/>; }

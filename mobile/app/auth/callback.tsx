import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { InlineError, Loading, Screen } from '@/components/ui';
import { applyAuthUrl } from '@/providers/AuthProvider';
export default function AuthCallback() { const [error, setError] = useState(''); useEffect(() => { Linking.getInitialURL().then(async url => { if (url) await applyAuthUrl(url); router.replace('/'); }).catch(err => setError(err instanceof Error ? err.message : 'Could not complete sign in.')); }, []); return <Screen>{error ? <InlineError message={error}/> : <Loading label="Completing sign in…"/>}</Screen>; }

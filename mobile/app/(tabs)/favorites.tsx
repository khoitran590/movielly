import { savedToMovie } from '@movielly/core';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { MovieCard } from '@/components/MovieCard';
import { Button, Empty, Loading, Screen, Title } from '@/components/ui';
import { env, movieApi } from '@/config';
import { sharedRepo } from '@/lib/repositories';
import { useSavedTitles } from '@/hooks/useSavedTitles';
import { useAuth } from '@/providers/AuthProvider';

export default function Favorites() { const { user, session } = useAuth(); const query = useSavedTitles('favorites'); const [sharing, setSharing] = useState(false); const share = async () => { if (!user || !session) return; setSharing(true); try { let row = await sharedRepo.mine(user.id); if (!row) { const created = await movieApi.shareList(session.access_token, 'My Favorites'); row = { share_token: created.share_token, title: 'My Favorites' }; } const url = `${env.siteUrl}/list/${row.share_token}`; await Clipboard.setStringAsync(url); await Share.share({ title: row.title || 'My Favorites', message: `See my Movielly favorites: ${url}`, url }); } catch (error) { Alert.alert('Could not share', error instanceof Error ? error.message : 'Try again.'); } finally { setSharing(false); } }; if (query.isLoading) return <Loading/>; return <Screen><Title subtitle="The titles you’d put on the marquee.">Favorites</Title><Button onPress={share} loading={sharing} disabled={!query.items.length}>Share favorites</Button>{query.items.length ? <View style={styles.grid}>{query.items.map(item => <MovieCard key={item.id} movie={savedToMovie(item)} width={145}/>)}</View> : <Empty title="No favorites yet." description="Tap the heart on a title to save it here."/>}</Screen>; }
const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 18 } });

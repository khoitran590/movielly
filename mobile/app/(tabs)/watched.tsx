import { savedToMovie, type WatchlistItem } from '@movielly/core';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { MovieCard } from '@/components/MovieCard';
import { Button, Empty, Loading, Screen, Title } from '@/components/ui';
import { watchlistRepo } from '@/lib/repositories';
import { useSavedTitles } from '@/hooks/useSavedTitles';
import { useAuth } from '@/providers/AuthProvider';
import { colors } from '@/theme';

export default function Watched() { const { user } = useAuth(); const client = useQueryClient(); const query = useSavedTitles('watchlist'); const items = query.items as WatchlistItem[]; const update = async (type: 'movie' | 'tv', id: number, current: string) => { if (!user) return; await watchlistRepo.status(user.id, type, id, current === 'watched' ? 'planned' : 'watched'); await client.invalidateQueries({ queryKey: ['watchlist', user.id] }); }; if (query.isLoading) return <Loading label="Loading your list…"/>; return <Screen><Title subtitle="Everything you plan to watch and everything you’ve finished.">Watched</Title>{items.length ? <View style={styles.grid}>{items.map(item => <View key={item.id} style={styles.item}><MovieCard movie={savedToMovie(item)} width={145}/><Button variant={item.title_status === 'watched' ? 'secondary' : 'ghost'} onPress={() => update(item.movie_type, item.movie_id, item.title_status)}>{item.title_status === 'watched' ? 'Watched ✓' : 'Mark watched'}</Button></View>)}</View> : <Empty title="Your watchlist is empty." description="Open a title from Browse and add it to your watchlist."/>}</Screen>; }
const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 18 }, item: { width: 145, gap: 8 } });

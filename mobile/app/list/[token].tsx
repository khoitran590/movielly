import { savedToMovie } from '@movielly/core';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { MovieCard } from '@/components/MovieCard';
import { Empty, InlineError, Loading, Screen, Title } from '@/components/ui';
import { movieApi } from '@/config';
import { colors } from '@/theme';
export default function SharedList() { const { token } = useLocalSearchParams<{ token: string }>(); const query = useQuery({ queryKey: ['shared-list', token], queryFn: ({ signal }) => movieApi.sharedList(token, signal), enabled: Boolean(token) }); if (query.isLoading) return <Loading/>; if (query.isError || !query.data) return <Screen><InlineError message="This shared list is unavailable or no longer exists." retry={() => query.refetch()}/></Screen>; return <Screen><View style={styles.owner}><Avatar uri={query.data.owner?.avatar_url} name={query.data.owner?.username}/><View><Title subtitle={query.data.owner?.bio || undefined}>{query.data.title}</Title><Text style={styles.by}>Shared by @{query.data.owner?.username || 'a Movielly member'}</Text></View></View>{query.data.items.length ? <View style={styles.grid}>{query.data.items.map(item => <MovieCard key={item.id} movie={savedToMovie(item)} width={145}/>)}</View> : <Empty title="This list is empty."/>}</Screen>; }
const styles = StyleSheet.create({ owner: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 }, by: { color: colors.gold, marginTop: -10 }, grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 18 } });

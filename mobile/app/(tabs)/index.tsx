import type { Movie, TitleType } from '@movielly/core';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MovieCard } from '@/components/MovieCard';
import { MovieRail } from '@/components/MovieRail';
import { InlineError, Loading, Screen, Title } from '@/components/ui';
import { movieApi } from '@/config';
import { colors, radius, spacing } from '@/theme';

type Filter = 'all' | TitleType;
export default function Browse() {
  const [text, setText] = useState(''); const [submitted, setSubmitted] = useState(''); const [type, setType] = useState<Filter>('all'); const [showFilters, setShowFilters] = useState(false);
  const trending = useQuery({ queryKey: ['trending'], queryFn: ({ signal }) => movieApi.trending('week', 'all', 1, signal) });
  const movies = useQuery({ queryKey: ['popular', 'movie'], queryFn: ({ signal }) => movieApi.popular('movie', 1, signal) });
  const tv = useQuery({ queryKey: ['popular', 'tv'], queryFn: ({ signal }) => movieApi.popular('tv', 1, signal) });
  const search = useQuery({ queryKey: ['search', submitted, type], queryFn: ({ signal }) => movieApi.search(submitted, 1, type === 'all' ? 'multi' : type, signal), enabled: submitted.length > 1 });
  const results = useMemo(() => (search.data?.results || []).filter(item => item.media_type !== 'person' && item.poster_path), [search.data]);
  const submit = () => setSubmitted(text.trim());
  return <Screen><Title subtitle="Find your next great watch.">Now showing</Title><View style={styles.search}><Search size={20} color={colors.fog}/><TextInput accessibilityLabel="Search movies and TV" value={text} onChangeText={setText} onSubmitEditing={submit} returnKeyType="search" placeholder="Search films and series" placeholderTextColor={colors.fog} style={styles.input}/>{text ? <Pressable onPress={() => { setText(''); setSubmitted(''); }}><X size={19} color={colors.fog}/></Pressable> : null}<Pressable accessibilityLabel="Search filters" onPress={() => setShowFilters(value => !value)}><SlidersHorizontal size={20} color={type === 'all' ? colors.fog : colors.gold}/></Pressable></View>
    {showFilters ? <View style={styles.chips}>{(['all', 'movie', 'tv'] as Filter[]).map(value => <Pressable key={value} onPress={() => setType(value)} style={[styles.chip, type === value && styles.chipActive]}><Text style={[styles.chipText, type === value && styles.chipTextActive]}>{value === 'all' ? 'All' : value === 'movie' ? 'Films' : 'Series'}</Text></Pressable>)}</View> : null}
    {submitted ? <View style={styles.results}><Text style={styles.resultTitle}>Results for “{submitted}”</Text>{search.isLoading ? <Loading label="Searching…"/> : search.isError ? <InlineError message="Search is unavailable." retry={() => search.refetch()}/> : results.length ? <View style={styles.grid}>{results.map(item => <MovieCard key={`${item.media_type}:${item.id}`} movie={item} width={145}/>)}</View> : <Text style={styles.empty}>No matching titles.</Text>}</View> : <>{trending.isLoading ? <Loading label="Loading the marquee…"/> : trending.isError ? <InlineError message="Couldn’t reach the movie service. Check EXPO_PUBLIC_API_URL and ensure the backend is running." retry={() => trending.refetch()}/> : <MovieRail title="Trending this week" movies={(trending.data?.results || []).filter(item => item.media_type !== 'person') as Movie[]}/>}<MovieRail title="Popular films" movies={(movies.data?.results || []).map(item => ({ ...item, media_type: 'movie' }))}/><MovieRail title="Popular series" movies={(tv.data?.results || []).map(item => ({ ...item, media_type: 'tv' }))}/></>}
  </Screen>;
}
const styles = StyleSheet.create({ search: { minHeight: 52, borderRadius: radius.pill, backgroundColor: colors.velvet, borderWidth: 1, borderColor: colors.rail, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10 }, input: { flex: 1, color: colors.screen, fontSize: 16 }, chips: { flexDirection: 'row', gap: 8 }, chip: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.rail, paddingHorizontal: 15, paddingVertical: 9 }, chipActive: { backgroundColor: colors.gold, borderColor: colors.gold }, chipText: { color: colors.fog, fontWeight: '600' }, chipTextActive: { color: colors.ink }, results: { gap: 16 }, resultTitle: { color: colors.screen, fontSize: 20, fontWeight: '700' }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, justifyContent: 'space-between' }, empty: { color: colors.fog, textAlign: 'center', padding: 32 } });

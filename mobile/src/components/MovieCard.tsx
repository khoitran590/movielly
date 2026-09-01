import type { Movie } from '@movielly/core';
import { getMovieTitle, getYear, titleTypeFor } from '@movielly/core';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { movieApi } from '@/config';
import { colors, radius } from '@/theme';

export const POSTER_WIDTH = 132;
export function MovieCard({ movie, width = POSTER_WIDTH }: { movie: Movie; width?: number }) {
  const type = titleTypeFor(movie);
  const poster = movieApi.getPosterUrl(movie.poster_path, 'w342');
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${getMovieTitle(movie)}`} onPress={() => router.push({ pathname: '/title/[type]/[id]', params: { type, id: String(movie.id) } })} style={({ pressed }) => [styles.wrap, { width }, pressed && styles.pressed]}>
    <View style={[styles.poster, { width, height: Math.round(width * 1.5) }]}>{poster ? <Image source={poster} style={styles.image} contentFit="cover" transition={180}/> : <Text style={styles.missing}>No poster</Text>}{movie.vote_average > 0 ? <View style={styles.score}><Text style={styles.scoreText}>★ {movie.vote_average.toFixed(1)}</Text></View> : null}</View>
    <Text style={styles.title} numberOfLines={1}>{getMovieTitle(movie)}</Text><Text style={styles.meta}>{getYear(movie) || (type === 'tv' ? 'Series' : 'Film')}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({ wrap: { gap: 5 }, pressed: { opacity: 0.72 }, poster: { overflow: 'hidden', borderRadius: radius.md, backgroundColor: colors.seat, alignItems: 'center', justifyContent: 'center' }, image: { width: '100%', height: '100%' }, missing: { color: colors.fog, fontSize: 12 }, score: { position: 'absolute', right: 6, bottom: 6, borderRadius: 8, backgroundColor: 'rgba(11,10,9,.86)', paddingHorizontal: 6, paddingVertical: 4 }, scoreText: { color: colors.goldLight, fontWeight: '700', fontSize: 11 }, title: { color: colors.screen, fontSize: 14, fontWeight: '600' }, meta: { color: colors.fog, fontSize: 12 } });

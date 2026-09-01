import type { Movie } from '@movielly/core';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MovieCard } from './MovieCard';
import { SectionTitle } from './ui';

export function MovieRail({ title, movies }: { title: string; movies: Movie[] }) { return <View style={styles.wrap}><SectionTitle>{title}</SectionTitle><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>{movies.map(movie => <MovieCard key={`${movie.media_type}:${movie.id}`} movie={movie}/>)}</ScrollView></View>; }
const styles = StyleSheet.create({ wrap: { gap: 12 }, rail: { gap: 12, paddingRight: 24 } });

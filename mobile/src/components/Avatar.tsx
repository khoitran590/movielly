import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';
export function Avatar({ uri, name, size = 44 }: { uri?: string | null; name?: string | null; size?: number }) { return <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>{uri ? <Image source={uri} style={styles.image} contentFit="cover"/> : <Text style={[styles.text, { fontSize: size * .38 }]}>{name?.[0]?.toUpperCase() || '?'}</Text>}</View>; }
const styles = StyleSheet.create({ wrap: { backgroundColor: colors.seat, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, image: { width: '100%', height: '100%' }, text: { color: colors.fog, fontWeight: '700' } });

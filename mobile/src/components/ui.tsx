import type { ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type PressableProps, type TextInputProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/theme';

export function Screen({ children, scroll = true, style }: { children: ReactNode; scroll?: boolean; style?: ViewStyle }) {
  const content = scroll ? <ScrollView contentContainerStyle={[styles.content, style]} keyboardShouldPersistTaps="handled">{children}</ScrollView> : <View style={[styles.content, styles.flex, style]}>{children}</View>;
  return <SafeAreaView edges={['top']} style={styles.safe}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{content}</KeyboardAvoidingView></SafeAreaView>;
}
export function Title({ children, subtitle }: { children: ReactNode; subtitle?: string }) { return <View style={styles.titleWrap}><Text style={styles.title}>{children}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>; }
export function SectionTitle({ children, count }: { children: ReactNode; count?: number }) { return <View style={styles.sectionRow}><Text style={styles.section}>{children}</Text>{count !== undefined ? <Text style={styles.count}>{count}</Text> : null}</View>; }
export function Button({ children, variant = 'primary', loading, disabled, style, ...props }: PressableProps & { children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; loading?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled || loading} style={({ pressed }) => [styles.button, styles[`button_${variant}`], (disabled || loading) && styles.disabled, pressed && styles.pressed, style as ViewStyle]} {...props}>{loading ? <ActivityIndicator color={variant === 'primary' ? colors.ink : colors.screen} /> : <Text style={[styles.buttonText, styles[`buttonText_${variant}`]]}>{children}</Text>}</Pressable>;
}
export function Field({ label, error, multiline, style, accessibilityLabel, ...props }: TextInputProps & { label?: string; error?: string | null }) { return <View style={styles.fieldWrap}>{label ? <Text style={styles.label}>{label}</Text> : null}<TextInput accessibilityLabel={accessibilityLabel || label} placeholderTextColor={colors.fog} selectionColor={colors.gold} multiline={multiline} style={[styles.input, multiline && styles.multiline, style]} {...props}/>{error ? <Text style={styles.error}>{error}</Text> : null}</View>; }
export function Loading({ label = 'Loading…' }: { label?: string }) { return <View style={styles.center}><ActivityIndicator color={colors.gold} size="large"/><Text style={styles.muted}>{label}</Text></View>; }
export function Empty({ title, description, action }: { title: string; description?: string; action?: ReactNode }) { return <View style={styles.empty}><Text style={styles.emptyTitle}>{title}</Text>{description ? <Text style={styles.muted}>{description}</Text> : null}{action}</View>; }
export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) { return <View style={[styles.card, style]}>{children}</View>; }
export function InlineError({ message, retry }: { message: string; retry?: () => void }) { return <Card><Text style={styles.error}>{message}</Text>{retry ? <Button variant="ghost" onPress={retry}>Try again</Button> : null}</Card>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink }, flex: { flex: 1 }, content: { padding: spacing.lg, paddingBottom: 40, gap: spacing.lg },
  titleWrap: { gap: 4, marginBottom: 4 }, title: { color: colors.screen, fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.8 }, subtitle: { color: colors.fog, fontSize: 15, lineHeight: 21 },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 }, section: { color: colors.screen, fontSize: 21, fontWeight: '700', flex: 1 }, count: { color: colors.gold, fontVariant: ['tabular-nums'] },
  button: { minHeight: 46, borderRadius: radius.pill, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  button_primary: { backgroundColor: colors.gold, borderColor: colors.gold }, button_secondary: { backgroundColor: colors.seat, borderColor: colors.rail }, button_ghost: { backgroundColor: colors.transparent, borderColor: colors.rail }, button_danger: { backgroundColor: '#351819', borderColor: colors.ticket },
  buttonText: { fontSize: 15, fontWeight: '700' }, buttonText_primary: { color: colors.ink }, buttonText_secondary: { color: colors.screen }, buttonText_ghost: { color: colors.gold }, buttonText_danger: { color: '#f59a9a' }, disabled: { opacity: 0.45 }, pressed: { opacity: 0.72 },
  fieldWrap: { gap: 7 }, label: { color: colors.fog, fontSize: 14, fontWeight: '600' }, input: { minHeight: 48, borderWidth: 1, borderColor: colors.rail, backgroundColor: colors.seat, borderRadius: radius.md, color: colors.screen, fontSize: 16, paddingHorizontal: 14 }, multiline: { minHeight: 104, paddingTop: 12, textAlignVertical: 'top' }, error: { color: '#ed7e7e', fontSize: 14, lineHeight: 20 }, muted: { color: colors.fog, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  center: { flex: 1, minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: 12 }, empty: { minHeight: 200, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 }, emptyTitle: { color: colors.screen, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  card: { borderRadius: radius.lg, backgroundColor: colors.velvet, borderWidth: 1, borderColor: colors.rail, padding: spacing.lg, gap: spacing.md },
});

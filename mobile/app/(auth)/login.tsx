import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Button, Card, Field, Screen, Title } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { colors } from '@/theme';

export default function Login() {
  const { login, configured } = useAuth(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const submit = async () => { if (!email || !password) return setError('Enter your email and password.'); setBusy(true); setError(await login(email, password)); setBusy(false); };
  return <Screen style={styles.screen}><View style={styles.brand}><Text style={styles.mark}>M</Text><Text style={styles.wordmark}>MOVIELLY</Text></View><Title subtitle="Your personal screening room.">Welcome back</Title>{!configured ? <Card><Text style={styles.config}>Add the EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY values in mobile/.env before signing in.</Text></Card> : null}<Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress"/><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry textContentType="password" onSubmitEditing={submit} error={error}/><Button loading={busy} disabled={!configured} onPress={submit}>Sign in</Button><View style={styles.links}><Link href="/forgot-password" style={styles.link}>Forgot password?</Link><Link href="/signup" style={styles.link}>Create an account</Link></View></Screen>;
}
const styles = StyleSheet.create({ screen: { justifyContent: 'center', minHeight: 680 }, brand: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 18 }, mark: { color: colors.ink, backgroundColor: colors.gold, width: 32, height: 32, borderRadius: 16, textAlign: 'center', lineHeight: 32, fontWeight: '900', fontSize: 17 }, wordmark: { color: colors.goldLight, fontWeight: '900', letterSpacing: 3 }, links: { alignItems: 'center', gap: 16, marginTop: 5 }, link: { color: colors.gold, fontSize: 15, padding: 4 }, config: { color: colors.goldLight, lineHeight: 20 } });

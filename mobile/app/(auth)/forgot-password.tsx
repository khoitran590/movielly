import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, Field, Screen, Title } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
export default function ForgotPassword() { const { forgotPassword } = useAuth(); const [email, setEmail] = useState(''); const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false); const submit = async () => { setBusy(true); const value = await forgotPassword(email); setBusy(false); setError(value); if (!value) Alert.alert('Check your inbox', 'Open the reset link on this device to choose a new password.'); }; return <Screen><Title subtitle="We’ll email a secure link that opens Movielly.">Reset your password</Title><Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={error}/><Button onPress={submit} loading={busy}>Send reset link</Button></Screen>; }

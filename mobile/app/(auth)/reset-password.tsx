import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { Button, Field, Screen, Title } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
export default function ResetPassword() { const { updatePassword } = useAuth(); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false); const submit = async () => { if (password.length < 6) return setError('Use at least 6 characters.'); if (password !== confirm) return setError('Passwords do not match.'); setBusy(true); const value = await updatePassword(password); setBusy(false); setError(value); if (!value) { Alert.alert('Password updated'); router.replace('/'); } }; return <Screen><Title>Choose a new password</Title><Field label="New password" value={password} onChangeText={setPassword} secureTextEntry/><Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry error={error}/><Button onPress={submit} loading={busy}>Save password</Button></Screen>; }

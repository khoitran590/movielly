import { validateBio, validateUsername, MAX_AVATAR_BYTES } from '@movielly/core';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Camera, ChevronRight, LogOut } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button, Card, Field, Loading, Screen, Title } from '@/components/ui';
import { profileRepo } from '@/lib/repositories';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { colors } from '@/theme';

export default function Settings() {
  const { user, profile, loading, refreshProfile, signOut } = useAuth(); const [username, setUsername] = useState(''); const [bio, setBio] = useState(''); const [avatar, setAvatar] = useState<{ uri: string; mime?: string; bytes?: number } | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => { setUsername(profile?.username || ''); setBio(profile?.bio || ''); }, [profile]);
  if (loading || !user) return <Loading/>;
  const pick = async () => { const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: .85 }); if (result.canceled) return; const image = result.assets[0]; if (image.fileSize && image.fileSize > MAX_AVATAR_BYTES) return Alert.alert('Image is too large', 'Choose an image under 3 MB.'); setAvatar({ uri: image.uri, mime: image.mimeType, bytes: image.fileSize }); };
  const save = async () => { const issue = validateUsername(username.trim()) || validateBio(bio); if (issue) return setError(issue); setBusy(true); setError(''); try { const avatarUrl = avatar ? await profileRepo.uploadAvatar(user.id, avatar.uri, avatar.mime) : profile?.avatar_url; await profileRepo.update(user.id, { username: username.trim(), bio: bio.trim() || null, avatar_url: avatarUrl || null }); await supabase.auth.updateUser({ data: { username: username.trim() } }); await refreshProfile(); setAvatar(null); Alert.alert('Profile saved'); } catch (err) { setError(err instanceof Error ? err.message : 'Could not save profile.'); } finally { setBusy(false); } };
  return <Screen><Title subtitle={user.email || undefined}>Edit profile</Title><Card><View style={styles.avatarRow}><Avatar uri={avatar?.uri || profile?.avatar_url} name={username} size={88}/><View style={styles.grow}><Text style={styles.username}>@{profile?.username || 'viewer'}</Text><Button variant="ghost" onPress={pick}>Change photo</Button></View><Pressable accessibilityLabel="Change profile picture" style={styles.camera} onPress={pick}><Camera color={colors.ink} size={18}/></Pressable></View><Field label="Username" value={username} onChangeText={value => setUsername(value.replace(/\s/g, ''))} autoCapitalize="none" maxLength={20}/><Field label={`Bio (${bio.length}/280)`} value={bio} onChangeText={setBio} multiline maxLength={280} error={error}/><Button onPress={save} loading={busy}>Save changes</Button></Card><Card><SettingsLink label="Taste profile" onPress={() => router.push('/taste')}/><SettingsLink label="Streaming services" onPress={() => router.push('/providers')}/></Card><Button variant="danger" onPress={() => Alert.alert('Sign out?', undefined, [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: () => signOut() }])}>Sign out</Button></Screen>;
}
function SettingsLink({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable style={styles.link} onPress={onPress}><Text style={styles.linkText}>{label}</Text><ChevronRight color={colors.fog} size={20}/></Pressable>; }
const styles = StyleSheet.create({ avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 }, grow: { flex: 1, gap: 8 }, username: { color: colors.screen, fontSize: 19, fontWeight: '700' }, camera: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' }, link: { minHeight: 52, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.rail }, linkText: { flex: 1, color: colors.screen, fontSize: 16 } });

// Shared favorites lists — create a share link, fetch a shared list.
const crypto = require('crypto');
const { supabase } = require('../lib/supabase');

async function createShareLink(userId, title) {
  // Unguessable, high-entropy token (128 bits) so favorites lists can't be enumerated.
  const shareToken = crypto.randomBytes(16).toString('hex');
  const { data, error } = await supabase
    .from('shared_lists')
    .upsert({
      user_id: userId,
      share_token: shareToken,
      title: title || 'My Favorites',
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return data.share_token;
}

// Returns null when the token doesn't match any list.
async function getSharedList(shareToken) {
  const { data: list, error: listError } = await supabase
    .from('shared_lists')
    .select('user_id, title')
    .eq('share_token', shareToken)
    .single();

  if (listError || !list) return null;

  const { data: favorites, error: favError } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', list.user_id)
    .order('added_at', { ascending: false });

  if (favError) throw favError;

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, bio')
    .eq('id', list.user_id)
    .single();

  return { title: list.title, owner: profile, items: favorites || [] };
}

module.exports = { createShareLink, getSharedList };

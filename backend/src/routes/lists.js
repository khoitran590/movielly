const express = require('express');
const crypto = require('crypto');
const Sentry = require('@sentry/node');
const { requireAuth, supabase } = require('../middleware/auth');
const router = express.Router();

router.post('/share', requireAuth, async (req, res) => {
  const { title } = req.body;
  try {
    // Unguessable, high-entropy token (128 bits) so favorites lists can't be enumerated.
    const shareToken = crypto.randomBytes(16).toString('hex');
    const { data, error } = await supabase
      .from('shared_lists')
      .upsert({
        user_id: req.user.id,
        share_token: shareToken,
        title: title || 'My Favorites',
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    res.json({ share_token: data.share_token });
  } catch (err) {
    console.error('Share link creation failed:', err);
    Sentry.captureException(err);
    res.status(500).json({ error: 'Failed to create share link' });
  }
});

router.get('/:shareToken', async (req, res) => {
  try {
    const { data: list, error: listError } = await supabase
      .from('shared_lists')
      .select('user_id, title')
      .eq('share_token', req.params.shareToken)
      .single();

    if (listError || !list) return res.status(404).json({ error: 'List not found' });

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

    res.json({ title: list.title, owner: profile, items: favorites || [] });
  } catch (err) {
    console.error('Shared list fetch failed:', err);
    Sentry.captureException(err);
    res.status(500).json({ error: 'Failed to fetch shared list' });
  }
});

module.exports = router;

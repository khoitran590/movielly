// Thin HTTP layer for shared favorites lists.
const Sentry = require('@sentry/node');
const listService = require('../services/list.service');

exports.share = async (req, res) => {
  try {
    const shareToken = await listService.createShareLink(req.user.id, req.body.title);
    res.json({ share_token: shareToken });
  } catch (err) {
    console.error('Share link creation failed:', err);
    Sentry.captureException(err);
    res.status(500).json({ error: 'Failed to create share link' });
  }
};

exports.getShared = async (req, res) => {
  try {
    const list = await listService.getSharedList(req.params.shareToken);
    if (!list) return res.status(404).json({ error: 'List not found' });
    res.json(list);
  } catch (err) {
    console.error('Shared list fetch failed:', err);
    Sentry.captureException(err);
    res.status(500).json({ error: 'Failed to fetch shared list' });
  }
};

// Thin HTTP layer for shared favorites lists.
const Sentry = require('@sentry/node');
const listService = require('../services/list.service');

const MAX_TITLE_LENGTH = 100;

exports.share = async (req, res) => {
  try {
    // Title is optional, but if supplied it must be a short string — it flows
    // straight into the DB and is rendered on the public shared-list page.
    let { title } = req.body ?? {};
    if (title !== undefined) {
      if (typeof title !== 'string') {
        return res.status(400).json({ error: 'Title must be a string' });
      }
      title = title.trim();
      if (title.length > MAX_TITLE_LENGTH) {
        return res.status(400).json({ error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer` });
      }
    }
    const shareToken = await listService.createShareLink(req.user.id, title || undefined);
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

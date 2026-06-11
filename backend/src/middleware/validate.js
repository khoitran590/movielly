// Param validation shared by routes.
// TMDB ids are always positive integers; reject anything else before it gets
// interpolated into a TMDB request path.
const isNumericId = (id) => /^\d+$/.test(String(id));

function validateId(req, res, next) {
  if (!isNumericId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  next();
}

function validateTypeAndId(req, res, next) {
  const { type, id } = req.params;
  if (type !== 'movie' && type !== 'tv') {
    return res.status(400).json({ error: 'type must be "movie" or "tv"' });
  }
  if (!isNumericId(id)) return res.status(400).json({ error: 'Invalid id' });
  next();
}

module.exports = { isNumericId, validateId, validateTypeAndId };

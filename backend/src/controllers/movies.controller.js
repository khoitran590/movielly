// Thin HTTP layer: parse the request, call a service, send the response.
const Sentry = require('@sentry/node');
const tmdbService = require('../services/tmdb.service');
const trailerService = require('../services/trailer.service');
const { getSimilar } = require('../services/recommendation.service');

const handleTmdbError = (err, res) => {
  const status = err.response?.status || 500;
  const message = err.response?.data?.status_message || 'Failed to fetch from TMDB';
  // 4xx (bad id, not found) is expected noise; only report real failures.
  if (status >= 500) {
    console.error('TMDB request failed:', err.message);
    Sentry.captureException(err);
  }
  res.status(status).json({ error: message });
};

exports.search = async (req, res) => {
  const { query, page = 1, type = 'multi' } = req.query;
  if (!query?.trim()) return res.status(400).json({ error: 'Query is required' });
  try {
    res.json(await tmdbService.search(type, query, page));
  } catch (err) {
    handleTmdbError(err, res);
  }
};

exports.trending = async (req, res) => {
  const { time_window = 'week', media_type = 'all' } = req.query;
  try {
    res.json(await tmdbService.trending(media_type, time_window));
  } catch (err) {
    handleTmdbError(err, res);
  }
};

exports.movieDetails = async (req, res) => {
  try {
    res.json(await tmdbService.details('movie', req.params.id));
  } catch (err) {
    handleTmdbError(err, res);
  }
};

exports.tvDetails = async (req, res) => {
  try {
    res.json(await tmdbService.details('tv', req.params.id));
  } catch (err) {
    handleTmdbError(err, res);
  }
};

exports.popular = async (req, res) => {
  const { type = 'movie', page = 1 } = req.query;
  try {
    res.json(await tmdbService.popular(type, page));
  } catch (err) {
    handleTmdbError(err, res);
  }
};

exports.genres = async (req, res) => {
  const { type = 'movie' } = req.query;
  try {
    res.json(await tmdbService.genreList(type));
  } catch (err) {
    handleTmdbError(err, res);
  }
};

// Browse by genre (used by the home-page genre filter)
exports.discover = async (req, res) => {
  const { type = 'movie', with_genres, page = 1, sort_by = 'popularity.desc' } = req.query;
  const base = type === 'tv' ? 'tv' : 'movie';
  try {
    res.json(await tmdbService.discover(base, {
      with_genres,
      page,
      sort_by,
      include_adult: false,
      'vote_count.gte': 50,
    }));
  } catch (err) {
    handleTmdbError(err, res);
  }
};

// Hybrid trailer: KinoCheck first (curated official pick), TMDB as fallback.
exports.trailer = async (req, res) => {
  const { type, id } = req.params;

  let trailer = null;
  try {
    trailer = await trailerService.getKinocheckTrailer(type, id);
  } catch (err) {
    console.warn(`KinoCheck lookup failed for ${type}/${id}: ${err.message}`);
  }

  if (!trailer) {
    try {
      trailer = await trailerService.getTmdbTrailer(type, id);
    } catch (err) {
      return handleTmdbError(err, res);
    }
  }

  res.json(trailer || { youtube_video_id: null, title: null, source: null });
};

// Multiple trailers: per-film for movie franchises, per-season for TV shows.
exports.trailers = async (req, res) => {
  const { type, id } = req.params;
  try {
    const trailers = type === 'tv'
      ? await trailerService.getTvSeasonTrailers(id)
      : await trailerService.getMovieCollectionTrailers(id);
    res.json({ trailers });
  } catch (err) {
    handleTmdbError(err, res);
  }
};

exports.similar = async (req, res) => {
  const { type, id } = req.params;
  const base = type === 'tv' ? 'tv' : 'movie';
  try {
    res.json({ results: await getSimilar(base, id) });
  } catch (err) {
    handleTmdbError(err, res);
  }
};

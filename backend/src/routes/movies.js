const express = require('express');
const axios = require('axios');
const router = express.Router();

const tmdb = axios.create({
  baseURL: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
  params: { api_key: process.env.TMDB_API_KEY },
});

const kinocheck = axios.create({
  baseURL: process.env.KINOCHECK_BASE_URL || 'https://api.kinocheck.com',
  timeout: 6000,
  headers: {
    Accept: 'application/json',
    ...(process.env.KINOCHECK_API_KEY ? { 'X-Api-Key': process.env.KINOCHECK_API_KEY } : {}),
  },
});

// Try KinoCheck for a curated official trailer (by TMDB id).
async function getKinocheckTrailer(type, tmdbId) {
  const endpoint = type === 'tv' ? '/shows' : '/movies';
  const { data } = await kinocheck.get(endpoint, { params: { tmdb_id: tmdbId, language: 'en' } });
  const key = data?.trailer?.youtube_video_id;
  if (key) {
    return { youtube_video_id: key, title: data.trailer.title || 'Trailer', source: 'kinocheck' };
  }
  return null;
}

// Choose the best YouTube video from a TMDB videos[] array.
function pickYouTube(results = []) {
  return (
    results.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
    results.find(v => v.site === 'YouTube' && v.type === 'Trailer') ||
    results.find(v => v.site === 'YouTube' && v.type === 'Teaser') ||
    results.find(v => v.site === 'YouTube') ||
    null
  );
}

// Fallback: pull a YouTube trailer from TMDB's videos endpoint.
async function getTmdbTrailer(type, tmdbId) {
  const endpoint = type === 'tv' ? `/tv/${tmdbId}/videos` : `/movie/${tmdbId}/videos`;
  const { data } = await tmdb.get(endpoint);
  const pick = pickYouTube(data?.results);
  if (pick) {
    return { youtube_video_id: pick.key, title: pick.name || 'Trailer', source: 'tmdb' };
  }
  return null;
}

// Single hybrid trailer for one TMDB title: KinoCheck first, TMDB fallback.
async function getHybridTrailer(type, tmdbId) {
  try {
    const k = await getKinocheckTrailer(type, tmdbId);
    if (k) return k;
  } catch (err) {
    console.warn(`KinoCheck failed for ${type}/${tmdbId}: ${err.message}`);
  }
  try {
    return await getTmdbTrailer(type, tmdbId);
  } catch (err) {
    console.warn(`TMDB trailer failed for ${type}/${tmdbId}: ${err.message}`);
    return null;
  }
}

// Movie franchise: a trailer per film in the collection (or just this film).
async function getMovieCollectionTrailers(id) {
  const { data: movie } = await tmdb.get(`/movie/${id}`);
  let parts = [movie];
  const collectionId = movie.belongs_to_collection?.id;
  if (collectionId) {
    try {
      const { data: col } = await tmdb.get(`/collection/${collectionId}`);
      if (col.parts?.length) {
        parts = col.parts.sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''));
      }
    } catch (err) {
      console.warn(`Collection ${collectionId} fetch failed: ${err.message}`);
    }
  }

  const resolved = await Promise.all(parts.map(async p => {
    const t = await getHybridTrailer('movie', p.id);
    if (!t?.youtube_video_id) return null;
    return {
      youtube_video_id: t.youtube_video_id,
      label: p.title || p.name,
      sublabel: (p.release_date || '').slice(0, 4) || null,
      poster_path: p.poster_path || null,
    };
  }));
  return resolved.filter(Boolean);
}

// TV show: a trailer per season (TMDB season videos), with show-level fallback.
async function getTvSeasonTrailers(id) {
  const { data: show } = await tmdb.get(`/tv/${id}`);
  const seasons = (show.seasons || []).filter(s => s.season_number > 0);

  const resolved = await Promise.all(seasons.map(async s => {
    try {
      const { data } = await tmdb.get(`/tv/${id}/season/${s.season_number}/videos`);
      const v = pickYouTube(data?.results);
      if (v) {
        return {
          youtube_video_id: v.key,
          label: s.name || `Season ${s.season_number}`,
          sublabel: (s.air_date || '').slice(0, 4) || null,
          poster_path: s.poster_path || null,
        };
      }
    } catch (err) {
      console.warn(`Season ${s.season_number} videos failed for tv/${id}: ${err.message}`);
    }
    return null;
  }));

  let list = resolved.filter(Boolean);
  if (list.length === 0) {
    const t = await getHybridTrailer('tv', id);
    if (t?.youtube_video_id) {
      list = [{ youtube_video_id: t.youtube_video_id, label: show.name, sublabel: null, poster_path: show.poster_path || null }];
    }
  }
  return list;
}

const handleTmdbError = (err, res) => {
  const status = err.response?.status || 500;
  const message = err.response?.data?.status_message || 'Failed to fetch from TMDB';
  res.status(status).json({ error: message });
};

// TMDB ids are always positive integers; reject anything else before it gets
// interpolated into a TMDB request path.
const isNumericId = (id) => /^\d+$/.test(String(id));

router.get('/search', async (req, res) => {
  const { query, page = 1, type = 'multi' } = req.query;
  if (!query?.trim()) return res.status(400).json({ error: 'Query is required' });
  try {
    const endpoint = type === 'movie' ? '/search/movie'
      : type === 'tv' ? '/search/tv'
      : '/search/multi';
    const { data } = await tmdb.get(endpoint, { params: { query, page, include_adult: false } });
    res.json(data);
  } catch (err) {
    handleTmdbError(err, res);
  }
});

router.get('/trending', async (req, res) => {
  const { time_window = 'week', media_type = 'all' } = req.query;
  try {
    const { data } = await tmdb.get(`/trending/${media_type}/${time_window}`);
    res.json(data);
  } catch (err) {
    handleTmdbError(err, res);
  }
});

router.get('/movie/:id', async (req, res) => {
  if (!isNumericId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const { data } = await tmdb.get(`/movie/${req.params.id}`, {
      params: { append_to_response: 'credits,videos,similar' },
    });
    res.json(data);
  } catch (err) {
    handleTmdbError(err, res);
  }
});

router.get('/tv/:id', async (req, res) => {
  if (!isNumericId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const { data } = await tmdb.get(`/tv/${req.params.id}`, {
      params: { append_to_response: 'credits,videos,similar' },
    });
    res.json(data);
  } catch (err) {
    handleTmdbError(err, res);
  }
});

router.get('/popular', async (req, res) => {
  const { type = 'movie', page = 1 } = req.query;
  try {
    const endpoint = type === 'tv' ? '/tv/popular' : '/movie/popular';
    const { data } = await tmdb.get(endpoint, { params: { page } });
    res.json(data);
  } catch (err) {
    handleTmdbError(err, res);
  }
});

router.get('/genres', async (req, res) => {
  const { type = 'movie' } = req.query;
  try {
    const { data } = await tmdb.get(`/genre/${type}/list`);
    res.json(data);
  } catch (err) {
    handleTmdbError(err, res);
  }
});

// Hybrid trailer: KinoCheck first (curated official pick), TMDB as fallback.
router.get('/:type/:id/trailer', async (req, res) => {
  const { type, id } = req.params;
  if (type !== 'movie' && type !== 'tv') {
    return res.status(400).json({ error: 'type must be "movie" or "tv"' });
  }
  if (!isNumericId(id)) return res.status(400).json({ error: 'Invalid id' });

  let trailer = null;
  try {
    trailer = await getKinocheckTrailer(type, id);
  } catch (err) {
    console.warn(`KinoCheck lookup failed for ${type}/${id}: ${err.message}`);
  }

  if (!trailer) {
    try {
      trailer = await getTmdbTrailer(type, id);
    } catch (err) {
      return handleTmdbError(err, res);
    }
  }

  res.json(trailer || { youtube_video_id: null, title: null, source: null });
});

// Multiple trailers: per-film for movie franchises, per-season for TV shows.
router.get('/:type/:id/trailers', async (req, res) => {
  const { type, id } = req.params;
  if (type !== 'movie' && type !== 'tv') {
    return res.status(400).json({ error: 'type must be "movie" or "tv"' });
  }
  if (!isNumericId(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const trailers = type === 'tv'
      ? await getTvSeasonTrailers(id)
      : await getMovieCollectionTrailers(id);
    res.json({ trailers });
  } catch (err) {
    handleTmdbError(err, res);
  }
});

module.exports = router;

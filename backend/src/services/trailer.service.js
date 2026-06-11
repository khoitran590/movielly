// Trailer lookup: KinoCheck (curated official picks) with TMDB as fallback,
// plus per-film franchise trailers and per-season TV trailers.
const axios = require('axios');
const { tmdb } = require('./tmdb.service');
const { pickYouTube } = require('../lib/pickYouTube');

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

module.exports = {
  getKinocheckTrailer,
  getTmdbTrailer,
  getHybridTrailer,
  getMovieCollectionTrailers,
  getTvSeasonTrailers,
};

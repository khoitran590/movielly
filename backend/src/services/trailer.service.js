// Trailer lookup with playability validation.
//
// Candidates come from two sources: TMDB's videos endpoint (ranked — official
// trailers first, clips/featurettes excluded) and the movie-trailer package
// (YouTube trailers resolved via TMDB metadata) as an extra fallback. Each
// candidate is checked against YouTube's oEmbed endpoint before being served:
// removed videos return 404 there, age-restricted / embed-blocked ones 401 —
// only videos that actually play in an embed get returned.
const axios = require('axios');
const movieTrailerPkg = require('movie-trailer');
const { tmdb } = require('./tmdb.service');
const { rankYouTube } = require('../lib/pickYouTube');

const movieTrailer = movieTrailerPkg.default || movieTrailerPkg;

// KinoCheck: human-curated trailer picks by TMDB id (anonymous: 1000 req/day).
const kinocheck = axios.create({
  baseURL: process.env.KINOCHECK_BASE_URL || 'https://api.kinocheck.com',
  timeout: 6000,
  headers: {
    Accept: 'application/json',
    ...(process.env.KINOCHECK_API_KEY ? { 'X-Api-Key': process.env.KINOCHECK_API_KEY } : {}),
  },
});

// Resolves the video's title when it exists and is embeddable (not removed,
// not age-gated), or null when it isn't playable.
async function getPlayableTitle(videoId) {
  try {
    const { data } = await axios.get('https://www.youtube.com/oembed', {
      params: { url: `https://www.youtube.com/watch?v=${videoId}`, format: 'json' },
      timeout: 4000,
    });
    return data?.title || '';
  } catch {
    return null;
  }
}

const isPlayable = async (videoId) => (await getPlayableTitle(videoId)) !== null;

// First playable candidate from an ordered list, or null. Candidates flagged
// `untyped` (sources that don't label video types, like movie-trailer) must
// additionally have "trailer"/"teaser" in their YouTube title — that's the
// only way to keep clips from those sources out.
async function firstPlayable(candidates) {
  const seen = new Set();
  for (const c of candidates) {
    if (!c?.youtube_video_id || seen.has(c.youtube_video_id)) continue;
    seen.add(c.youtube_video_id);
    const ytTitle = await getPlayableTitle(c.youtube_video_id);
    if (ytTitle === null) continue;
    if (c.untyped && !/trailer|teaser/i.test(ytTitle)) continue;
    return { youtube_video_id: c.youtube_video_id, title: c.title || ytTitle, source: c.source };
  }
  return null;
}

// Curated fallback: KinoCheck's hand-picked trailer for this TMDB id.
// Catches titles where TMDB's video list is mislabeled (e.g. a franchise
// retrospective attached as "Trailer"). Never throws.
async function kinocheckCandidate(type, tmdbId) {
  try {
    const endpoint = type === 'tv' ? '/shows' : '/movies';
    const { data } = await kinocheck.get(endpoint, { params: { tmdb_id: tmdbId, language: 'en' } });
    const key = data?.trailer?.youtube_video_id;
    if (key) {
      return [{ youtube_video_id: key, title: data.trailer.title || 'Trailer', source: 'kinocheck' }];
    }
  } catch (err) {
    console.warn(`KinoCheck failed for ${type}/${tmdbId}: ${err.message}`);
  }
  return [];
}

// Extra candidates from the movie-trailer package (unlabeled, so they rank
// after TMDB's typed trailers). Never throws.
async function movieTrailerCandidates(type, tmdbId) {
  try {
    const ids = await movieTrailer(null, {
      tmdbId,
      videoType: type === 'tv' ? 'tv' : 'movie',
      id: true,
      multi: true,
      apiKey: process.env.TMDB_API_KEY,
    });
    return (ids || []).map(id => ({ youtube_video_id: id, source: 'youtube', untyped: true }));
  } catch (err) {
    console.warn(`movie-trailer failed for ${type}/${tmdbId}: ${err.message}`);
    return [];
  }
}

// Best playable trailer for one TMDB title. TMDB request errors propagate so
// the controller can map them (e.g. unknown id -> 404).
async function getBestTrailer(type, tmdbId) {
  const endpoint = type === 'tv' ? `/tv/${tmdbId}/videos` : `/movie/${tmdbId}/videos`;
  const { data } = await tmdb.get(endpoint);

  const ranked = rankYouTube(data?.results).map(v => ({
    youtube_video_id: v.key,
    title: v.name || 'Trailer',
    source: 'tmdb',
  }));

  // Cheap path first: if a ranked TMDB trailer plays, use it.
  const fromTmdb = await firstPlayable(ranked);
  if (fromTmdb) return fromTmdb;

  // Fallbacks: KinoCheck's curated pick, then movie-trailer's suggestions.
  const [curated, extras] = await Promise.all([
    kinocheckCandidate(type, tmdbId),
    movieTrailerCandidates(type, tmdbId),
  ]);
  return firstPlayable([...curated, ...extras]);
}

// Same, but never throws — for batch lookups where one bad part shouldn't
// sink the whole list.
async function getHybridTrailer(type, tmdbId) {
  try {
    return await getBestTrailer(type, tmdbId);
  } catch (err) {
    console.warn(`Trailer lookup failed for ${type}/${tmdbId}: ${err.message}`);
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
      const candidates = rankYouTube(data?.results).map(v => ({ youtube_video_id: v.key }));
      const playable = await firstPlayable(candidates);
      if (playable) {
        return {
          youtube_video_id: playable.youtube_video_id,
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
  isPlayable,
  getBestTrailer,
  getHybridTrailer,
  getMovieCollectionTrailers,
  getTvSeasonTrailers,
};

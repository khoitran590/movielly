// Theme-aware "similar" recommendations.
// Combines TMDB recommendations + keyword-discover (theme) + genre-discover,
// then ranks candidates (lib/rankSimilar) so results share the title's theme.
const { tmdb } = require('./tmdb.service');
const { rankSimilar } = require('../lib/rankSimilar');

async function getSimilar(base, id) {
  const [detailsRes, keywordsRes, recsRes, similarRes] = await Promise.all([
    tmdb.get(`/${base}/${id}`),
    tmdb.get(`/${base}/${id}/keywords`).catch(() => ({ data: {} })),
    tmdb.get(`/${base}/${id}/recommendations`).catch(() => ({ data: { results: [] } })),
    tmdb.get(`/${base}/${id}/similar`).catch(() => ({ data: { results: [] } })),
  ]);

  const details = detailsRes.data;
  const baseGenreIds = new Set((details.genres || []).map(g => g.id));
  // movie keywords live under `keywords`, tv under `results`
  const keywordList = keywordsRes.data.keywords || keywordsRes.data.results || [];
  const topKeywords = keywordList.map(k => k.id).slice(0, 8);
  const topGenres = [...baseGenreIds].slice(0, 2); // primary genres define the theme

  // Discover thematically-related titles
  const discoverCalls = [];
  if (topKeywords.length) {
    discoverCalls.push(tmdb.get(`/discover/${base}`, {
      params: {
        with_keywords: topKeywords.join('|'),          // OR — shares any theme keyword
        sort_by: 'vote_count.desc',
        'vote_count.gte': 40,
        include_adult: false,
      },
    }).then(r => ({ weight: 2.5, results: r.data.results })).catch(() => ({ weight: 2.5, results: [] })));
  }
  if (topGenres.length) {
    // Pure genre fallback (no keyword requirement) so same-genre films always surface.
    discoverCalls.push(tmdb.get(`/discover/${base}`, {
      params: {
        with_genres: topGenres.join(','),              // AND — same core genres
        sort_by: 'popularity.desc',
        'vote_count.gte': 80,
        include_adult: false,
      },
    }).then(r => ({ weight: 1, results: r.data.results })).catch(() => ({ weight: 1, results: [] })));
  }
  const discovered = await Promise.all(discoverCalls);

  const ranked = rankSimilar({
    selfId: id,
    baseGenreIds,
    sources: [
      { results: recsRes.data.results, weight: 3 },     // behavior-based (strong)
      ...discovered,                                    // theme keywords > genre
      { results: similarRes.data.results, weight: 0.75 }, // TMDB /similar — safety net
    ],
  });

  return ranked.map(m => ({ ...m, media_type: base }));
}

module.exports = { getSimilar };

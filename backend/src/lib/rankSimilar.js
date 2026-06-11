// Score & merge "similar title" candidates from multiple TMDB sources.
// A title appearing in several sources accumulates score, plus bonuses for
// sharing genres with the base title and for its own rating.
//
// Pure function — no I/O — so the ranking behavior is unit-testable.
function rankSimilar({ selfId, baseGenreIds, sources, limit = 12 }) {
  const scores = new Map();

  for (const { results, weight } of sources) {
    for (const m of results || []) {
      if (String(m.id) === String(selfId)) continue;   // not itself
      if (!m.poster_path) continue;                    // need artwork
      const genreOverlap = (m.genre_ids || []).filter(g => baseGenreIds.has(g)).length;
      const voteBonus = Math.min((m.vote_average || 0) / 10, 1);
      const inc = weight + genreOverlap * 1.5 + voteBonus;
      const cur = scores.get(m.id);
      if (cur) cur.score += inc;
      else scores.set(m.id, { movie: m, score: inc });
    }
  }

  return [...scores.values()]
    .sort((a, b) => b.score - a.score || (b.movie.vote_count || 0) - (a.movie.vote_count || 0))
    .slice(0, limit)
    .map(x => x.movie);
}

module.exports = { rankSimilar };

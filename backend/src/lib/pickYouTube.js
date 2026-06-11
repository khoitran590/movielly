// Rank a TMDB videos[] array into an ordered list of YouTube trailer
// candidates: official trailers > trailers > official teasers > teasers.
// Clips, featurettes, and behind-the-scenes are deliberately excluded —
// callers walk the list and use the first video that actually plays.
function rankYouTube(results = []) {
  const yt = results.filter(v => v.site === 'YouTube' && v.key);
  const score = (v) => {
    if (v.type === 'Trailer') return v.official ? 0 : 1;
    if (v.type === 'Teaser') return v.official ? 2 : 3;
    return null; // anything else (Clip, Featurette, …) is not a trailer
  };
  return yt
    .map(v => ({ v, s: score(v) }))
    .filter(x => x.s !== null)
    .sort((a, b) => a.s - b.s)
    .map(x => x.v);
}

// Best single candidate (or null). Kept for callers that only need one.
function pickYouTube(results = []) {
  return rankYouTube(results)[0] || null;
}

module.exports = { pickYouTube, rankYouTube };

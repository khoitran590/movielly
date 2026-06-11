// Choose the best YouTube video from a TMDB videos[] array.
// Preference order: official trailer > any trailer > teaser > anything on YouTube.
function pickYouTube(results = []) {
  return (
    results.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
    results.find(v => v.site === 'YouTube' && v.type === 'Trailer') ||
    results.find(v => v.site === 'YouTube' && v.type === 'Teaser') ||
    results.find(v => v.site === 'YouTube') ||
    null
  );
}

module.exports = { pickYouTube };

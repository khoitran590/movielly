// All TMDB traffic flows through the shared axios instance here, so
// controllers never build TMDB URLs themselves.
const axios = require('axios');

if (!process.env.TMDB_API_KEY) {
  console.error('\n[Movielly] Missing TMDB config. Set TMDB_API_KEY in backend/.env\n');
  process.exit(1);
}

const tmdb = axios.create({
  baseURL: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
  params: { api_key: process.env.TMDB_API_KEY },
});

const search = (type, query, page) => {
  const endpoint = type === 'movie' ? '/search/movie'
    : type === 'tv' ? '/search/tv'
    : '/search/multi';
  return tmdb.get(endpoint, { params: { query, page, include_adult: false } }).then(r => r.data);
};

const trending = (mediaType, timeWindow) =>
  tmdb.get(`/trending/${mediaType}/${timeWindow}`).then(r => r.data);

const details = (base, id) =>
  tmdb.get(`/${base}/${id}`, { params: { append_to_response: 'credits' } }).then(r => r.data);

const popular = (type, page) => {
  const endpoint = type === 'tv' ? '/tv/popular' : '/movie/popular';
  return tmdb.get(endpoint, { params: { page } }).then(r => r.data);
};

const genreList = (type) =>
  tmdb.get(`/genre/${type}/list`).then(r => r.data);

const discover = (base, params) =>
  tmdb.get(`/discover/${base}`, { params }).then(r => r.data);

module.exports = { tmdb, search, trending, details, popular, genreList, discover };

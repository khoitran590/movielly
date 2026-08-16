const MAX_PAGE = 500;
const MAX_SEARCH_LENGTH = 200;

const fail = (res, message) => res.status(400).json({ error: message });

function pageNumber(value) {
  if (value === undefined) return 1;
  if (!/^\d+$/.test(String(value))) return null;
  const page = Number(value);
  return page >= 1 && page <= MAX_PAGE ? page : null;
}

function validateSearch(req, res, next) {
  const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
  const page = pageNumber(req.query.page);
  const type = req.query.type || 'multi';

  if (!query) return fail(res, 'Query is required');
  if (query.length > MAX_SEARCH_LENGTH) return fail(res, `Query must be ${MAX_SEARCH_LENGTH} characters or fewer`);
  if (!['movie', 'tv', 'multi'].includes(type)) return fail(res, 'Invalid search type');
  if (page === null) return fail(res, `page must be between 1 and ${MAX_PAGE}`);

  req.query.query = query;
  req.query.type = type;
  req.query.page = page;
  next();
}

function validateTrending(req, res, next) {
  const timeWindow = req.query.time_window || 'week';
  const mediaType = req.query.media_type || 'all';
  const page = pageNumber(req.query.page);
  if (!['day', 'week'].includes(timeWindow)) return fail(res, 'time_window must be "day" or "week"');
  if (!['all', 'movie', 'tv'].includes(mediaType)) return fail(res, 'Invalid media_type');
  if (page === null) return fail(res, `page must be between 1 and ${MAX_PAGE}`);
  req.query.time_window = timeWindow;
  req.query.media_type = mediaType;
  req.query.page = page;
  next();
}

function validateTypeAndPage(req, res, next) {
  const type = req.query.type || 'movie';
  const page = pageNumber(req.query.page);
  if (!['movie', 'tv'].includes(type)) return fail(res, 'type must be "movie" or "tv"');
  if (page === null) return fail(res, `page must be between 1 and ${MAX_PAGE}`);
  req.query.type = type;
  req.query.page = page;
  next();
}

function validateGenreType(req, res, next) {
  const type = req.query.type || 'movie';
  if (!['movie', 'tv'].includes(type)) return fail(res, 'type must be "movie" or "tv"');
  req.query.type = type;
  next();
}

function validateDiscover(req, res, next) {
  const type = req.query.type || 'movie';
  const page = pageNumber(req.query.page);
  const genres = req.query.with_genres;
  const year = req.query.year;
  const dateFrom = req.query.date_from;
  const dateTo = req.query.date_to;
  const sortBy = req.query.sort_by || 'popularity.desc';
  const allowedSorts = new Set([
    'popularity.desc',
    'vote_average.desc',
    'vote_average.asc',
    'primary_release_date.desc',
    'first_air_date.desc',
  ]);

  if (!['movie', 'tv'].includes(type)) return fail(res, 'type must be "movie" or "tv"');
  if (page === null) return fail(res, `page must be between 1 and ${MAX_PAGE}`);
  if (genres !== undefined && !/^\d+(,\d+)*$/.test(String(genres))) return fail(res, 'Invalid genre filter');
  if (year !== undefined) {
    const numericYear = Number(year);
    const latestYear = new Date().getFullYear() + 5;
    if (!/^\d{4}$/.test(String(year)) || numericYear < 1874 || numericYear > latestYear) {
      return fail(res, 'Invalid year');
    }
    req.query.year = numericYear;
  }
  const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value)) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
  if (dateFrom !== undefined && !validDate(dateFrom)) return fail(res, 'Invalid date_from');
  if (dateTo !== undefined && !validDate(dateTo)) return fail(res, 'Invalid date_to');
  if (dateFrom !== undefined && dateTo !== undefined && dateFrom > dateTo) return fail(res, 'date_from must be before date_to');
  if (year !== undefined && (dateFrom !== undefined || dateTo !== undefined)) return fail(res, 'Use either year or a date range');
  if (!allowedSorts.has(sortBy)) return fail(res, 'Invalid sort_by');

  req.query.type = type;
  req.query.page = page;
  req.query.sort_by = sortBy;
  next();
}

function validateRegion(req, res, next) {
  const region = String(req.query.region || 'US').toUpperCase();
  if (!/^[A-Z]{2}$/.test(region)) return fail(res, 'region must be a two-letter country code');
  req.query.region = region;
  next();
}

module.exports = {
  pageNumber,
  validateSearch,
  validateTrending,
  validateTypeAndPage,
  validateGenreType,
  validateDiscover,
  validateRegion,
};

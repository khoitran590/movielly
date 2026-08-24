const express = require('express');
const { cacheResponse } = require('../lib/cache');
const { validateId, validateTypeAndId } = require('../middleware/validate');
const {
  validateSearch,
  validateTrending,
  validateTypeAndPage,
  validateGenreType,
  validateDiscover,
  validateRegion,
} = require('../middleware/query');
const ctrl = require('../controllers/movies.controller');

const router = express.Router();

router.get('/search', validateSearch, cacheResponse(10 * 60), ctrl.search);
router.get('/trending', validateTrending, cacheResponse(30 * 60), ctrl.trending);
router.get('/movie/:id', validateId, cacheResponse(60 * 60), ctrl.movieDetails);
router.get('/tv/:id', validateId, cacheResponse(60 * 60), ctrl.tvDetails);
router.get('/popular', validateTypeAndPage, cacheResponse(30 * 60), ctrl.popular);
router.get('/genres', validateGenreType, cacheResponse(24 * 60 * 60), ctrl.genres);
router.get('/discover', validateDiscover, cacheResponse(30 * 60), ctrl.discover);
router.get('/provider-regions', cacheResponse(7 * 24 * 60 * 60), ctrl.providerRegions);
router.get('/provider-catalog', validateRegion, cacheResponse(24 * 60 * 60), ctrl.providerCatalog);
router.get('/:type/:id/trailer', validateTypeAndId, cacheResponse(6 * 60 * 60), ctrl.trailer);
router.get('/:type/:id/trailers', validateTypeAndId, cacheResponse(6 * 60 * 60), ctrl.trailers);
router.get('/:type/:id/similar', validateTypeAndId, cacheResponse(6 * 60 * 60), ctrl.similar);
router.get('/:type/:id/providers', validateTypeAndId, validateRegion, cacheResponse(24 * 60 * 60), ctrl.providers);

module.exports = router;

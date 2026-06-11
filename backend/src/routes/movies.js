const express = require('express');
const { cacheResponse } = require('../lib/cache');
const { validateId, validateTypeAndId } = require('../middleware/validate');
const ctrl = require('../controllers/movies.controller');

const router = express.Router();

router.get('/search', cacheResponse(10 * 60), ctrl.search);
router.get('/trending', cacheResponse(30 * 60), ctrl.trending);
router.get('/movie/:id', cacheResponse(60 * 60), validateId, ctrl.movieDetails);
router.get('/tv/:id', cacheResponse(60 * 60), validateId, ctrl.tvDetails);
router.get('/popular', cacheResponse(30 * 60), ctrl.popular);
router.get('/genres', cacheResponse(24 * 60 * 60), ctrl.genres);
router.get('/discover', cacheResponse(30 * 60), ctrl.discover);
router.get('/:type/:id/trailer', validateTypeAndId, cacheResponse(6 * 60 * 60), ctrl.trailer);
router.get('/:type/:id/trailers', validateTypeAndId, cacheResponse(6 * 60 * 60), ctrl.trailers);
router.get('/:type/:id/similar', validateTypeAndId, cacheResponse(6 * 60 * 60), ctrl.similar);

module.exports = router;

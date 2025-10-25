const express = require('express');
const router = express.Router();
const { getDistance } = require('../controller/distanceController');

router.get('/distance-api', getDistance);

module.exports = router; 
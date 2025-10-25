const express = require('express');
const router = express.Router();
const configurationController = require('../controller/configurationController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Get configuration settings
router.get('/config', configurationController.getConfiguration);

// Update configuration settings (admin only)
router.put('/config', isAuthenticated, isAdmin, configurationController.updateConfiguration);

// Reset configuration (admin only)
router.post('/config/reset', isAuthenticated, isAdmin, configurationController.resetConfiguration);

module.exports = router; 
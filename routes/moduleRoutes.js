const express = require('express');
const router = express.Router();
const moduleController = require('../controller/moduleController');
const { upload, handleMulterError } = require('../multer');

// Create a new module
router.post('/', upload.single('image'), handleMulterError, moduleController.createModule);

// Get all modules
router.get('/', moduleController.getAllModules);

// Get module by ID
router.get('/:id', moduleController.getModuleById);

// Update module
router.put('/:id', upload.single('image'), handleMulterError, moduleController.updateModule);

// Delete module
router.delete('/:id', moduleController.deleteModule);

module.exports = router;
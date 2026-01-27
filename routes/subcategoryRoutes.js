const express = require('express');
const router = express.Router();
const subcategoryController = require('../controller/subcategoryController');
const { upload } = require('../multer');

// Create a new subcategory
router.post('/', subcategoryController.createSubcategory);

// Get all subcategories
router.get('/', subcategoryController.getAllSubcategories);

// Get subcategory by ID
router.get('/:id', subcategoryController.getSubcategoryById);

// Update subcategory
router.put('/:id', subcategoryController.updateSubcategory);

// Delete subcategory
router.delete('/:id', subcategoryController.deleteSubcategory);

module.exports = router; 
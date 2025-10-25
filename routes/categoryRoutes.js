const express = require('express');
const router = express.Router();
const categoryController = require('../controller/categoryController');
const { upload } = require('../multer');

// Create a new category
router.post('/', upload.single('image'), categoryController.createCategory);

// Get all categories
router.get('/', categoryController.getAllCategories);

// Get category by ID
router.get('/:id', categoryController.getCategoryById);

// Update category
router.put('/:id', upload.single('image'), categoryController.updateCategory);

// Delete category
router.delete('/:id', categoryController.deleteCategory);

module.exports = router; 
const express = require('express');
const router = express.Router();
const {
  getAllUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit,
  getUnitsByCategory
} = require('../controller/unitController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/', getAllUnits);
router.get('/category/:category', getUnitsByCategory);
router.get('/:id', getUnitById);

// Admin routes (authentication and admin role required)
router.post('/', isAuthenticated, isAdmin, createUnit);
router.put('/:id', isAuthenticated, isAdmin, updateUnit);
router.delete('/:id', isAuthenticated, isAdmin, deleteUnit);

module.exports = router; 
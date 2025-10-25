const Unit = require('../model/Unit');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ErrorHandler = require('../utils/ErrorHandler');

// Get all units
exports.getAllUnits = catchAsyncErrors(async (req, res, next) => {
  try {
    const units = await Unit.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: units
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Get unit by ID
exports.getUnitById = catchAsyncErrors(async (req, res, next) => {
  try {
    const unit = await Unit.findById(req.params.id);
    
    if (!unit) {
      return next(new ErrorHandler('Unit not found', 404));
    }

    res.status(200).json({
      success: true,
      data: unit
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Create new unit
exports.createUnit = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id, name, description, category, sortOrder } = req.body;

    // Check if unit with same ID already exists
    const existingUnit = await Unit.findOne({ id });
    if (existingUnit) {
      return next(new ErrorHandler('Unit with this ID already exists', 400));
    }

    const unit = await Unit.create({
      id,
      name,
      description,
      category,
      sortOrder: sortOrder || 0
    });

    res.status(201).json({
      success: true,
      data: unit
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Update unit
exports.updateUnit = catchAsyncErrors(async (req, res, next) => {
  try {
    const { name, description, category, isActive, sortOrder } = req.body;

    const unit = await Unit.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        category,
        isActive,
        sortOrder
      },
      { new: true, runValidators: true }
    );

    if (!unit) {
      return next(new ErrorHandler('Unit not found', 404));
    }

    res.status(200).json({
      success: true,
      data: unit
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Delete unit
exports.deleteUnit = catchAsyncErrors(async (req, res, next) => {
  try {
    const unit = await Unit.findByIdAndDelete(req.params.id);

    if (!unit) {
      return next(new ErrorHandler('Unit not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Unit deleted successfully'
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Get units by category
exports.getUnitsByCategory = catchAsyncErrors(async (req, res, next) => {
  try {
    const { category } = req.params;
    
    const units = await Unit.find({ 
      category, 
      isActive: true 
    }).sort({ sortOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: units
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}); 
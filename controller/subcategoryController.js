const Subcategory = require('../model/Subcategory');

// Create a new subcategory
exports.createSubcategory = async (req, res) => {
    try {
        const { name, description, category } = req.body;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Image file is required'
            });
        }

        const image = req.file.location || req.file.key;

        const subcategory = new Subcategory({
            name,
            description,
            category,
            image
        });

        await subcategory.save();
        res.status(201).json({
            success: true,
            data: subcategory
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get all subcategories
exports.getAllSubcategories = async (req, res) => {
    try {
        const subcategories = await Subcategory.find().populate('category');
        res.status(200).json({
            success: true,
            data: subcategories
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get subcategory by ID
exports.getSubcategoryById = async (req, res) => {
    try {
        const subcategory = await Subcategory.findById(req.params.id).populate('category');
        if (!subcategory) {
            return res.status(404).json({
                success: false,
                error: 'Subcategory not found'
            });
        }
        res.status(200).json({
            success: true,
            data: subcategory
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Update subcategory
exports.updateSubcategory = async (req, res) => {
    try {
        const { name, description, category } = req.body;
        const updateData = { name, description, category };
        
        if (req.file) {
            updateData.image = req.file.location || req.file.key;
        }

        const subcategory = await Subcategory.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!subcategory) {
            return res.status(404).json({
                success: false,
                error: 'Subcategory not found'
            });
        }

        res.status(200).json({
            success: true,
            data: subcategory
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Delete subcategory
exports.deleteSubcategory = async (req, res) => {
    try {
        const subcategory = await Subcategory.findByIdAndDelete(req.params.id);
        
        if (!subcategory) {
            return res.status(404).json({
                success: false,
                error: 'Subcategory not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
}; 
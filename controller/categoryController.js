const Category = require('../model/Category');
const Subcategory = require('../model/Subcategory');

// Create a new category
exports.createCategory = async (req, res) => {
    try {
        const { name, description, module } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Category name is required'
            });
        }

        if (!module) {
            return res.status(400).json({
                success: false,
                error: 'Module ID is required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Image file is required'
            });
        }

        // Get the S3 URL from the uploaded file
        const image = req.file.location || req.file.key;
        
        if (!image) {
            console.error('No image URL found in file object:', req.file);
            return res.status(400).json({
                success: false,
                error: 'Failed to get image URL from S3'
            });
        }

        const category = new Category({
            name,
            description,
            module,
            image
        });

        await category.save();
        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().populate('module');
        
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Backend: Error fetching categories:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id).populate('module');
        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        // Get subcategories for this category
        const subcategories = await Subcategory.find({ category: req.params.id });

        // Add subcategories to the response
        const response = {
            success: true,
            data: {
                ...category.toObject(),
                subcategories
            }
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Update category
exports.updateCategory = async (req, res) => {
    try {
        const { name, description, module } = req.body;
        const updateData = { name, description, module };
        
        if (req.file) {
            // Get the S3 URL from the uploaded file
            const image = req.file.location || req.file.key;
            
            if (!image) {
                console.error('No image URL found in file object:', req.file);
                return res.status(400).json({
                    success: false,
                    error: 'Failed to get image URL from S3'
                });
            }
            
            updateData.image = image;
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Delete category
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        // Delete associated subcategories
        await Subcategory.deleteMany({ category: req.params.id });

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
const Module = require('../model/Module');
const Category = require('../model/Category');
const Subcategory = require('../model/Subcategory');
const mongoose = require('mongoose');

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
    if (!id) return false;
    return mongoose.Types.ObjectId.isValid(id);
};

// Create a new module
exports.createModule = async (req, res) => {
    try {
        const { name, description } = req.body;
        
        // Log the request data for debugging
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Module name is required'
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

        // Check if module with same name already exists
        const existingModule = await Module.findOne({ name });
        if (existingModule) {
            return res.status(400).json({
                success: false,
                error: 'Module with this name already exists'
            });
        }

        // Create new module
        const module = new Module({
            name,
            description,
            image
        });

        const savedModule = await module.save();
        console.log('Module saved successfully:', savedModule);
        
        res.status(201).json({
            success: true,
            data: savedModule
        });
    } catch (error) {
        console.error('Error creating module:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            details: error.stack
        });
    }
};

// Get all modules
exports.getAllModules = async (req, res) => {
    try {
        const modules = await Module.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: modules
        });
    } catch (error) {
        console.error('Error fetching modules:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get module by ID
exports.getModuleById = async (req, res) => {
    try {
        const moduleId = req.params.id;
        console.log('Received module ID:', moduleId);
        
        if (!moduleId) {
            return res.status(400).json({
                success: false,
                error: 'Module ID is required'
            });
        }

        if (!isValidObjectId(moduleId)) {
            return res.status(400).json({
                success: false,
                error: `Invalid module ID format: ${moduleId}. Expected a valid MongoDB ObjectId.`
            });
        }

        const module = await Module.findById(moduleId);
        if (!module) {
            return res.status(404).json({
                success: false,
                error: `Module not found with ID: ${moduleId}`
            });
        }
        res.status(200).json({
            success: true,
            data: module
        });
    } catch (error) {
        console.error('Error fetching module:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Update module
exports.updateModule = async (req, res) => {
    try {
        const moduleId = req.params.id;
        console.log('Updating module with ID:', moduleId);
        
        if (!moduleId) {
            return res.status(400).json({
                success: false,
                error: 'Module ID is required'
            });
        }

        if (!isValidObjectId(moduleId)) {
            return res.status(400).json({
                success: false,
                error: `Invalid module ID format: ${moduleId}. Expected a valid MongoDB ObjectId.`
            });
        }

        const { name, description } = req.body;
        const updateData = { name, description };
        
        if (req.file) {
            updateData.image = req.file.location || req.file.key;
        }

        const module = await Module.findByIdAndUpdate(
            moduleId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!module) {
            return res.status(404).json({
                success: false,
                error: `Module not found with ID: ${moduleId}`
            });
        }

        res.status(200).json({
            success: true,
            data: module
        });
    } catch (error) {
        console.error('Error updating module:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Delete module
exports.deleteModule = async (req, res) => {
    try {
        const moduleId = req.params.id;
        console.log('Deleting module with ID:', moduleId);
        
        if (!moduleId) {
            return res.status(400).json({
                success: false,
                error: 'Module ID is required'
            });
        }

        if (!isValidObjectId(moduleId)) {
            return res.status(400).json({
                success: false,
                error: `Invalid module ID format: ${moduleId}. Expected a valid MongoDB ObjectId.`
            });
        }

        const module = await Module.findByIdAndDelete(moduleId);
        
        if (!module) {
            return res.status(404).json({
                success: false,
                error: `Module not found with ID: ${moduleId}`
            });
        }

        // Delete associated categories and subcategories
        await Category.deleteMany({ module: moduleId });
        await Subcategory.deleteMany({ category: { $in: await Category.find({ module: moduleId }).select('_id') } });

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting module:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
}; 
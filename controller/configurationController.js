const Configuration = require('../model/Configuration');

// Get configuration settings
exports.getConfiguration = async (req, res) => {
    try {
        const configuration = await Configuration.findOne({ isActive: true });
        
        if (!configuration) {
            return res.status(404).json({
                success: false,
                message: 'Configuration not found'
            });
        }

        // Get configuration directly from database
        const safeConfiguration = configuration.toObject();

        res.status(200).json({
            success: true,
            data: safeConfiguration
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching configuration',
            error: error.message
        });
    }
};

// Update configuration settings
exports.updateConfiguration = async (req, res) => {
    try {
        const configuration = await Configuration.findOne({ isActive: true });
        
        if (!configuration) {
            return res.status(404).json({
                success: false,
                message: 'Configuration not found'
            });
        }

        // Update only the fields that are provided in the request
        Object.keys(req.body).forEach(key => {
            if (configuration[key] !== undefined) {
                configuration[key] = req.body[key];
            }
        });

        await configuration.save();

        res.status(200).json({
            success: true,
            message: 'Configuration updated successfully',
            data: configuration
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating configuration',
            error: error.message
        });
    }
};

// Delete existing and insert new configuration
exports.resetConfiguration = async (req, res) => {
    try {
        // Delete all existing configurations
        await Configuration.deleteMany({});

        // Create new configuration with provided data
        const newConfiguration = await Configuration.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Configuration reset successfully',
            data: newConfiguration
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error resetting configuration',
            error: error.message
        });
    }
};


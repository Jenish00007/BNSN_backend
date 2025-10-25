const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const path = require("path");

// Validate environment variables
if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_BUCKET_NAME) {
  throw new Error('Missing required AWS configuration. Please check your environment variables.');
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Define folder structure for different upload types
const UPLOAD_FOLDERS = {
  // Shop related
  PRODUCTS: 'products',
  BANNERS: 'banners',
  SHOP_AVATAR: 'shop-avatars',
  SHOP_BANNER: 'shop-banners',
  USER_AVATAR: 'user-avatars',
  
  // Admin related
  ADMIN_BANNER: 'admin/banners',
  CATEGORY_BANNER: 'admin/categories/banners',
  SUBCATEGORY_BANNER: 'admin/subcategories/banners',
  
  // Module related
  MODULE_BANNER: 'admin/modules/banners',

  // Event related
  EVENT_BANNER: 'events/banners',
  EVENT_IMAGES: 'events/images',
};

  // Map fieldnames to their respective folders
  const FOLDER_MAPPING = {
    // Shop related
    'images': UPLOAD_FOLDERS.PRODUCTS,
    'eventImages': UPLOAD_FOLDERS.EVENT_IMAGES,
    'banner': UPLOAD_FOLDERS.BANNERS,
    'shopAvatar': UPLOAD_FOLDERS.SHOP_AVATAR,
    'shopBanner': UPLOAD_FOLDERS.SHOP_BANNER,
    'avatar': UPLOAD_FOLDERS.USER_AVATAR,
    'file': UPLOAD_FOLDERS.USER_AVATAR, // For user avatar uploads
    'image': UPLOAD_FOLDERS.SHOP_AVATAR, // For shop avatar updates
    // Admin related
    'adminBanner': UPLOAD_FOLDERS.ADMIN_BANNER,
    'categoryBanner': UPLOAD_FOLDERS.CATEGORY_BANNER,
    'subcategoryBanner': UPLOAD_FOLDERS.SUBCATEGORY_BANNER,
    // Module related
    'moduleBanner': UPLOAD_FOLDERS.MODULE_BANNER,
    // Event related
    'eventBanner': UPLOAD_FOLDERS.EVENT_BANNER,
  };

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      try {
        // Log the incoming file object for debugging
        console.log('File object:', {
          fieldname: file.fieldname,
          originalname: file.originalname,
          mimetype: file.mimetype
        });

        // Validate file object
        if (!file || !file.originalname) {
          throw new Error('Invalid file object: missing originalname');
        }

        // Ensure we have a valid filename
        const originalName = file.originalname;
        const filename = originalName.split(".")[0] || 'unnamed-file';
        const fileExtension = path.extname(originalName) || '.jpg';
        
        // Get the appropriate folder based on the fieldname
        const folder = FOLDER_MAPPING[file.fieldname] || 'misc';
        
        // Create a unique suffix
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        
        // Create a path that includes the folder and a unique filename
        const filePath = `${folder}/${filename}-${uniqueSuffix}${fileExtension}`;

        // Log the constructed path for debugging
        console.log('Constructed file path:', filePath);
        
        cb(null, filePath);
      } catch (error) {
        console.error('Error in multer key function:', error);
        cb(error);
      }
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    try {
      // Log the file being filtered
      console.log('Filtering file:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype
      });

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        const error = new Error('Invalid file type. Only JPEG, PNG, GIF and WEBP are allowed.');
        error.code = 'INVALID_FILE_TYPE';
        return cb(error, false);
      }
      cb(null, true);
    } catch (error) {
      console.error('Error in fileFilter:', error);
      cb(error, false);
    }
  }
});

// Error handling middleware
const handleMulterError = (err, req, res, next) => {
  console.error('Multer error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next(err);
};

module.exports = {
  upload,
  handleMulterError,
  UPLOAD_FOLDERS
};

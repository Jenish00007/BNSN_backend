const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productId: {
    type: Number,
    unique: true,
    sparse: true, // Allow null values but ensure uniqueness when present
    index: true
  },
  name: {
    type: String,
    required: [true, "Please enter your product name!"],
  },
  description: {
    type: String,
    required: [true, "Please enter your product description!"],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, "Please select a category!"],
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subcategory',
    required: [true, "Please select a subcategory!"],
  },
  tags: {
    type: String,
  },
  originalPrice: {
    type: Number,
  },
  discountPrice: {
    type: Number,
    required: [true, "Please enter your product price!"],
  },
  stock: {
    type: Number,
    required: [true, "Please enter your product stock!"],
  },
  unit: {
    type: String,
    enum: ['kg', 'pcs','g','ml','ltr','pack'],
    required: [true, "Please select a unit!"],
  },
  unitCount: {
    type: Number,
    required: [true, "Please enter unit count!"],
  },
  maxPurchaseQuantity: {
    type: Number,
    required: [true, "Please enter maximum purchase quantity!"],
  },
  images: [
    {
      type: String,
    },
  ],
  reviews: [
    {
      user: {
        type: Object,
      },
      rating: {
        type: Number,
      },
      comment: {
        type: String,
      },
      productId: {
        type: String,
      },
      createdAt: {
        type: Date,
        default: Date.now(),
      },
    },
  ],
  ratings: {
    type: Number,
  },
  // For seller-created products
  shopId: {
    type: String,
    required: false, // Made optional to support user-created products
  },
  shop: {
    type: Object,
    required: false, // Made optional to support user-created products
  },
  // For user-created products (marketplace/OLX style)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Optional since sellers can also create products
  },
  status: {
    type: String,
    enum: ["active", "sold", "inactive"],
    default: "active",
    index: true,
  },
  expiresAt: {
    type: Date,
    default: () => Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    index: true,
  },
  soldAt: {
    type: Date,
    default: null,
  },
  inactiveAt: {
    type: Date,
    default: null,
  },
  soldReason: {
    type: String,
    default: null,
  },
  inactiveReason: {
    type: String,
    default: null,
  },
  sold_out: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

// Auto-increment productId
productSchema.pre("save", async function (next) {
  if (this.isNew && !this.productId) {
    try {
      // Get the highest productId from existing products
      const lastProduct = await this.constructor.findOne({}, {}, { sort: { productId: -1 } });
      const nextProductId = lastProduct && lastProduct.productId ? lastProduct.productId + 1 : 1;
      this.productId = nextProductId;
    } catch (error) {
      // If there's an error, default to 1
      this.productId = 1;
    }
  }
  next();
});

// Add validation to ensure either shopId or userId exists
productSchema.pre('validate', function(next) {
  if (!this.shopId && !this.userId) {
    this.invalidate('shopId', 'Either shopId or userId must be provided');
    this.invalidate('userId', 'Either shopId or userId must be provided');
  }
  next();
});

// Add indexes for better query performance
productSchema.index({ shopId: 1 });
productSchema.index({ userId: 1 });
productSchema.index({ category: 1 });
productSchema.index({ subcategory: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ status: 1, expiresAt: 1 });

productSchema.pre("save", function (next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);
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
    required: false,
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
  // Track if this was a paid post or free post
  isPaid: {
    type: Boolean,
    default: false, // Default to free post
    required: false
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
  
  // Category-specific fields - Add all possible fields from category forms
  // ANIMAL category
  animalName: { type: String },
  breed: { type: String },
  age: { type: String },
  milkYield: { type: String },
  gender: { type: String },
  vaccinated: { type: String },
  pregnantOrLactating: { type: String },
  quantityAvailable: { type: String },
  feedType: { type: String },
  housingType: { type: String },
  
  // BIRD category
  birdName: { type: String },
  
  // TREE category
  treeName: { type: String },
  ageOfTree: { type: String },
  height: { type: String },
  trunkGirth: { type: String },
  purpose: { type: String },
  
  // PADDY_RICE category
  paddyRiceName: { type: String },
  listingType: { type: String },
  varietyName: { type: String },
  farmerMillName: { type: String },
  harvestYear: { type: String },
  organic: { type: String },
  pricePer: { type: String },
  
  // VEGETABLE category
  vegetableName: { type: String },
  gradeQuality: { type: String },
  harvestDate: { type: String },
  packingType: { type: String },
  
  // SEED category
  seedName: { type: String },
  seedType: { type: String },
  
  // FRUIT category
  fruitName: { type: String },
  
  // CAR category
  carBrand: { type: String },
  carModel: { type: String },
  carVariant: { type: String },
  manufacturingYear: { type: String },
  fuelType: { type: String },
  transmission: { type: String },
  kilometersDriven: { type: Number },
  numberOfOwners: { type: String },
  rcAvailable: { type: String },
  insuranceStatus: { type: String },
  insuranceExpiryDate: { type: String },
  
  // BIKE category
  brand: { type: String },
  model: { type: String },
  variant: { type: String },
  gearType: { type: String },
  condition: { type: String },
  workingStatus: { type: String },
  batteryHealth: { type: String },
  networkType: { type: String },
  
  // MACHINERY category
  machineryName: { type: String },
  modelNumber: { type: String },
  powerCapacity: { type: String },
  fuelPowerType: { type: String },
  phase: { type: String },
  
  // PROPERTY category
  listingType: { type: String },
  propertyType: { type: String },
  size: { type: String },
  propertyCondition: { type: String },
  
  // ELECTRONICS category
  electronicsName: { type: String },
  keySpecifications: { type: String },
  powerType: { type: String },
  purchaseYear: { type: String },
  
  // MOBILE category
  mobileName: { type: String },
  modelName: { type: String },
  color: { type: String },
  ram: { type: String },
  storage: { type: String },
  
  // FURNITURE category
  furnitureName: { type: String },
  materialType: { type: String },
  length: { type: String },
  width: { type: String },
  furnitureHeight: { type: String }, // Renamed to avoid conflict
  
  // FASHION category
  fashionName: { type: String },
  productType: { type: String },
  brandName: { type: String },
  fashionSize: { type: String }, // Renamed to avoid conflict
  materialFabricType: { type: String },
  careInstructions: { type: String },
  
  // JOB category
  jobTitle: { type: String },
  jobCategory: { type: String },
  companyName: { type: String },
  jobType: { type: String },
  workLocation: { type: String },
  workMode: { type: String },
  experienceRequired: { type: String },
  qualification: { type: String },
  salaryRange: { type: String },
  salaryType: { type: String },
  skillsRequired: { type: String },
  genderPreference: { type: String },
  ageLimit: { type: String },
  hiringType: { type: String },
  numberOfOpenings: { type: Number },
  joiningTime: { type: String },
  
  // PET category
  petName: { type: String },
  
  // MUSIC_INSTRUMENT category
  instrumentName: { type: String },
  instrumentType: { type: String },
  accessoriesIncluded: { type: [String] },
  
  // GYM_EQUIPMENT category
  equipmentName: { type: String },
  weightCapacity: { type: String },
  voltagePhase: { type: String },
  
  // FISH category
  fishName: { type: String },
  catchType: { type: String },
  catchDate: { type: String },
  freshnessLevel: { type: String },
  cleaned: { type: String },
  
  // VEHICLE category
  vehicleName: { type: String },
  engineCapacityPower: { type: String },
  
  // SERVICE category
  serviceName: { type: String },
  serviceTitle: { type: String },
  serviceType: { type: String },
  servicesOffered: { type: String },
  experience: { type: String },
  availability: { type: String },
  pricingType: { type: String },
  
  // SCRAP category
  scrapName: { type: String },
  scrapTypeName: { type: String },
  weightQuantity: { type: String },
  
  // SPORTS_ITEM category
  sportsItemName: { type: String },
  sizeWeight: { type: String },
  ageGroup: { type: String },
  
  // BOOK category
  bookCategory: { type: String },
  bookTitle: { type: String },
  authorName: { type: String },
  publisher: { type: String },
  editionYear: { type: String },
  language: { type: String },
  numberOfBooks: { type: Number },
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

// Add timestamps to the schema
productSchema.set('timestamps', true);

module.exports = mongoose.model("Product", productSchema);
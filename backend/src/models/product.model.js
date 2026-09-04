import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    artisan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please enter a product name'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'General Craft',
    },
    material: {
      type: String,
      trim: true,
      default: '',
    },
    craftType: {
      type: String,
      trim: true,
      default: '',
    },
    originalImage: {
      type: String,
      default: '',
    },
    enhancedImage: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Please specify a selling price'],
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    materialCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    labourCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    packagingCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    otherCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    language: {
      type: String,
      default: 'EN',
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Market-Ready', 'Archived'],
      default: 'Draft',
    },
    pricingRecommendation: {
      recommendedPrice: Number,
      minimumPrice: Number,
      premiumPrice: Number,
      confidence: Number,
      marketRange: String,
      calculatedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);


export const Product = mongoose.model('Product', productSchema);
export default Product;

import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 1 },
  sku: { type: String, required: true, trim: true, uppercase: true, minlength: 1 },
  category: { type: String, required: true, trim: true, minlength: 1 },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 0, validate: Number.isInteger },
  lowStockThreshold: { type: Number, default: 5, min: 0, validate: Number.isInteger },
  description: { type: String, trim: true, default: '' },
  businessId: { type: mongoose.Schema.Types.ObjectId, required: true, immutable: true }
}, { timestamps: true, versionKey: false });

productSchema.index({ businessId: 1, sku: 1 }, { unique: true });

export default mongoose.model('Product', productSchema);

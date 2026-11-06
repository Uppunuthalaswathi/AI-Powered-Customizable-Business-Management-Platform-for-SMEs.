import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { getStockStatus, STOCK_STATUS } from '../utils/stockStatus.js';

function businessId() {
  const id = process.env.DEMO_BUSINESS_ID;
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error('DEMO_BUSINESS_ID must be a valid MongoDB ObjectId. Configure backend/.env.');
    error.status = 500;
    throw error;
  }
  return new mongoose.Types.ObjectId(id);
}

function validateBody(body, partial = false) {
  const fields = ['name', 'sku', 'category', 'price', 'quantity', 'lowStockThreshold', 'description'];
  for (const field of fields) {
    if (partial && !(field in body)) continue;
    if (['name', 'sku', 'category'].includes(field) && (typeof body[field] !== 'string' || !body[field].trim())) {
      throw Object.assign(new Error(`${field} is required and must be a non-empty string.`), { status: 400 });
    }
    if (field === 'price' && (!Number.isFinite(body.price) || body.price < 0)) {
      throw Object.assign(new Error('price must be a non-negative number.'), { status: 400 });
    }
    if (['quantity', 'lowStockThreshold'].includes(field) && body[field] !== undefined && (!Number.isInteger(body[field]) || body[field] < 0)) {
      throw Object.assign(new Error(`${field} must be a non-negative integer.`), { status: 400 });
    }
    if (field === 'description' && body.description !== undefined && typeof body.description !== 'string') {
      throw Object.assign(new Error('description must be a string.'), { status: 400 });
    }
  }
  if (!partial && (!Number.isInteger(body.quantity) || body.quantity < 0)) {
    throw Object.assign(new Error('quantity must be a non-negative integer.'), { status: 400 });
  }
}

function withStatus(product) {
  const value = product.toObject ? product.toObject() : product;
  return { ...value, stockStatus: getStockStatus(value.quantity, value.lowStockThreshold) };
}

export async function createProduct(req, res) {
  validateBody(req.body);
  const product = await Product.create({ ...req.body, businessId: businessId() });
  res.status(201).json({ success: true, data: withStatus(product) });
}

export async function listProducts(req, res) {
  const filter = { businessId: businessId() };
  const validStatuses = Object.values(STOCK_STATUS);
  if (req.query.status && !validStatuses.includes(req.query.status)) {
    throw Object.assign(new Error(`status must be one of: ${validStatuses.join(', ')}.`), { status: 400 });
  }
  if (req.query.search) {
    const search = String(req.query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ name: { $regex: search, $options: 'i' } }, { sku: { $regex: search, $options: 'i' } }];
  }
  const products = await Product.find(filter).sort({ createdAt: -1 });
  const status = req.query.status;
  const data = products.map(withStatus).filter(p => !status || (validStatuses.includes(status) && p.stockStatus === status));
  res.json({ success: true, data });
}

export async function productSummary(req, res) {
  const products = await Product.find({ businessId: businessId() }).select('quantity lowStockThreshold');
  const summary = { totalProducts: products.length, lowStockProducts: 0, outOfStockProducts: 0 };
  for (const product of products) {
    const status = getStockStatus(product.quantity, product.lowStockThreshold);
    if (status === STOCK_STATUS.LOW_STOCK) summary.lowStockProducts += 1;
    if (status === STOCK_STATUS.OUT_OF_STOCK) summary.outOfStockProducts += 1;
  }
  res.json({ success: true, data: summary });
}

export async function getProduct(req, res) {
  const product = await Product.findOne({ _id: req.params.id, businessId: businessId() });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
  res.json({ success: true, data: withStatus(product) });
}

export async function updateProduct(req, res) {
  validateBody(req.body, true);
  const changes = Object.fromEntries(Object.entries(req.body).filter(([key]) => ['name', 'sku', 'category', 'price', 'quantity', 'lowStockThreshold', 'description'].includes(key)));
  const product = await Product.findOneAndUpdate({ _id: req.params.id, businessId: businessId() }, changes, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
  res.json({ success: true, data: withStatus(product) });
}

export async function deleteProduct(req, res) {
  const product = await Product.findOneAndDelete({ _id: req.params.id, businessId: businessId() });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
  res.json({ success: true, message: 'Product deleted.' });
}

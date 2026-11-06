import mongoose from 'mongoose';
import Product from '../models/Product.js';

function configuredBusinessId() {
  const value = process.env.DEMO_BUSINESS_ID;
  if (!mongoose.isValidObjectId(value)) {
    throw Object.assign(new Error('AI analytics requires a valid configured business context.'), { status: 500 });
  }
  return new mongoose.Types.ObjectId(value);
}

export async function inventoryAnalytics(req, res) {
  // The only identity model in this demo is a server-configured business. Never
  // accept businessId from the request as authorization.
  const products = await Product.find({ businessId: configuredBusinessId() })
    .select('name sku category price quantity lowStockThreshold')
    .lean();
  const serviceUrl = (process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
  let response;
  try {
    response = await fetch(`${serviceUrl}/api/v1/inventory/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({ products: products.map((p) => ({
        product_id: p.sku, name: p.name, category: p.category,
        quantity: p.quantity, unit_price: p.price, reorder_level: p.lowStockThreshold ?? 5
      })) })
    });
  } catch {
    throw Object.assign(new Error('AI service is unavailable. Start it locally and retry.'), { status: 503 });
  }
  if (!response.ok) throw Object.assign(new Error('AI service could not analyze the inventory.'), { status: 502 });
  const result = await response.json();
  res.json({ success: true, data: result.data });
}

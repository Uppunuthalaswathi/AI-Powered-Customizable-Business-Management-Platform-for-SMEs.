import { useEffect, useState } from 'react';

const blank = { name: '', sku: '', category: '', price: '', quantity: '', lowStockThreshold: '5', description: '' };
export default function ProductForm({ product, onClose, onSubmit, busy }) {
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');
  useEffect(() => {
    setForm(product ? { name: product.name, sku: product.sku, category: product.category, price: String(product.price), quantity: String(product.quantity), lowStockThreshold: String(product.lowStockThreshold), description: product.description || '' } : blank);
    setError('');
  }, [product]);
  const change = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    const price = Number(form.price), quantity = Number(form.quantity), lowStockThreshold = Number(form.lowStockThreshold);
    if (!form.name.trim() || !form.sku.trim() || !form.category.trim()) return setError('Enter a name, SKU, and category.');
    if (form.price === '' || !Number.isFinite(price) || price < 0) return setError('Price must be zero or greater.');
    if (form.quantity === '' || !Number.isInteger(quantity) || quantity < 0) return setError('Quantity must be a whole number of zero or greater.');
    if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) return setError('Low-stock threshold must be a whole number of zero or greater.');
    try { await onSubmit({ name: form.name.trim(), sku: form.sku.trim(), category: form.category.trim(), price, quantity, lowStockThreshold, description: form.description.trim() }); }
    catch (e) { setError(e.message || 'Could not save this product.'); }
  }
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="form-title"><div className="modal-heading"><div><span className="eyebrow">INVENTORY ITEM</span><h2 id="form-title">{product ? 'Edit product' : 'Add a product'}</h2><p>Keep your stock details up to date.</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close">×</button></div><form onSubmit={submit}><div className="form-grid">
    <label className="field field-wide">Product name<input name="name" value={form.name} onChange={change} placeholder="e.g. Ceramic travel mug" autoFocus /></label>
    <label className="field">SKU<input name="sku" value={form.sku} onChange={change} placeholder="e.g. MUG-001" /></label>
    <label className="field">Category<input name="category" value={form.category} onChange={change} placeholder="e.g. Drinkware" /></label>
    <label className="field">Selling price<input name="price" type="number" min="0" step="0.01" value={form.price} onChange={change} placeholder="0.00" /></label>
    <label className="field">Quantity<input name="quantity" type="number" min="0" step="1" value={form.quantity} onChange={change} placeholder="0" /></label>
    <label className="field field-wide">Low-stock threshold<input name="lowStockThreshold" type="number" min="0" step="1" value={form.lowStockThreshold} onChange={change} /><small>Alert when stock reaches this quantity.</small></label>
    <label className="field field-wide">Description <span className="optional">Optional</span><textarea name="description" rows="3" value={form.description} onChange={change} placeholder="Add helpful product details…" /></label>
  </div>{error && <div className="form-error" role="alert">{error}</div>}<div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Saving…' : product ? 'Save changes' : 'Add product'}</button></div></form></section></div>;
}

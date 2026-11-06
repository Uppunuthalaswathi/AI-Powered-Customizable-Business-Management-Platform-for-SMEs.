import { useCallback, useEffect, useMemo, useState } from 'react';
import ProductForm from '../components/ProductForm.jsx';
import ProductTable from '../components/ProductTable.jsx';
import SummaryCard from '../components/SummaryCard.jsx';
import { productService } from '../services/productService.js';

function errorMessage(error) { return error.response?.data?.message || error.message || 'Something went wrong. Please try again.'; }
export default function InventoryDashboard() {
  const [products, setProducts] = useState([]), [summary, setSummary] = useState({ totalProducts: 0, lowStockProducts: 0, outOfStockProducts: 0 });
  const [search, setSearch] = useState(''), [status, setStatus] = useState(''), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null), [notice, setNotice] = useState(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { const [list, counts] = await Promise.all([productService.list({ search, status }), productService.summary()]); setProducts(list); setSummary(counts); }
    catch (error) { setNotice({ type: 'error', text: errorMessage(error) }); }
    finally { setLoading(false); }
  }, [search, status]);
  useEffect(() => { const timer = window.setTimeout(refresh, 250); return () => window.clearTimeout(timer); }, [refresh]);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(null), 4500); return () => window.clearTimeout(timer); }, [notice]);
  const filteredLabel = useMemo(() => status === 'LOW_STOCK' ? 'Low stock' : status === 'OUT_OF_STOCK' ? 'Out of stock' : 'All products', [status]);
  async function save(values) {
    setBusy(true);
    try { if (modal.product) await productService.update(modal.product._id, values); else await productService.create(values); setModal(null); setNotice({ type: 'success', text: modal.product ? 'Product updated successfully.' : 'Product added successfully.' }); await refresh(); }
    catch (error) { throw new Error(errorMessage(error)); }
    finally { setBusy(false); }
  }
  async function remove(product) {
    if (!window.confirm(`Delete “${product.name}” (${product.sku})? This cannot be undone.`)) return;
    try { await productService.remove(product._id); setNotice({ type: 'success', text: 'Product deleted.' }); await refresh(); }
    catch (error) { setNotice({ type: 'error', text: errorMessage(error) }); }
  }
  return <div className="app-shell"><header className="topbar"><a className="brand" href="#inventory" aria-label="Stockwise home"><span className="brand-mark">S</span><span>stockwise</span></a><nav className="main-nav"><a className="nav-link active" href="#inventory"><span>▦</span> Inventory</a></nav><div className="topbar-right"><span className="workspace-label"><span className="online-dot" /> Demo workspace</span><div className="avatar">S</div></div></header>
    <main className="dashboard" id="inventory"><div className="page-heading"><div><div className="breadcrumb">Workspace <span>/</span> Inventory</div><h1>Inventory</h1><p>Keep track of your products and stock levels.</p></div><button className="button button-primary add-button" onClick={() => setModal({ product: null })}><span>＋</span> Add product</button></div>
    <section className="summary-grid" aria-label="Inventory summary"><SummaryCard label="Total products" value={summary.totalProducts} tone="products" helper="Across your inventory"/><SummaryCard label="Low stock" value={summary.lowStockProducts} tone="low" helper="Need restocking soon"/><SummaryCard label="Out of stock" value={summary.outOfStockProducts} tone="out" helper="Currently unavailable"/></section>
    <section className="inventory-panel"><div className="panel-heading"><div><h2>Products</h2><p>View and manage the items you sell.</p></div><span className="product-count">{loading ? '…' : `${products.length} ${products.length === 1 ? 'item' : 'items'}`}</span></div><div className="toolbar"><label className="search-box"><span>⌕</span><input aria-label="Search products" placeholder="Search by product or SKU…" value={search} onChange={e => setSearch(e.target.value)} /><kbd>⌘ K</kbd></label><label className="filter-select"><span className="filter-icon">☷</span><select aria-label="Filter stock status" value={status} onChange={e => setStatus(e.target.value)}><option value="">All stock status</option><option value="LOW_STOCK">Low stock</option><option value="OUT_OF_STOCK">Out of stock</option><option value="IN_STOCK">In stock</option></select><span className="select-chevron">⌄</span></label></div>
      {notice && <div className={`notice notice-${notice.type}`} role="status"><span>{notice.type === 'success' ? '✓' : '!'}</span>{notice.text}<button onClick={() => setNotice(null)} aria-label="Dismiss message">×</button></div>}
      {loading ? <div className="loading-state"><span className="spinner"/> Loading products…</div> : <ProductTable products={products} onEdit={product => setModal({ product })} onDelete={remove}/>}
    </section><footer className="footer-note"><span>Stockwise inventory</span><span>Stock levels update as products change</span></footer></main>
    {modal && <ProductForm product={modal.product} busy={busy} onClose={() => !busy && setModal(null)} onSubmit={save}/>}</div>;
}

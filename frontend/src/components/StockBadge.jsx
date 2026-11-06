const labels = { IN_STOCK: 'In stock', LOW_STOCK: 'Low stock', OUT_OF_STOCK: 'Out of stock' };
export default function StockBadge({ status }) {
  return <span className={`stock-badge stock-${status?.toLowerCase().replaceAll('_', '-') || 'unknown'}`}><span className="badge-dot" />{labels[status] || 'Unknown'}</span>;
}

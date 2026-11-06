const icons = { products: '▦', low: '↘', out: '!', };
export default function SummaryCard({ label, value, tone, helper }) {
  return <article className="summary-card"><div className={`summary-icon ${tone}`}>{icons[tone]}</div><div className="summary-copy"><span>{label}</span><strong>{value}</strong><small>{helper}</small></div></article>;
}

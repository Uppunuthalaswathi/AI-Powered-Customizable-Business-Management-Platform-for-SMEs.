export default function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.code === 11000) return res.status(409).json({ success: false, message: 'A product with this SKU already exists for this business.' });
  if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid product ID.' });
  if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: error.message });
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ success: false, message: status === 500 ? 'An unexpected server error occurred.' : error.message });
}

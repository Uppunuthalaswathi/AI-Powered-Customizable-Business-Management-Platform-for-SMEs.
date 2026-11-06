export const STOCK_STATUS = Object.freeze({
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  LOW_STOCK: 'LOW_STOCK',
  IN_STOCK: 'IN_STOCK'
});

export function getStockStatus(quantity, lowStockThreshold) {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new TypeError('quantity must be a non-negative integer');
  }
  if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
    throw new TypeError('lowStockThreshold must be a non-negative integer');
  }
  if (quantity === 0) return STOCK_STATUS.OUT_OF_STOCK;
  if (quantity <= lowStockThreshold) return STOCK_STATUS.LOW_STOCK;
  return STOCK_STATUS.IN_STOCK;
}

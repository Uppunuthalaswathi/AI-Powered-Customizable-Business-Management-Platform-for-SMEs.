import { Router } from 'express';
import { createProduct, deleteProduct, getProduct, listProducts, productSummary, updateProduct } from '../controllers/productController.js';

const router = Router();
router.post('/', createProduct);
router.get('/', listProducts);
router.get('/summary', productSummary);
router.get('/:id', getProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
export default router;

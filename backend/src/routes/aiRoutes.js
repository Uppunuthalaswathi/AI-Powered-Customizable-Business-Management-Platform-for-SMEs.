import { Router } from 'express';
import { inventoryAnalytics } from '../controllers/aiController.js';

const router = Router();
router.get('/inventory/summary', inventoryAnalytics);
export default router;

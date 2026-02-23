import { Router } from 'express';
import { placeBid, getBidHistory, getHighestBidHandler } from '../controllers/bidController';
import { authGuard } from '../middleware/authMiddleware';

const router = Router();

// Protected routes
router.post('/', authGuard, placeBid);

// Public routes
router.get('/auction/:id/history', getBidHistory);
router.get('/auction/:id/highest', getHighestBidHandler);

export default router;

import { Router } from 'express';
import { placeBid, getBidHistory, getHighestBidHandler, getMyBids } from '../controllers/bidController';
import { authGuard } from '../middleware/authMiddleware';

const router = Router();

// Protected routes
router.post('/', authGuard, placeBid);
router.get('/my', authGuard, getMyBids);

router.get('/auction/:id/history', getBidHistory);
router.get('/auction/:id/highest', getHighestBidHandler);

export default router;

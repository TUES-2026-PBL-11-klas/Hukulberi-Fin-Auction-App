import { Router } from 'express';
import { createAuction, getAuctions, getAuctionById, getMyAuctions } from '../controllers/auctionController';
import { getBidHistory } from '../controllers/bidController';
import { authGuard } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getAuctions);

router.get('/mine', authGuard, getMyAuctions);

router.get('/:id/bids', getBidHistory);

router.get('/:id', getAuctionById);

router.post('/', authGuard, createAuction);

export default router;

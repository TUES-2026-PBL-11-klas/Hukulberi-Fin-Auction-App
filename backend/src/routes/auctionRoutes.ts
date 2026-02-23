import { Router } from 'express';
import { createAuction, getAuctions, getAuctionById } from '../controllers/auctionController';
import { authGuard } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getAuctions);

router.get('/:id', getAuctionById);

router.post('/', authGuard, createAuction);

export default router;

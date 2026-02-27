import { Router } from 'express';
import {
  deleteAuction,
  banUser,
  getAllUsers,
  getAllAuctionsAdmin,
  getAnalytics
} from '../controllers/adminController';
import { authGuard, adminOnly } from '../middleware/authMiddleware';

const router = Router();

// Admin-only routes
router.delete('/auctions/:id', authGuard, adminOnly, deleteAuction);
router.patch('/users/:id/ban', authGuard, adminOnly, banUser);
router.get('/users', authGuard, adminOnly, getAllUsers);
router.get('/auctions', authGuard, adminOnly, getAllAuctionsAdmin);
router.get('/analytics', authGuard, adminOnly, getAnalytics);

export default router;
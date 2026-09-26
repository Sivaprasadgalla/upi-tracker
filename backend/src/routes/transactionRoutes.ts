import { Router } from 'express';
import {
  ingestNotification,
  getTransactions,
  createManual,
  updateTransaction,
  deleteTransaction
} from '../controllers/transactionController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// Ingestion endpoint for Android Headless Service & iOS Shortcut Webhook
router.post('/ingest', authenticate, ingestNotification);

// Core CRUD
router.get('/', authenticate, getTransactions);
router.post('/manual', authenticate, createManual);
router.put('/:id', authenticate, updateTransaction);
router.delete('/:id', authenticate, deleteTransaction);

export default router;

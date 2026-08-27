import { Router } from 'express';
import { chat, getKnowledgeBase, createKnowledgeArticle } from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/chat', chat);
router.get('/knowledge-base', getKnowledgeBase);
router.post('/knowledge-base', createKnowledgeArticle);

export default router;

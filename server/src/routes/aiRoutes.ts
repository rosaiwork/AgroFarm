import express from 'express';
import { aiController } from '../controllers/aiController';

const router = express.Router();

// Налаштування API ключа
router.post('/api-key', aiController.setApiKey);
router.get('/api-status', aiController.checkApiStatus);

// Генерація контенту
router.post('/generate-scenario', aiController.generateScenario);
router.post('/generate-news', aiController.generateNews);
router.post('/analyze-game', aiController.analyzeGameState);

export default router; 
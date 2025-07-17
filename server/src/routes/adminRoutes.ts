import express from 'express';
import * as pestController from '../controllers/pestController';
import * as plantService from '../services/plantService';
import * as adminController from '../controllers/adminController';

const router = express.Router();

// Маршрут для запуску таймера шкідників
router.post('/pests/start-timer', async (req, res) => {
  try {
    const result = await pestController.startPestTimer();
    res.json(result);
  } catch (error) {
    console.error('Помилка запуску таймера шкідників:', error);
    res.status(500).json({ success: false, message: 'Помилка сервера' });
  }
});

// Маршрут для зупинки таймера шкідників
router.post('/pests/stop-timer', (req, res) => {
  try {
    const result = pestController.stopPestTimer();
    res.json(result);
  } catch (error) {
    console.error('Помилка зупинки таймера шкідників:', error);
    res.status(500).json({ success: false, message: 'Помилка сервера' });
  }
});

// Маршрут для ручної генерації шкідників (для тестування)
router.post('/pests/generate', async (req, res) => {
  try {
    const result = await pestController.manualGeneratePests();
    res.json(result);
  } catch (error) {
    console.error('Помилка генерації шкідників:', error);
    res.status(500).json({ success: false, message: 'Помилка сервера' });
  }
});

// Маршрут для перевірки шкодочинності шкідників
router.post('/pests/check-damage', async (req, res) => {
  try {
    const result = await plantService.checkPestsDamage();
    res.json(result);
  } catch (error) {
    console.error('Помилка перевірки шкодочинності шкідників:', error);
    res.status(500).json({ success: false, message: 'Помилка сервера' });
  }
});

// Маршрут для отримання налаштувань гри
router.get('/settings', adminController.getGameSettings);

// Маршрут для оновлення налаштувань гри
router.put('/settings', adminController.updateGameSettings);

// Налаштування часу росту рослин
router.put('/growth-time', adminController.updateGrowthTime);
router.get('/growth-time', adminController.getGrowthTime);

// Управління таймером шкідників
router.post('/pest-timer/start', adminController.startPestTimer);
router.post('/pest-timer/stop', adminController.stopPestTimer);
router.put('/pest-timer/interval', adminController.updatePestTimerInterval);
router.get('/pest-timer/status', adminController.getPestTimerStatus);

// Управління цінами на ринку
router.put('/market-prices', adminController.updateMarketPrices);
router.get('/market-prices', adminController.getMarketPrices);

// Управління новинами
router.post('/news', adminController.createNews);
router.post('/news/apply', adminController.applyNewsImmediately);
router.get('/news', adminController.getNews);
router.get('/news/all', adminController.getAllNews);
router.delete('/news/:newsId', adminController.deleteNews);

// Таймер рандомних новин
router.post('/news-timer/start', adminController.startNewsTimer);
router.post('/news-timer/stop', adminController.stopNewsTimer);
router.put('/news-timer/interval', adminController.updateNewsTimerInterval);
router.get('/news-timer/status', adminController.getNewsTimerStatus);

// Статистика
router.get('/statistics', adminController.getStatistics);

export default router; 
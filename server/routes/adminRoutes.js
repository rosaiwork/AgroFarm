const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

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

// Таймер рандомних новин
router.post('/news-timer/start', adminController.startNewsTimer);
router.post('/news-timer/stop', adminController.stopNewsTimer);
router.put('/news-timer/interval', adminController.updateNewsTimerInterval);
router.get('/news-timer/status', adminController.getNewsTimerStatus);

// Статистика
router.get('/statistics', adminController.getStatistics);

module.exports = router; 
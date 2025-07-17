import express from 'express';
import * as plotController from '../controllers/plotController';

// Створення маршрутизатора
const router = express.Router();

// Отримати всі грядки гравця
router.get('/', plotController.getPlots);

// Посадити насіння в грядку
router.post('/plant', plotController.plantSeed);

// Полити грядку
router.post('/water', plotController.waterPlot);

// Використати добриво
router.post('/fertilize', plotController.fertilizePlot);

// Використати пестицид
router.post('/pesticide', plotController.usePesticide);

// Зібрати врожай
router.post('/harvest', plotController.harvestPlot);

// Очистити грядку з мертвою рослиною
router.post('/clear-dead', plotController.clearDeadPlot);

// Видалити рослину з грядки
router.post('/remove-plant', plotController.removePlant);

export default router; 
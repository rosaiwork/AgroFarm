import express from 'express';
import * as marketController from '../controllers/marketController';
import { getUserIdFromRequest } from '../middleware/getUserMiddleware';

const router = express.Router();

// Отримати всі товари на ринку
router.get('/', async (req, res) => {
  try {
    const marketItems = await marketController.getMarketItems();
    res.json(marketItems);
  } catch (error) {
    console.error('Помилка отримання даних ринку:', error);
    res.status(500).json({ message: 'Помилка отримання даних ринку' });
  }
});

// Купити товар на ринку
router.post('/buy', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { itemId, quantity } = req.body;
    
    if (!itemId) {
      return res.status(400).json({ message: 'Не вказано ID товару' });
    }
    
    const result = await marketController.buyItem(
      userId, 
      itemId, 
      quantity || 1
    );
    
    // Отримуємо оновлений товар з ринку після зміни ціни
    const updatedMarketItem = await marketController.getMarketItems();
    const marketItem = updatedMarketItem.find(item => item.itemId === itemId);
    
    res.json({
      message: `Куплено ${quantity || 1} ${itemId}`,
      player: {
        coins: result.player.coins,
        inventory: result.player.inventory,
        inventoryCount: result.player.inventoryCount,
        inventoryCapacity: result.player.inventoryCapacity
      },
      marketItem: marketItem
    });
  } catch (error: any) {
    console.error('Помилка купівлі товару:', error);
    res.status(400).json({ message: error.message || 'Помилка купівлі товару' });
  }
});

// Продати товар на ринку
router.post('/sell', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { itemId, quantity } = req.body;
    
    if (!itemId) {
      return res.status(400).json({ message: 'Не вказано ID товару' });
    }
    
    const result = await marketController.sellItem(
      userId, 
      itemId, 
      quantity || 1
    );
    
    // Отримуємо оновлений товар з ринку після зміни ціни
    const updatedMarketItem = await marketController.getMarketItems();
    const marketItem = updatedMarketItem.find(item => item.itemId === itemId);
    
    res.json({
      message: `Продано ${quantity || 1} ${itemId}`,
      coins: result.player.coins,
      inventory: result.player.inventory,
      inventoryCount: result.player.inventoryCount,
      inventoryCapacity: result.player.inventoryCapacity,
      marketItem: marketItem
    });
  } catch (error: any) {
    console.error('Помилка продажу товару:', error);
    res.status(400).json({ message: error.message || 'Помилка продажу товару' });
  }
});

// Отримати історію цін конкретного товару
router.get('/price-history/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const priceHistory = await marketController.getItemPriceHistory(itemId);
    res.json(priceHistory);
  } catch (error: any) {
    console.error('Помилка отримання історії цін:', error);
    res.status(400).json({ message: error.message || 'Помилка отримання історії цін' });
  }
});

// Отримати історію цін всіх товарів
router.get('/price-history', async (req, res) => {
  try {
    const allPriceHistory = await marketController.getAllPriceHistory();
    res.json(allPriceHistory);
  } catch (error: any) {
    console.error('Помилка отримання історії цін усіх товарів:', error);
    res.status(500).json({ message: 'Помилка отримання історії цін усіх товарів' });
  }
});

export default router; 
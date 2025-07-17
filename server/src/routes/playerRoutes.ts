import express from 'express';
import { Player } from '../models';
import * as playerController from '../controllers/playerController';

// Створення маршрутизатора
const router = express.Router();

// Отримати дані гравця
router.get('/', playerController.getPlayerData);

// Створити нового гравця або авторизувати існуючого
router.post('/auth', playerController.getPlayerData);

// Оновити налаштування гравця
router.put('/settings', async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;
    const { language, notifications } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Потрібна авторизація' });
    }
    
    const player = await Player.findOneAndUpdate(
      { user_id: userId },
      { 
        settings: {
          language,
          notifications
        }
      },
      { new: true }
    );
    
    if (!player) {
      return res.status(404).json({ message: 'Гравця не знайдено' });
    }
    
    res.json(player.settings);
  } catch (error) {
    console.error('Помилка оновлення налаштувань гравця:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// Купити предмет
router.post('/buy', playerController.buyItem);

// Продати овочі
router.post('/sell', playerController.sellVegetable);

// Розширити склад
router.post('/expand-inventory', playerController.expandInventory);

// Отримати лідерборд
router.get('/leaderboard', playerController.getLeaderboard);

export default router; 
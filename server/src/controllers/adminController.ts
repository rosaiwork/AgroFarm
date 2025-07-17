import { Request, Response } from 'express';
import { GameSettings, AdminSettings, News, Player } from '../models';
import Market from '../models/Market';
import * as pestController from './pestController';
import * as newsController from './newsController';

/**
 * Отримання налаштувань гри
 */
export const getGameSettings = async (req: Request, res: Response) => {
  try {
    const gameSettings = await GameSettings.findOne();
    
    if (!gameSettings) {
      return res.status(404).json({ message: 'Налаштування гри не знайдено' });
    }
    
    res.json(gameSettings);
  } catch (error) {
    console.error('Помилка отримання налаштувань гри:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Оновлення налаштувань гри
 */
export const updateGameSettings = async (req: Request, res: Response) => {
  try {
    const { baseGrowthTimeMinutes, pestTimerSeconds, marketPrices, pestTimerEnabled, randomNewsTimerSeconds, randomNewsTimerEnabled } = req.body;
    
    let gameSettings = await GameSettings.findOne();
    
    if (!gameSettings) {
      return res.status(404).json({ message: 'Налаштування гри не знайдено' });
    }
    
    // Оновлюємо налаштування
    if (baseGrowthTimeMinutes !== undefined) {
      gameSettings.baseGrowthTimeMinutes = baseGrowthTimeMinutes;
    }
    
    if (pestTimerSeconds !== undefined) {
      gameSettings.pestTimerSeconds = pestTimerSeconds;
      
      // Перезапускаємо таймер шкідників з новим інтервалом
      if (gameSettings.pestTimerEnabled) {
        await pestController.startPestTimer();
      }
    }
    
    if (marketPrices) {
      if (marketPrices.cucumber !== undefined) gameSettings.marketPrices.cucumber = marketPrices.cucumber;
      if (marketPrices.tomato !== undefined) gameSettings.marketPrices.tomato = marketPrices.tomato;
      if (marketPrices.carrot !== undefined) gameSettings.marketPrices.carrot = marketPrices.carrot;
      if (marketPrices.corn !== undefined) gameSettings.marketPrices.corn = marketPrices.corn;
      if (marketPrices.water !== undefined) gameSettings.marketPrices.water = marketPrices.water;
      if (marketPrices.seeds !== undefined) gameSettings.marketPrices.seeds = marketPrices.seeds;
      if (marketPrices.fertilizer !== undefined) gameSettings.marketPrices.fertilizer = marketPrices.fertilizer;
      if (marketPrices.pesticide !== undefined) gameSettings.marketPrices.pesticide = marketPrices.pesticide;
    }
    
    if (pestTimerEnabled !== undefined) {
      gameSettings.pestTimerEnabled = pestTimerEnabled;
      
      if (pestTimerEnabled) {
        await pestController.startPestTimer();
      } else {
        pestController.stopPestTimer();
      }
    }
    
    let shouldRestartNewsTimer = false;
    
    if (randomNewsTimerSeconds !== undefined) {
      gameSettings.randomNewsTimerSeconds = randomNewsTimerSeconds;
      shouldRestartNewsTimer = true;
    }
    
    if (randomNewsTimerEnabled !== undefined) {
      gameSettings.randomNewsTimerEnabled = randomNewsTimerEnabled;
      shouldRestartNewsTimer = true;
    }
    
    await gameSettings.save();
    
    // Перезапускаємо таймер новин, якщо були змінені відповідні налаштування
    if (shouldRestartNewsTimer) {
      if (gameSettings.randomNewsTimerEnabled) {
        await newsController.startNewsTimer();
      } else {
        newsController.stopNewsTimer();
      }
    }
    
    res.json({ 
      message: 'Налаштування гри успішно оновлено',
      settings: gameSettings 
    });
  } catch (error) {
    console.error('Помилка оновлення налаштувань гри:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Запуск таймера шкідників
 */
export const startPestTimer = async (req: Request, res: Response) => {
  try {
    // Спочатку оновлюємо статус в GameSettings
    const gameSettings = await GameSettings.findOne();
    if (!gameSettings) {
      return res.status(404).json({ message: 'Налаштування гри не знайдено' });
    }
    
    gameSettings.pestTimerEnabled = true;
    await gameSettings.save();
    
    // Тепер запускаємо таймер
    const result = await pestController.startPestTimer();
    
    res.json({ 
      message: result.message
    });
  } catch (error) {
    console.error('Помилка запуску таймера шкідників:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Зупинка таймера шкідників
 */
export const stopPestTimer = async (req: Request, res: Response) => {
  try {
    // Використовуємо існуючий контролер шкідників
    const result = pestController.stopPestTimer();
    
    // Оновлюємо статус в GameSettings
    const gameSettings = await GameSettings.findOne();
    if (gameSettings) {
      gameSettings.pestTimerEnabled = false;
      await gameSettings.save();
    }
    
    res.json({ 
      message: result.message
    });
  } catch (error) {
    console.error('Помилка зупинки таймера шкідників:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Оновлення інтервалу таймера шкідників
 */
export const updatePestTimerInterval = async (req: Request, res: Response) => {
  try {
    const { intervalSeconds } = req.body;
    
    if (!intervalSeconds || intervalSeconds < 1) {
      return res.status(400).json({ 
        message: 'Інтервал має бути більше 0 секунд' 
      });
    }
    
    // Оновлюємо інтервал в GameSettings
    const gameSettings = await GameSettings.findOne();
    if (!gameSettings) {
      return res.status(404).json({ message: 'Налаштування гри не знайдено' });
    }
    
    gameSettings.pestTimerSeconds = intervalSeconds;
    await gameSettings.save();
    
    // Перезапускаємо таймер з новим інтервалом якщо він активний
    if (gameSettings.pestTimerEnabled) {
      await pestController.startPestTimer();
    }
    
    res.json({ 
      message: 'Інтервал таймера шкідників оновлено',
      intervalSeconds
    });
  } catch (error) {
    console.error('Помилка оновлення інтервалу таймера шкідників:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Отримання статусу таймера шкідників
 */
export const getPestTimerStatus = async (req: Request, res: Response) => {
  try {
    const gameSettings = await GameSettings.findOne();
    
    if (!gameSettings) {
      return res.status(404).json({ message: 'Налаштування гри не знайдено' });
    }
    
    res.json({
      intervalSeconds: gameSettings.pestTimerSeconds,
      isActive: gameSettings.pestTimerEnabled
    });
  } catch (error) {
    console.error('Помилка отримання статусу таймера шкідників:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Оновлення часу росту рослин
 */
export const updateGrowthTime = async (req: Request, res: Response) => {
  try {
    const { growthTimeSeconds } = req.body;
    
    if (!growthTimeSeconds || growthTimeSeconds < 1) {
      return res.status(400).json({ 
        message: 'Час росту має бути більше 0 секунд' 
      });
    }
    
    // Конвертуємо секунди в хвилини для збереження в GameSettings
    const growthTimeMinutes = Math.round(growthTimeSeconds / 60 * 100) / 100;
    
    const gameSettings = await GameSettings.findOne();
    if (!gameSettings) {
      return res.status(404).json({ message: 'Налаштування гри не знайдено' });
    }
    
    gameSettings.baseGrowthTimeMinutes = growthTimeMinutes;
    await gameSettings.save();
    
    res.json({ 
      message: 'Час росту рослин оновлено успішно',
      growthTimeMinutes,
      growthTimeSeconds
    });
  } catch (error) {
    console.error('Помилка оновлення часу росту:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Отримання часу росту рослин
 */
export const getGrowthTime = async (req: Request, res: Response) => {
  try {
    const gameSettings = await GameSettings.findOne();
    if (!gameSettings) {
      return res.status(404).json({ message: 'Налаштування гри не знайдено' });
    }
    
    const growthTimeMinutes = gameSettings.baseGrowthTimeMinutes;
    const growthTimeSeconds = Math.round(growthTimeMinutes * 60);
    
    res.json({
      growthTimeMinutes,
      growthTimeSeconds
    });
  } catch (error) {
    console.error('Помилка отримання часу росту:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Оновлення цін на ринку
 */
export const updateMarketPrices = async (req: Request, res: Response) => {
  try {
    const { prices } = req.body; // очікуємо об'єкт з цінами для всіх товарів
    
    const itemTypes = ['cucumber', 'tomato', 'carrot', 'corn', 'water', 'fertilizer', 'pesticide', 'seeds'];
    
    for (const itemType of itemTypes) {
      if (prices[itemType] !== undefined) {
        const price = parseFloat(prices[itemType]);
        if (price < 0) {
          return res.status(400).json({ 
            message: `Ціна для ${itemType} не може бути негативною` 
          });
        }
        
        // Отримуємо товар для перевірки меж
        const marketItem = await Market.findOne({ itemId: itemType });
        if (marketItem) {
          // Перевіряємо чи ціна в межах допустимих значень
          if (price < marketItem.minPrice || price > marketItem.maxPrice) {
            return res.status(400).json({ 
              message: `Ціна для ${itemType} має бути в межах ${marketItem.minPrice}-${marketItem.maxPrice}` 
            });
          }
          
          // Оновлюємо ціну з округленням
          marketItem.currentPrice = Math.round(price * 100) / 100;
          
          // Додаємо запис до історії цін
          marketItem.priceHistory.push({
            value: marketItem.currentPrice,
            timestamp: new Date()
          });
          
          // Обмежуємо історію до останніх 100 записів
          if (marketItem.priceHistory.length > 100) {
            marketItem.priceHistory = marketItem.priceHistory.slice(-100);
          }
          
          await marketItem.save();
        } else {
          // Створюємо новий товар якщо не існує (з базовими межами)
          await Market.create({
            itemId: itemType,
            currentPrice: Math.round(price * 100) / 100,
            minPrice: Math.max(1, price * 0.1), // 10% від встановленої ціни як мінімум
            maxPrice: price * 10, // 10x від встановленої ціни як максимум
          });
        }
      }
    }
    
    res.json({ message: 'Ціни на ринку оновлено успішно' });
  } catch (error) {
    console.error('Помилка оновлення цін на ринку:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Отримання цін ринку
 */
export const getMarketPrices = async (req: Request, res: Response) => {
  try {
    const items = await Market.find({});
    const prices: { [key: string]: number } = {};
    
    items.forEach(item => {
      prices[item.itemId] = item.currentPrice;
    });
    
    res.json({ prices });
  } catch (error) {
    console.error('Помилка отримання цін ринку:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Створення новини
 */
export const createNews = async (req: Request, res: Response) => {
  try {
    const { content, priceChange, affectedVegetables } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Текст новини не може бути порожнім' });
    }
    
    if (priceChange === undefined || priceChange < -100 || priceChange > 100) {
      return res.status(400).json({ message: 'Відсоток зміни ціни має бути від -100 до 100' });
    }
    
    if (!affectedVegetables || affectedVegetables.length === 0) {
      return res.status(400).json({ message: 'Необхідно вибрати принаймні один овоч' });
    }
    
    const news = new News({
      title: content.substring(0, 50) + '...', // перші 50 символів як заголовок
      content,
      priceChange,
      affectedItems: affectedVegetables
    });
    
    await news.save();
    
    res.json({ 
      message: 'Новину збережено в базі даних',
      newsId: news._id
    });
  } catch (error) {
    console.error('Помилка створення новини:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Застосування новини негайно
 */
export const applyNewsImmediately = async (req: Request, res: Response) => {
  try {
    const { content, priceChange, affectedVegetables } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Текст новини не може бути порожнім' });
    }
    
    if (priceChange === undefined || priceChange < -100 || priceChange > 100) {
      return res.status(400).json({ message: 'Відсоток зміни ціни має бути від -100 до 100' });
    }
    
    if (!affectedVegetables || affectedVegetables.length === 0) {
      return res.status(400).json({ message: 'Необхідно вибрати принаймні один овоч' });
    }
    
    // Створюємо новину
    const news = new News({
      title: content.substring(0, 50) + '...',
      content,
      priceChange,
      affectedItems: affectedVegetables,
      isApplied: true,
      appliedAt: new Date(),
      isPublished: true,
      publishedAt: new Date()
    });
    
    await news.save();
    
    // Застосовуємо зміни цін
    for (const vegetable of affectedVegetables) {
      const marketItem = await Market.findOne({ itemId: vegetable });
      if (marketItem) {
        // Перевіряємо поточну ціну відносно меж
        const isAtMaxPrice = marketItem.currentPrice >= marketItem.maxPrice;
        const isAtMinPrice = marketItem.currentPrice <= marketItem.minPrice;
        
        // Якщо ціна вже максимальна і новина позитивна (підвищує ціну) - пропускаємо
        if (isAtMaxPrice && priceChange > 0) {
          console.log(`Ціна ${vegetable} вже максимальна (${marketItem.currentPrice} >= ${marketItem.maxPrice}). Пропускаємо позитивну новину.`);
          continue;
        }
        
        // Якщо ціна вже мінімальна і новина негативна (знижує ціну) - пропускаємо
        if (isAtMinPrice && priceChange < 0) {
          console.log(`Ціна ${vegetable} вже мінімальна (${marketItem.currentPrice} <= ${marketItem.minPrice}). Пропускаємо негативну новину.`);
          continue;
        }
        
        // Розраховуємо нову ціну
        const newPrice = marketItem.currentPrice * (1 + priceChange / 100);
        
        // Обмежуємо ціну мінімальним і максимальним значенням та округлюємо
        const boundedPrice = Math.max(marketItem.minPrice, Math.min(marketItem.maxPrice, newPrice));
        marketItem.currentPrice = Math.round(boundedPrice * 100) / 100;
        
        // Додаємо запис до історії цін
        marketItem.priceHistory.push({
          value: marketItem.currentPrice,
          timestamp: new Date()
        });
        
        // Обмежуємо історію до останніх 100 записів
        if (marketItem.priceHistory.length > 100) {
          marketItem.priceHistory = marketItem.priceHistory.slice(-100);
        }
        
        await marketItem.save();
        
        console.log(`Застосовано новину до ${vegetable}. Нова ціна: ${marketItem.currentPrice} (межі: ${marketItem.minPrice}-${marketItem.maxPrice})`);
      }
    }
    
    res.json({ 
      message: 'Новину застосовано негайно і ціни оновлено',
      newsId: news._id
    });
  } catch (error) {
    console.error('Помилка застосування новини:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Отримання новин
 */
export const getNews = async (req: Request, res: Response) => {
  try {
    const news = await News.find({}).sort({ createdAt: -1 }).limit(10);
    res.json({ news });
  } catch (error) {
    console.error('Помилка отримання новин:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Отримання всіх новин для адміна (без обмежень)
 */
export const getAllNews = async (req: Request, res: Response) => {
  try {
    const news = await News.find({}).sort({ createdAt: -1 });
    res.json({ news });
  } catch (error) {
    console.error('Помилка отримання всіх новин:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Видалення новини
 */
export const deleteNews = async (req: Request, res: Response) => {
  try {
    const { newsId } = req.params;
    
    if (!newsId) {
      return res.status(400).json({ message: 'ID новини не вказано' });
    }
    
    const deletedNews = await News.findByIdAndDelete(newsId);
    
    if (!deletedNews) {
      return res.status(404).json({ message: 'Новину не знайдено' });
    }
    
    res.json({ 
      message: 'Новину успішно видалено',
      deletedNews 
    });
  } catch (error) {
    console.error('Помилка видалення новини:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Запуск таймера рандомних новин
 */
export const startNewsTimer = async (req: Request, res: Response) => {
  try {
    // Спочатку оновлюємо статус в GameSettings
    const gameSettings = await GameSettings.findOne();
    if (!gameSettings) {
      return res.status(404).json({ message: 'Налаштування гри не знайдено' });
    }
    
    gameSettings.randomNewsTimerEnabled = true;
    await gameSettings.save();
    
    // Тепер запускаємо таймер
    const result = await newsController.startNewsTimer();
    
    res.json({ 
      message: result.message,
      success: result.success
    });
  } catch (error) {
    console.error('Помилка запуску таймера новин:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Зупинка таймера рандомних новин
 */
export const stopNewsTimer = async (req: Request, res: Response) => {
  try {
    // Спочатку оновлюємо статус в GameSettings
    const gameSettings = await GameSettings.findOne();
    if (!gameSettings) {
      return res.status(404).json({ message: 'Налаштування гри не знайдено' });
    }
    
    gameSettings.randomNewsTimerEnabled = false;
    await gameSettings.save();
    
    // Тепер зупиняємо таймер
    const result = newsController.stopNewsTimer();
    
    res.json({ 
      message: result.message,
      success: result.success
    });
  } catch (error) {
    console.error('Помилка зупинки таймера новин:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Оновлення інтервалу таймера новин
 */
export const updateNewsTimerInterval = async (req: Request, res: Response) => {
  try {
    const { intervalSeconds } = req.body;
    
    if (!intervalSeconds || intervalSeconds < 1) {
      return res.status(400).json({ 
        message: 'Інтервал має бути більше 0 секунд' 
      });
    }
    
    // Оновлюємо інтервал в GameSettings
    const gameSettings = await GameSettings.findOne();
    if (!gameSettings) {
      return res.status(404).json({ message: 'Налаштування гри не знайдено' });
    }
    
    gameSettings.randomNewsTimerSeconds = intervalSeconds;
    await gameSettings.save();
    
    // Перезапускаємо таймер з новим інтервалом якщо він активний
    if (gameSettings.randomNewsTimerEnabled) {
      await newsController.startNewsTimer();
    }
    
    res.json({ 
      message: 'Інтервал таймера новин оновлено',
      intervalSeconds
    });
  } catch (error) {
    console.error('Помилка оновлення інтервалу таймера новин:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Отримання статусу таймера новин
 */
export const getNewsTimerStatus = async (req: Request, res: Response) => {
  try {
    const gameSettings = await GameSettings.findOne();
    
    if (!gameSettings) {
      return res.status(404).json({ message: 'Налаштування гри не знайдено' });
    }
    
    res.json({
      intervalSeconds: gameSettings.randomNewsTimerSeconds,
      isActive: gameSettings.randomNewsTimerEnabled
    });
  } catch (error) {
    console.error('Помилка отримання статусу таймера новин:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Отримання статистики
 */
export const getStatistics = async (req: Request, res: Response) => {
  try {
    // Отримуємо всіх гравців з їх грядками
    const players = await Player.find({}, 'plots inventory');
    
    // Статистика посаджених рослин
    const plantedCropsMap: { [key: string]: number } = {};
    
    // Статистика овочів на складі
    const warehouseStats = {
      cucumber: 0,
      tomato: 0,
      carrot: 0,
      corn: 0
    };
    
    // Проходимо по всіх гравцях та їх грядках
    players.forEach(player => {
      // Рахуємо посаджені рослини
      if (player.plots && Array.isArray(player.plots)) {
        player.plots.forEach(plot => {
          if (plot.plantType && (plot.status === 'growing' || plot.status === 'ready')) {
            plantedCropsMap[plot.plantType] = (plantedCropsMap[plot.plantType] || 0) + 1;
          }
        });
      }
      
      // Рахуємо овочі на складі
      if (player.inventory) {
        warehouseStats.cucumber += player.inventory.cucumber || 0;
        warehouseStats.tomato += player.inventory.tomato || 0;
        warehouseStats.carrot += player.inventory.carrot || 0;
        warehouseStats.corn += player.inventory.corn || 0;
      }
    });
    
    // Конвертуємо Map в масив об'єктів для сумісності з фронтендом
    const plantedCrops = Object.entries(plantedCropsMap).map(([plantType, count]) => ({
      _id: plantType,
      count: count
    })).sort((a, b) => b.count - a.count);
    
    // Поточні ціни на ринку
    const marketItems = await Market.find({});
    const marketPrices: { [key: string]: number } = {};
    marketItems.forEach(item => {
      marketPrices[item.itemId] = item.currentPrice;
    });
    
    console.log('Статистика посаджених рослин:', plantedCrops);
    console.log('Статистика складів:', warehouseStats);
    console.log('Загальна кількість гравців:', players.length);
    
    res.json({
      plantedCrops,
      warehouseStats,
      marketPrices,
      totalPlayers: players.length
    });
  } catch (error) {
    console.error('Помилка отримання статистики:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}; 
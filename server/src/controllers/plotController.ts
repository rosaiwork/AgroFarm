import { Request, Response } from 'express';
import { Player, PlantType, GameSettings } from '../models';
import * as plantService from '../services/plantService';

/**
 * Отримати всі грядки гравця з актуальним станом
 */
export const getPlots = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string;
    
    console.log('GET /plots - Заголовки:', req.headers);
    console.log('GET /plots - User ID:', userId);
    
    if (!userId) {
      return res.status(401).json({ message: 'Потрібна авторизація' });
    }
    
    // Перевіряємо, чи існує гравець
    let player = await Player.findOne({ user_id: userId });
    
    // Якщо гравця не знайдено, створюємо нового
    if (!player) {
      console.log('Створення нового гравця з ID:', userId);
      player = await Player.create({ user_id: userId });
    }
    
    // Оновити і отримати грядки з актуальним станом
    const plots = await plantService.updatePlayerPlots(userId);
    
    console.log('Грядки гравця:', plots.length);
    
    // Проходимо по всіх грядках і оновлюємо їх стан з більш детальною інформацією
    const updatedPlots = await Promise.all(plots.map(async (plot) => {
      if (plot.status === 'growing') {
        const plantState = await plantService.calculatePlantState(plot);
        const plotObj = JSON.parse(JSON.stringify(plot));
        
        if (plantState.status === 'growing') {
          return {
            ...plotObj,
            stageIndex: plantState.stageIndex,
            progress: plantState.progress,
            needsWater: plantState.needsWater
          };
        }
      }
      return JSON.parse(JSON.stringify(plot));
    }));
    
    console.log('Відправляємо оновлені дані про грядки:', updatedPlots.length);
    res.json(updatedPlots);
  } catch (error) {
    console.error('Помилка отримання грядок:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Посадити насіння в грядку
 */
export const plantSeed = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string;
    const { plotIndex, plantType } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Потрібна авторизація' });
    }
    
    if (plotIndex === undefined || !plantType) {
      return res.status(400).json({ message: 'Необхідно вказати індекс грядки та тип рослини' });
    }
    
    // Пошук гравця
    const player = await Player.findOne({ user_id: userId });
    
    if (!player) {
      return res.status(404).json({ message: 'Гравця не знайдено' });
    }
    
    // Перевірка, що грядка порожня
    if (player.plots[plotIndex]?.status !== 'empty') {
      return res.status(400).json({ message: 'Грядка вже зайнята' });
    }
    
    // Перевірка наявності насіння
    if (player.inventory.seeds <= 0) {
      return res.status(400).json({ message: 'Недостатньо насіння' });
    }
    
    // Створення стадій росту для рослини
    const growthStages = await plantService.createGrowthStages(plantType);
    
    // Оновлення грядки у гравця
    const now = new Date();
    player.plots[plotIndex] = {
      index: plotIndex,
      plantType,
      plantedAt: now,
      status: 'growing',
      hasPests: false,
      growthStages
    };
    
    // Зменшення кількості насіння
    player.inventory.seeds -= 1;
    
    await player.save();
    
    res.json(player.plots[plotIndex]);
  } catch (error) {
    console.error('Помилка посадки рослини:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Полити грядку
 */
export const waterPlot = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string;
    const { plotIndex } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Потрібна авторизація' });
    }
    
    if (plotIndex === undefined) {
      return res.status(400).json({ message: 'Необхідно вказати індекс грядки' });
    }
    
    // Пошук гравця
    const player = await Player.findOne({ user_id: userId });
    
    if (!player) {
      return res.status(404).json({ message: 'Гравця не знайдено' });
    }
    
    // Перевірка наявності води
    if (player.inventory.water <= 0) {
      return res.status(400).json({ message: 'Недостатньо води' });
    }
    
    // Викликаємо сервісну функцію для поливу рослини
    try {
      // Поливаємо рослину через сервіс
      const updatedPlot = await plantService.waterPlant(userId, plotIndex);
      
      // Зменшення кількості води у гравця
      player.inventory.water -= 1;
      await player.save();
      
      console.log('Рослина успішно полита, оновлені дані:', updatedPlot);
      res.json(updatedPlot);
    } catch (error: any) {
      console.error('Помилка в процесі поливу:', error.message);
      return res.status(400).json({ message: error.message });
    }
  } catch (error) {
    console.error('Помилка поливу рослини:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Використати добриво
 */
export const fertilizePlot = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string;
    const { plotIndex } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Потрібна авторизація' });
    }
    
    // Пошук гравця
    const player = await Player.findOne({ user_id: userId });
    
    if (!player) {
      return res.status(404).json({ message: 'Гравця не знайдено' });
    }
    
    // Перевірка, що грядка існує і в ній росте рослина
    const plot = player.plots[plotIndex];
    
    if (!plot || plot.status !== 'growing') {
      return res.status(400).json({ message: 'Неможливо використати добриво для цієї грядки' });
    }
    
    // Перевірка наявності добрива
    if (player.inventory.fertilizer <= 0) {
      return res.status(400).json({ message: 'Недостатньо добрива' });
    }
    
    // Визначення поточної стадії росту
    const currentStageIndex = plantService.getCurrentStageIndex(plot);
    
    if (currentStageIndex === -1) {
      return res.status(400).json({ message: 'Неможливо використати добриво для цієї рослини' });
    }
    
    if (!plot.growthStages) {
      return res.status(400).json({ message: 'Помилка визначення стадій росту' });
    }
    
    // Застосування добрива
    try {
      plot.growthStages = plantService.applyFertilizer(plot.growthStages, currentStageIndex);
      
      // Зменшення кількості добрива
      player.inventory.fertilizer -= 1;
      
      await player.save();
      
      res.json(plot);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  } catch (error) {
    console.error('Помилка використання добрива:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Зібрати врожай
 */
export const harvestPlot = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string;
    const { plotIndex } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Потрібна авторизація' });
    }
    
    // Пошук гравця
    const player = await Player.findOne({ user_id: userId });
    
    if (!player) {
      return res.status(404).json({ message: 'Гравця не знайдено' });
    }
    
    // Перевірка, що грядка існує і рослина готова до збору
    const plot = player.plots[plotIndex];
    
    if (!plot) {
      return res.status(404).json({ message: 'Грядку не знайдено' });
    }
    
    // Оновлюємо стан грядки перед збором
    const plantState = await plantService.calculatePlantState(plot);
    
    if (plantState.status !== 'ready') {
      // Якщо статус не ready, повертаємо повідомлення про помилку
      let errorMessage = 'Рослина не готова до збору';
      
      // Перевіряємо чи є поле message в стані рослини
      if (plantState.status !== 'growing' && 'message' in plantState && plantState.message) {
        errorMessage = plantState.message;
      }
      
      return res.status(400).json({ message: errorMessage });
    }
    
    // Перевірка вільного місця на складі
    const currentInventoryCount = (player.inventory.seeds || 0) + 
                                  (player.inventory.water || 0) + 
                                  (player.inventory.fertilizer || 0) + 
                                  (player.inventory.pesticide || 0) + 
                                  (player.inventory.cucumber || 0) + 
                                  (player.inventory.tomato || 0) + 
                                  (player.inventory.carrot || 0) + 
                                  (player.inventory.corn || 0);

    // Використовуємо inventoryCapacity з гравця або за замовчуванням 20
    const inventoryCapacity = player.inventoryCapacity || 20;

    if (currentInventoryCount >= inventoryCapacity) {
      return res.status(400).json({ 
        message: `Недостатньо місця на складі. Поточне заповнення: ${currentInventoryCount}/${inventoryCapacity}. Розширте склад або продайте предмети.` 
      });
    }
    
    // Збір врожаю
    const plantType = plot.plantType as 'cucumber' | 'tomato' | 'carrot' | 'corn';
    
    // Додавання зібраного врожаю до інвентарю
    player.inventory[plantType] += 1;
    
    // Оновлення загальної кількості врожаю
    player.totalHarvest += 1;
    
    // Очищення грядки
    player.plots[plotIndex] = {
      index: plotIndex,
      status: 'empty',
      hasPests: false
    };
    
    await player.save();
    
    res.json({
      plot: player.plots[plotIndex],
      inventory: player.inventory,
      totalHarvest: player.totalHarvest,
      inventoryCount: currentInventoryCount + 1,
      inventoryCapacity
    });
  } catch (error) {
    console.error('Помилка збору врожаю:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Використати пестицид
 */
export const usePesticide = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string;
    const { plotIndex } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Потрібна авторизація' });
    }
    
    // Пошук гравця
    const player = await Player.findOne({ user_id: userId });
    
    if (!player) {
      return res.status(404).json({ message: 'Гравця не знайдено' });
    }
    
    // Перевірка наявності пестицидів
    if (player.inventory.pesticide <= 0) {
      return res.status(400).json({ message: 'Недостатньо пестицидів' });
    }
    
    try {
      // Використовуємо пестицид через сервіс
      const updatedPlot = await plantService.usePesticide(userId, plotIndex);
      
      // Зменшення кількості пестицидів
      player.inventory.pesticide -= 1;
      await player.save();
      
      console.log('Пестицид успішно застосовано, оновлені дані:', updatedPlot);
      res.json(updatedPlot);
    } catch (error: any) {
      console.error('Помилка в процесі використання пестициду:', error.message);
      return res.status(400).json({ message: error.message });
    }
  } catch (error) {
    console.error('Помилка використання пестициду:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Очистити грядку з мертвою рослиною
 */
export const clearDeadPlot = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string;
    const { plotIndex } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Потрібна авторизація' });
    }
    
    if (plotIndex === undefined) {
      return res.status(400).json({ message: 'Необхідно вказати індекс грядки' });
    }
    
    try {
      // Очищуємо грядку через сервіс
      const updatedPlot = await plantService.clearDeadPlant(userId, plotIndex);
      
      console.log('Мертва рослина успішно видалена, грядка очищена:', updatedPlot);
      res.json(updatedPlot);
    } catch (error: any) {
      console.error('Помилка в процесі очищення грядки:', error.message);
      return res.status(400).json({ message: error.message });
    }
  } catch (error) {
    console.error('Помилка очищення грядки:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Видалити рослину з грядки
 */
export const removePlant = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string;
    const { plotIndex } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Потрібна авторизація' });
    }
    
    if (plotIndex === undefined) {
      return res.status(400).json({ message: 'Необхідно вказати індекс грядки' });
    }
    
    // Викликаємо сервісну функцію для видалення рослини
    try {
      const updatedPlot = await plantService.removePlant(userId, plotIndex);
      
      console.log('Рослина успішно видалена з грядки:', updatedPlot);
      res.json(updatedPlot);
    } catch (error: any) {
      console.error('Помилка в процесі видалення рослини:', error.message);
      return res.status(400).json({ message: error.message });
    }
  } catch (error) {
    console.error('Помилка видалення рослини:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}; 
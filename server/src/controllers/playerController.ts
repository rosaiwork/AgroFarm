import { Request, Response } from 'express';
import { Player } from '../models';
import { IInventory } from '../models/Player';

/**
 * Отримання даних гравця
 */
export const getPlayerData = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ message: 'Потрібна авторизація' });
    }
    
    // Пошук гравця
    let player = await Player.findOne({ user_id: userId });
    
    if (!player) {
      // Створюємо нового гравця
      player = await Player.create({ 
        user_id: userId,
        coins: 500,
        plots: Array(9).fill(null).map((_, i) => ({ 
          index: i, 
          status: 'empty', 
          hasPests: false 
        }))
      });
    }
    
    // Підраховуємо кількість предметів на складі
    const inventoryCount = calculateInventoryCount(player.inventory);
    const inventoryCapacity = player.inventoryCapacity || 20; // За замовчуванням 20
    
    res.json({
      coins: player.coins,
      inventory: player.inventory,
      totalHarvest: player.totalHarvest,
      inventoryCount,
      inventoryCapacity
    });
  } catch (error) {
    console.error('Помилка отримання даних гравця:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Купівля предметів
 */
export const buyItem = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string;
    const { itemType, quantity = 1 } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Потрібна авторизація' });
    }
    
    if (!itemType || !['seeds', 'water', 'fertilizer', 'pesticide'].includes(itemType)) {
      return res.status(400).json({ message: 'Невірний тип предмету' });
    }
    
    // Перевірка, що кількість є додатнім цілим числом
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ message: 'Кількість повинна бути додатнім цілим числом' });
    }
    
    // Пошук гравця
    const player = await Player.findOne({ user_id: userId });
    
    if (!player) {
      return res.status(404).json({ message: 'Гравця не знайдено' });
    }
    
    // Фіксована ціна 10 монет за одиницю
    const pricePerUnit = 10;
    const totalPrice = pricePerUnit * quantity;
    
    // Перевірка наявності достатньої кількості монет
    if (player.coins < totalPrice) {
      return res.status(400).json({ message: 'Недостатньо монет' });
    }
    
    // Перевірка вільного місця на складі
    const currentInventoryCount = calculateInventoryCount(player.inventory);
    const inventoryCapacity = player.inventoryCapacity || 20;
    
    if (currentInventoryCount + quantity > inventoryCapacity) {
      return res.status(400).json({ 
        message: `Недостатньо місця на складі. Поточне заповнення: ${currentInventoryCount}/${inventoryCapacity}. Розширте склад або продайте предмети.` 
      });
    }
    
    // Оновлення монет та інвентарю (з округленням до цілих)
    player.coins = Math.round(player.coins - totalPrice);
    player.inventory[itemType as keyof typeof player.inventory] += quantity;
    
    await player.save();
    
    // Підраховуємо кількість предметів на складі
    const inventoryCount = calculateInventoryCount(player.inventory);
    
    res.json({
      coins: player.coins,
      inventory: player.inventory,
      message: `Успішно придбано ${quantity} ${getItemName(itemType)}`,
      inventoryCount,
      inventoryCapacity
    });
  } catch (error) {
    console.error('Помилка купівлі предмету:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Розширення складу
 */
export const expandInventory = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ message: 'Потрібна авторизація' });
    }
    
    // Пошук гравця
    const player = await Player.findOne({ user_id: userId });
    
    if (!player) {
      return res.status(404).json({ message: 'Гравця не знайдено' });
    }
    
    // Перевірка наявності поля inventoryCapacity, якщо немає - створюємо з значенням 20
    if (!player.inventoryCapacity) {
      player.inventoryCapacity = 20;
    }
    
    // Ціна розширення - 10 монет
    const expansionPrice = 10;
    
    // Перевірка наявності достатньої кількості монет
    if (player.coins < expansionPrice) {
      return res.status(400).json({ message: 'Недостатньо монет для розширення складу' });
    }
    
    // Розширення складу на 10 слотів (з округленням до цілих)
    player.coins = Math.round(player.coins - expansionPrice);
    player.inventoryCapacity += 10;
    
    await player.save();
    
    // Підраховуємо кількість предметів на складі
    const inventoryCount = calculateInventoryCount(player.inventory);
    
    res.json({
      coins: player.coins,
      inventoryCapacity: player.inventoryCapacity,
      inventoryCount,
      message: 'Склад успішно розширено на 10 слотів'
    });
  } catch (error) {
    console.error('Помилка розширення складу:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Продаж овочів
 */
export const sellVegetable = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string;
    const { vegetableType, quantity = 1 } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Потрібна авторизація' });
    }
    
    if (!vegetableType || !['cucumber', 'tomato', 'carrot', 'corn'].includes(vegetableType)) {
      return res.status(400).json({ message: 'Невірний тип овочу' });
    }
    
    // Перевірка, що кількість є додатнім цілим числом
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ message: 'Кількість повинна бути додатнім цілим числом' });
    }
    
    // Пошук гравця
    const player = await Player.findOne({ user_id: userId });
    
    if (!player) {
      return res.status(404).json({ message: 'Гравця не знайдено' });
    }
    
    // Перевірка наявності достатньої кількості овочів
    if (!player.inventory[vegetableType as keyof typeof player.inventory] || 
        player.inventory[vegetableType as keyof typeof player.inventory] < quantity) {
      return res.status(400).json({ message: `Недостатньо ${getVegetableName(vegetableType)} на складі` });
    }
    
    // Фіксована ціна 10 монет за овоч (в майбутньому буде динамічна)
    const pricePerVegetable = 10;
    const totalPrice = pricePerVegetable * quantity;
    
    // Оновлення монет та інвентарю
    player.coins += totalPrice;
    player.inventory[vegetableType as keyof typeof player.inventory] -= quantity;
    
    await player.save();
    
    // Підраховуємо кількість предметів на складі
    const inventoryCount = calculateInventoryCount(player.inventory);
    const inventoryCapacity = player.inventoryCapacity || 20;
    
    res.json({
      coins: player.coins,
      inventory: player.inventory,
      message: `Успішно продано ${quantity} ${getVegetableName(vegetableType)} за ${totalPrice} монет`,
      inventoryCount,
      inventoryCapacity
    });
  } catch (error) {
    console.error('Помилка продажу овочів:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

/**
 * Допоміжна функція для підрахунку кількості предметів на складі
 */
const calculateInventoryCount = (inventory: IInventory): number => {
  return (inventory.seeds || 0) + 
         (inventory.water || 0) + 
         (inventory.fertilizer || 0) + 
         (inventory.pesticide || 0) + 
         (inventory.cucumber || 0) + 
         (inventory.tomato || 0) + 
         (inventory.carrot || 0) + 
         (inventory.corn || 0);
};

/**
 * Допоміжна функція для отримання назви предмету
 */
const getItemName = (itemType: string): string => {
  const names: Record<string, string> = {
    seeds: 'насіння',
    water: 'води',
    fertilizer: 'добрива',
    pesticide: 'пестицидів'
  };
  return names[itemType] || itemType;
};

/**
 * Допоміжна функція для отримання назви овочу
 */
const getVegetableName = (vegetableType: string): string => {
  const names: Record<string, string> = {
    cucumber: 'огірків',
    tomato: 'помідорів',
    carrot: 'моркви',
    corn: 'кукурудзи'
  };
  return names[vegetableType] || vegetableType;
};

/**
 * Отримання лідерборду гравців
 */
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    // Отримуємо топ-5 гравців за загальним врожаєм
    const leaderboard = await Player.find({}, { user_id: 1, totalHarvest: 1, _id: 0 })
      .sort({ totalHarvest: -1 })
      .limit(5);
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Помилка отримання лідерборду:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}; 
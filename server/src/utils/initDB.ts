import { PlantType, GameSettings, MarketItem } from '../models';

export const initializePlantTypes = async (): Promise<void> => {
  // Перевіряємо, чи існують типи рослин у базі даних
  const count = await PlantType.countDocuments();
  
  if (count === 0) {
    console.log('Ініціалізація типів рослин...');
    
    // Створюємо базові типи рослин
    const plantTypes = [
      {
        _id: 'cucumber',
        displayName: 'Огірок',
        growthCoefficient: 1.0,
        wateringStages: [1, 2, 3, 4]
      },
      {
        _id: 'tomato',
        displayName: 'Помідор',
        growthCoefficient: 1.4,
        wateringStages: [1, 2]
      },
      {
        _id: 'carrot',
        displayName: 'Морква',
        growthCoefficient: 1.6,
        wateringStages: [1]
      },
      {
        _id: 'corn',
        displayName: 'Кукурудза',
        growthCoefficient: 1.2,
        wateringStages: [1, 2, 3]
      }
    ];
    
    try {
      await PlantType.insertMany(plantTypes);
      console.log('Типи рослин успішно ініціалізовано');
    } catch (error) {
      console.error('Помилка при ініціалізації типів рослин:', error);
    }
  }
};

export const initializeGameSettings = async (): Promise<void> => {
  // Перевіряємо, чи існують налаштування гри у базі даних
  const count = await GameSettings.countDocuments();
  
  if (count === 0) {
    console.log('Ініціалізація налаштувань гри...');
    
    // Створюємо базові налаштування гри
    const gameSettings = {
      baseGrowthTimeMinutes: 480, // 8 годин
      pestTimerSeconds: 3600, // 1 година (значення за замовчуванням з моделі)
      marketPrices: {
        cucumber: 50,
        tomato: 50,
        carrot: 50,
        corn: 50,
        water: 10,
        seeds: 20,
        fertilizer: 30,
        pesticide: 30
      },
      pestTimerEnabled: true,
      randomNewsTimerSeconds: 7200, // 2 години
      randomNewsTimerEnabled: true
    };
    
    try {
      await GameSettings.create(gameSettings);
      console.log('Налаштування гри успішно ініціалізовано');
    } catch (error) {
      console.error('Помилка при ініціалізації налаштувань гри:', error);
    }
  }
};

export const initializeMarket = async (): Promise<void> => {
  // Перевіряємо, чи існують ринкові елементи у базі даних
  const count = await MarketItem.countDocuments();
  
  if (count === 0) {
    console.log('Ініціалізація ринку...');
    
    // Створюємо базові ринкові елементи
    const marketItems = [
      {
        itemId: 'cucumber',
        currentPrice: 50,
        minPrice: 10,
        maxPrice: 100,
        priceHistory: [{ value: 50, timestamp: new Date() }]
      },
      {
        itemId: 'tomato',
        currentPrice: 50,
        minPrice: 10,
        maxPrice: 100,
        priceHistory: [{ value: 50, timestamp: new Date() }]
      },
      {
        itemId: 'carrot',
        currentPrice: 50,
        minPrice: 10,
        maxPrice: 100,
        priceHistory: [{ value: 50, timestamp: new Date() }]
      },
      {
        itemId: 'corn',
        currentPrice: 50,
        minPrice: 10,
        maxPrice: 100,
        priceHistory: [{ value: 50, timestamp: new Date() }]
      },
      {
        itemId: 'water',
        currentPrice: 10,
        minPrice: 5,
        maxPrice: 20,
        priceHistory: [{ value: 10, timestamp: new Date() }]
      },
      {
        itemId: 'seeds',
        currentPrice: 20,
        minPrice: 10,
        maxPrice: 40,
        priceHistory: [{ value: 20, timestamp: new Date() }]
      },
      {
        itemId: 'fertilizer',
        currentPrice: 30,
        minPrice: 15,
        maxPrice: 60,
        priceHistory: [{ value: 30, timestamp: new Date() }]
      },
      {
        itemId: 'pesticide',
        currentPrice: 30,
        minPrice: 15,
        maxPrice: 60,
        priceHistory: [{ value: 30, timestamp: new Date() }]
      }
    ];
    
    try {
      await MarketItem.insertMany(marketItems);
      console.log('Ринок успішно ініціалізовано');
    } catch (error) {
      console.error('Помилка при ініціалізації ринку:', error);
    }
  }
};

export const initializeDatabase = async (): Promise<void> => {
  await initializePlantTypes();
  await initializeGameSettings();
  await initializeMarket();
}; 
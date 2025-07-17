const AdminSettings = require('../models/AdminSettings');
const News = require('../models/News');
const MarketItem = require('../models/MarketItem');
const Player = require('../models/Player');
const Plot = require('../models/Plot');

// Глобальні змінні для таймерів
let pestTimer = null;
let newsTimer = null;

// === УПРАВЛІННЯ ЧАСОМ РОСТУ РОСЛИН ===
const updateGrowthTime = async (req, res) => {
  try {
    const { growthTimeSeconds } = req.body;
    
    if (!growthTimeSeconds || growthTimeSeconds < 1) {
      return res.status(400).json({ 
        message: 'Час росту має бути більше 0 секунд' 
      });
    }
    
    // Конвертуємо секунди в хвилини для збереження
    const growthTimeMinutes = Math.round(growthTimeSeconds / 60 * 100) / 100;
    
    await AdminSettings.findOneAndUpdate(
      { settingKey: 'baseGrowthTimeMinutes' },
      { 
        settingKey: 'baseGrowthTimeMinutes',
        settingValue: growthTimeMinutes,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    
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

const getGrowthTime = async (req, res) => {
  try {
    const setting = await AdminSettings.findOne({ settingKey: 'baseGrowthTimeMinutes' });
    const growthTimeMinutes = setting ? setting.settingValue : 120; // за замовчуванням 2 години
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

// === УПРАВЛІННЯ ТАЙМЕРОМ ШКІДНИКІВ ===
const startPestTimer = async (req, res) => {
  try {
    const setting = await AdminSettings.findOne({ settingKey: 'pestTimerSeconds' });
    const intervalSeconds = setting ? setting.settingValue : 600; // за замовчуванням 10 хвилин
    
    if (pestTimer) {
      clearInterval(pestTimer);
    }
    
    pestTimer = setInterval(async () => {
      try {
        // Логіка додавання шкідників до рослин
        console.log('Спрацював таймер шкідників');
        await addRandomPests();
      } catch (error) {
        console.error('Помилка в таймері шкідників:', error);
      }
    }, intervalSeconds * 1000);
    
    // Зберігаємо статус таймера
    await AdminSettings.findOneAndUpdate(
      { settingKey: 'pestTimerActive' },
      { 
        settingKey: 'pestTimerActive',
        settingValue: true,
        updatedAt: new Date()
      },
      { upsert: true }
    );
    
    res.json({ 
      message: 'Таймер шкідників запущено',
      intervalSeconds
    });
  } catch (error) {
    console.error('Помилка запуску таймера шкідників:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

const stopPestTimer = async (req, res) => {
  try {
    if (pestTimer) {
      clearInterval(pestTimer);
      pestTimer = null;
    }
    
    await AdminSettings.findOneAndUpdate(
      { settingKey: 'pestTimerActive' },
      { 
        settingKey: 'pestTimerActive',
        settingValue: false,
        updatedAt: new Date()
      },
      { upsert: true }
    );
    
    res.json({ message: 'Таймер шкідників зупинено' });
  } catch (error) {
    console.error('Помилка зупинки таймера шкідників:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

const updatePestTimerInterval = async (req, res) => {
  try {
    const { intervalSeconds } = req.body;
    
    if (!intervalSeconds || intervalSeconds < 1) {
      return res.status(400).json({ 
        message: 'Інтервал має бути більше 0 секунд' 
      });
    }
    
    await AdminSettings.findOneAndUpdate(
      { settingKey: 'pestTimerSeconds' },
      { 
        settingKey: 'pestTimerSeconds',
        settingValue: intervalSeconds,
        updatedAt: new Date()
      },
      { upsert: true }
    );
    
    // Якщо таймер активний, перезапускаємо його з новим інтервалом
    const activeStatus = await AdminSettings.findOne({ settingKey: 'pestTimerActive' });
    if (activeStatus && activeStatus.settingValue) {
      if (pestTimer) {
        clearInterval(pestTimer);
      }
      
      pestTimer = setInterval(async () => {
        try {
          await addRandomPests();
        } catch (error) {
          console.error('Помилка в таймері шкідників:', error);
        }
      }, intervalSeconds * 1000);
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

const getPestTimerStatus = async (req, res) => {
  try {
    const intervalSetting = await AdminSettings.findOne({ settingKey: 'pestTimerSeconds' });
    const activeSetting = await AdminSettings.findOne({ settingKey: 'pestTimerActive' });
    
    const intervalSeconds = intervalSetting ? intervalSetting.settingValue : 600;
    const isActive = activeSetting ? activeSetting.settingValue : false;
    
    res.json({
      intervalSeconds,
      isActive
    });
  } catch (error) {
    console.error('Помилка отримання статусу таймера шкідників:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

// === УПРАВЛІННЯ ЦІНАМИ НА РИНКУ ===
const updateMarketPrices = async (req, res) => {
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
        
        await MarketItem.findOneAndUpdate(
          { itemId: itemType },
          { 
            currentPrice: price,
            updatedAt: new Date()
          },
          { upsert: true }
        );
      }
    }
    
    res.json({ message: 'Ціни на ринку оновлено успішно' });
  } catch (error) {
    console.error('Помилка оновлення цін на ринку:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

const getMarketPrices = async (req, res) => {
  try {
    const items = await MarketItem.find({});
    const prices = {};
    
    items.forEach(item => {
      prices[item.itemId] = item.currentPrice;
    });
    
    res.json({ prices });
  } catch (error) {
    console.error('Помилка отримання цін ринку:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

// === УПРАВЛІННЯ НОВИНАМИ ===
const createNews = async (req, res) => {
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
      affectedVegetables
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

const applyNewsImmediately = async (req, res) => {
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
      affectedVegetables,
      isApplied: true,
      appliedAt: new Date()
    });
    
    await news.save();
    
    // Застосовуємо зміни цін
    for (const vegetable of affectedVegetables) {
      const marketItem = await MarketItem.findOne({ itemId: vegetable });
      if (marketItem) {
        const newPrice = marketItem.currentPrice * (1 + priceChange / 100);
        marketItem.currentPrice = Math.max(1, Math.round(newPrice)); // мінімальна ціна 1
        await marketItem.save();
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

const getNews = async (req, res) => {
  try {
    const news = await News.find({}).sort({ createdAt: -1 }).limit(10);
    res.json({ news });
  } catch (error) {
    console.error('Помилка отримання новин:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

// === ТАЙМЕР РАНДОМНИХ НОВИН ===
const startNewsTimer = async (req, res) => {
  try {
    const setting = await AdminSettings.findOne({ settingKey: 'newsTimerSeconds' });
    const intervalSeconds = setting ? setting.settingValue : 1800; // за замовчуванням 30 хвилин
    
    if (newsTimer) {
      clearInterval(newsTimer);
    }
    
    newsTimer = setInterval(async () => {
      try {
        console.log('Спрацював таймер рандомних новин');
        await generateRandomNews();
      } catch (error) {
        console.error('Помилка в таймері новин:', error);
      }
    }, intervalSeconds * 1000);
    
    await AdminSettings.findOneAndUpdate(
      { settingKey: 'newsTimerActive' },
      { 
        settingKey: 'newsTimerActive',
        settingValue: true,
        updatedAt: new Date()
      },
      { upsert: true }
    );
    
    res.json({ 
      message: 'Таймер рандомних новин запущено',
      intervalSeconds
    });
  } catch (error) {
    console.error('Помилка запуску таймера новин:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

const stopNewsTimer = async (req, res) => {
  try {
    if (newsTimer) {
      clearInterval(newsTimer);
      newsTimer = null;
    }
    
    await AdminSettings.findOneAndUpdate(
      { settingKey: 'newsTimerActive' },
      { 
        settingKey: 'newsTimerActive',
        settingValue: false,
        updatedAt: new Date()
      },
      { upsert: true }
    );
    
    res.json({ message: 'Таймер рандомних новин зупинено' });
  } catch (error) {
    console.error('Помилка зупинки таймера новин:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

const updateNewsTimerInterval = async (req, res) => {
  try {
    const { intervalSeconds } = req.body;
    
    if (!intervalSeconds || intervalSeconds < 1) {
      return res.status(400).json({ 
        message: 'Інтервал має бути більше 0 секунд' 
      });
    }
    
    await AdminSettings.findOneAndUpdate(
      { settingKey: 'newsTimerSeconds' },
      { 
        settingKey: 'newsTimerSeconds',
        settingValue: intervalSeconds,
        updatedAt: new Date()
      },
      { upsert: true }
    );
    
    // Якщо таймер активний, перезапускаємо його
    const activeStatus = await AdminSettings.findOne({ settingKey: 'newsTimerActive' });
    if (activeStatus && activeStatus.settingValue) {
      if (newsTimer) {
        clearInterval(newsTimer);
      }
      
      newsTimer = setInterval(async () => {
        try {
          await generateRandomNews();
        } catch (error) {
          console.error('Помилка в таймері новин:', error);
        }
      }, intervalSeconds * 1000);
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

const getNewsTimerStatus = async (req, res) => {
  try {
    const intervalSetting = await AdminSettings.findOne({ settingKey: 'newsTimerSeconds' });
    const activeSetting = await AdminSettings.findOne({ settingKey: 'newsTimerActive' });
    
    const intervalSeconds = intervalSetting ? intervalSetting.settingValue : 1800;
    const isActive = activeSetting ? activeSetting.settingValue : false;
    
    res.json({
      intervalSeconds,
      isActive
    });
  } catch (error) {
    console.error('Помилка отримання статусу таймера новин:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

// === СТАТИСТИКА ===
const getStatistics = async (req, res) => {
  try {
    // Статистика посаджених рослин
    const plantedCrops = await Plot.aggregate([
      { $match: { status: { $in: ['growing', 'ready'] }, plantType: { $exists: true } } },
      { $group: { _id: '$plantType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Статистика овочів на складі
    const players = await Player.find({}, 'inventory');
    const warehouseStats = {
      cucumber: 0,
      tomato: 0,
      carrot: 0,
      corn: 0
    };
    
    players.forEach(player => {
      warehouseStats.cucumber += player.inventory.cucumber || 0;
      warehouseStats.tomato += player.inventory.tomato || 0;
      warehouseStats.carrot += player.inventory.carrot || 0;
      warehouseStats.corn += player.inventory.corn || 0;
    });
    
    // Поточні ціни на ринку
    const marketItems = await MarketItem.find({});
    const marketPrices = {};
    marketItems.forEach(item => {
      marketPrices[item.itemId] = item.currentPrice;
    });
    
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

// === ДОПОМІЖНІ ФУНКЦІЇ ===
const addRandomPests = async () => {
  try {
    // Знаходимо всі активні грядки без шкідників
    const plots = await Plot.find({ 
      status: 'growing', 
      hasPests: false 
    });
    
    // Додаємо шкідників до 5% грядок (як в оригінальній логіці)
    const pestsCount = Math.max(1, Math.floor(plots.length * 0.05));
    
    for (let i = 0; i < pestsCount && i < plots.length; i++) {
      const randomIndex = Math.floor(Math.random() * plots.length);
      const plot = plots[randomIndex];
      
      plot.hasPests = true;
      plot.pestAppearedAt = new Date();
      await plot.save();
      
      console.log(`Додано шкідників до грядки ${plot.index}`);
    }
  } catch (error) {
    console.error('Помилка додавання рандомних шкідників:', error);
  }
};

const generateRandomNews = async () => {
  try {
    const vegetables = ['cucumber', 'tomato', 'carrot', 'corn'];
    const newsTemplates = [
      'Несподівана погода вплинула на урожай',
      'Нові агротехнології змінюють ринок',
      'Експорт овочів досягнув рекордних показників',
      'Дослідження показують зміни в споживанні',
      'Сезонні коливання впливають на ціни'
    ];
    
    const randomVegetable = vegetables[Math.floor(Math.random() * vegetables.length)];
    const randomTemplate = newsTemplates[Math.floor(Math.random() * newsTemplates.length)];
    const randomPriceChange = Math.floor(Math.random() * 21) - 10; // від -10% до +10%
    
    const news = new News({
      title: randomTemplate,
      content: `${randomTemplate}. Це призвело до змін на ринку овочів.`,
      priceChange: randomPriceChange,
      affectedVegetables: [randomVegetable],
      isApplied: true,
      appliedAt: new Date()
    });
    
    await news.save();
    
    // Застосовуємо зміну ціни
    const marketItem = await MarketItem.findOne({ itemId: randomVegetable });
    if (marketItem) {
      const newPrice = marketItem.currentPrice * (1 + randomPriceChange / 100);
      marketItem.currentPrice = Math.max(1, Math.round(newPrice));
      await marketItem.save();
    }
    
    console.log(`Згенеровано рандомну новину: ${randomTemplate} (${randomVegetable}: ${randomPriceChange}%)`);
  } catch (error) {
    console.error('Помилка генерації рандомної новини:', error);
  }
};

module.exports = {
  updateGrowthTime,
  getGrowthTime,
  startPestTimer,
  stopPestTimer,
  updatePestTimerInterval,
  getPestTimerStatus,
  updateMarketPrices,
  getMarketPrices,
  createNews,
  applyNewsImmediately,
  getNews,
  startNewsTimer,
  stopNewsTimer,
  updateNewsTimerInterval,
  getNewsTimerStatus,
  getStatistics
}; 
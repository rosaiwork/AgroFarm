import { GameSettings } from '../models';
import Market from '../models/Market';
import News from '../models/News';

// Таймер для випадкових новин
let newsTimer: NodeJS.Timeout | null = null;

/**
 * Запуск таймера новин
 */
export const startNewsTimer = async () => {
  try {
    // Отримати налаштування з бази даних
    const gameSettings = await GameSettings.findOne();
    
    if (!gameSettings) {
      throw new Error('Не знайдено налаштування гри в базі даних');
    }
    
    const seconds = gameSettings.randomNewsTimerSeconds;
    const interval = seconds * 1000; // конвертуємо секунди у мілісекунди
    
    // Зупиняємо попередній таймер, якщо він запущений
    if (newsTimer) {
      clearInterval(newsTimer);
    }
    
    // Запускаємо новий таймер
    newsTimer = setInterval(async () => {
      try {
        console.log('Спрацював таймер рандомних новин - генеруємо новину...');
        await generateRandomNews();
      } catch (error) {
        console.error('Помилка публікації випадкової новини:', error);
      }
    }, interval);
    
    console.log(`Таймер новин запущено з інтервалом ${seconds} секунд`);
    
    return { success: true, message: `Таймер новин запущено з інтервалом ${seconds} секунд` };
  } catch (error) {
    console.error('Помилка запуску таймера новин:', error);
    return { success: false, message: 'Помилка запуску таймера новин' };
  }
};

/**
 * Зупинка таймера новин
 */
export const stopNewsTimer = () => {
  if (newsTimer) {
    clearInterval(newsTimer);
    newsTimer = null;
    console.log('Таймер новин зупинено');
    return { success: true, message: 'Таймер новин зупинено' };
  }
  return { success: false, message: 'Таймер новин не був запущений' };
};

/**
 * Генерація рандомної новини
 */
const generateRandomNews = async () => {
  try {
    // Отримати кількість всіх новин в базі даних
    const count = await News.countDocuments();
    
    if (count === 0) {
      console.log('Немає новин в базі даних для публікації');
      return;
    }
    
    // Отримати випадкову новину з бази (будь-яку)
    const random = Math.floor(Math.random() * count);
    const news = await News.findOne().skip(random);
    
    if (!news) {
      console.log('Не знайдено новину для публікації');
      return;
    }
    
    // Встановлюємо статус "опубліковано" та час публікації (перепублікуємо)
    news.isPublished = true;
    news.publishedAt = new Date();
    await news.save();
    
    console.log(`Опубліковано новину: "${news.title}"`);
    
    // Оновлюємо ціни на товари, які вказані в новині
    for (const itemId of news.affectedItems) {
      const marketItem = await Market.findOne({ itemId });
      
      if (marketItem) {
        // Перевіряємо поточну ціну відносно меж
        const isAtMaxPrice = marketItem.currentPrice >= marketItem.maxPrice;
        const isAtMinPrice = marketItem.currentPrice <= marketItem.minPrice;
        
        // Якщо ціна вже максимальна і новина позитивна (підвищує ціну) - пропускаємо
        if (isAtMaxPrice && news.priceChange > 0) {
          console.log(`Ціна ${itemId} вже максимальна (${marketItem.currentPrice} >= ${marketItem.maxPrice}). Пропускаємо позитивну новину.`);
          continue;
        }
        
        // Якщо ціна вже мінімальна і новина негативна (знижує ціну) - пропускаємо
        if (isAtMinPrice && news.priceChange < 0) {
          console.log(`Ціна ${itemId} вже мінімальна (${marketItem.currentPrice} <= ${marketItem.minPrice}). Пропускаємо негативну новину.`);
          continue;
        }
        
        // Розраховуємо нову ціну на основі коефіцієнту зміни в новині
        const priceChangeAmount = (marketItem.currentPrice * Math.abs(news.priceChange) / 100);
        let newPrice = news.priceChange > 0 
          ? marketItem.currentPrice + priceChangeAmount
          : marketItem.currentPrice - priceChangeAmount;
        
        // Обмежуємо ціну мінімальним і максимальним значенням та округлюємо
        newPrice = Math.max(marketItem.minPrice, Math.min(marketItem.maxPrice, newPrice));
        newPrice = Math.round(newPrice * 100) / 100;
        
        // Додаємо запис до історії цін
        marketItem.priceHistory.push({
          value: newPrice,
          timestamp: new Date()
        });
        
        // Обмежуємо історію до останніх 100 записів
        if (marketItem.priceHistory.length > 100) {
          marketItem.priceHistory = marketItem.priceHistory.slice(-100);
        }
        
        marketItem.currentPrice = newPrice;
        await marketItem.save();
        
        console.log(`Застосовано ${news.priceChange > 0 ? 'позитивну' : 'негативну'} новину до ${itemId}. Нова ціна: ${newPrice} (межі: ${marketItem.minPrice}-${marketItem.maxPrice})`);
      } else {
        console.error(`Не знайдено товар ${itemId} в MarketItem`);
      }
    }
    
    console.log(`Новину "${news.title}" опубліковано з впливом ${news.priceChange}% на товари: ${news.affectedItems.join(', ')}`);
  } catch (error) {
    console.error('Помилка публікації випадкової новини:', error);
  }
}; 
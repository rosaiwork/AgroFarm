import Market, { IMarketItem, IMarketPrice } from '../models/Market';
import Player, { IPlayer } from '../models/Player';
import News from '../models/News';

// Оновлення ціни після транзакції
export const updateMarketPrice = async (
  itemId: string,
  isBuying: boolean,
  quantity: number = 1
) => {
  try {
    // Отримуємо поточну ціну
    const marketItem = await Market.findOne({ itemId });
    
    if (!marketItem) {
      throw new Error(`Товар з ID ${itemId} не знайдено на ринку`);
    }
    
    // Розраховуємо зміну ціни
    // Купівля збільшує ціну, продаж зменшує
    const priceChangePercent = isBuying ? 1 : -1;
    const priceChange = (marketItem.currentPrice * Math.abs(priceChangePercent) / 100) * quantity;
    
    // Нова ціна
    let newPrice = isBuying 
      ? marketItem.currentPrice + priceChange
      : marketItem.currentPrice - priceChange;
    
    // Обмежуємо ціну мінімальним і максимальним значенням та округлюємо до 2 знаків після коми
    newPrice = Math.round((Math.max(marketItem.minPrice, Math.min(marketItem.maxPrice, newPrice))) * 100) / 100;
    
    // Зберігаємо нову ціну і додаємо запис до історії (також з 2 знаками після коми)
    marketItem.priceHistory.push({
      value: Math.round(newPrice * 100) / 100,
      timestamp: new Date()
    });
    
    // Максимальна кількість записів в історії - 100
    if (marketItem.priceHistory.length > 100) {
      marketItem.priceHistory = marketItem.priceHistory.slice(-100);
    }
    
    marketItem.currentPrice = newPrice;
    await marketItem.save();
    
    return marketItem;
  } catch (error) {
    console.error('Помилка оновлення ціни на ринку:', error);
    throw error;
  }
};

// Отримати всі товари на ринку
export const getMarketItems = async () => {
  try {
    return await Market.find();
  } catch (error) {
    console.error('Помилка отримання товарів з ринку:', error);
    throw error;
  }
};

// Купити товар на ринку
export const buyItem = async (userId: string, itemId: string, quantity: number = 1) => {
  try {
    const marketItem = await Market.findOne({ itemId });
    if (!marketItem) {
      throw new Error(`Товар з ID ${itemId} не знайдено на ринку`);
    }
    
    const player = await Player.findOne({ user_id: userId });
    if (!player) {
      throw new Error('Гравця не знайдено');
    }
    
    // Перевіряємо чи вистачає монет
    const totalCost = marketItem.currentPrice * quantity;
    if (player.coins < totalCost) {
      throw new Error('Недостатньо монет');
    }
    
    // Підраховуємо поточну кількість предметів на складі
    const currentInventoryCount = (player.inventory.seeds || 0) + 
                                  (player.inventory.water || 0) + 
                                  (player.inventory.fertilizer || 0) + 
                                  (player.inventory.pesticide || 0) + 
                                  (player.inventory.cucumber || 0) + 
                                  (player.inventory.tomato || 0) + 
                                  (player.inventory.carrot || 0) + 
                                  (player.inventory.corn || 0);
    
    const inventoryCapacity = player.inventoryCapacity || 20;
    
    // Перевіряємо чи є вільне місце на складі
    if (currentInventoryCount + quantity > inventoryCapacity) {
      throw new Error(`Недостатньо місця на складі. Поточне заповнення: ${currentInventoryCount}/${inventoryCapacity}. Розширте склад або продайте предмети.`);
    }
    
    // Оновлюємо дані гравця і округлюємо баланс до цілого числа
    player.coins = Math.round(player.coins - totalCost);
    player.inventory[itemId] = (player.inventory[itemId] || 0) + quantity;
    
    await player.save();
    
    // Оновлюємо ціну на ринку
    const updatedMarketItem = await updateMarketPrice(itemId, true, quantity);
    
    return {
      player: {
        ...player.toObject(),
        inventoryCount: currentInventoryCount + quantity,
        inventoryCapacity
      },
      marketItem: updatedMarketItem
    };
  } catch (error) {
    console.error('Помилка купівлі товару:', error);
    throw error;
  }
};

// Продати товар на ринку
export const sellItem = async (userId: string, itemId: string, quantity: number = 1) => {
  try {
    const marketItem = await Market.findOne({ itemId });
    if (!marketItem) {
      throw new Error(`Товар з ID ${itemId} не знайдено на ринку`);
    }
    
    const player = await Player.findOne({ user_id: userId });
    if (!player) {
      throw new Error('Гравця не знайдено');
    }
    
    // Перевіряємо чи є товар в інвентарі
    if (!player.inventory[itemId] || player.inventory[itemId] < quantity) {
      throw new Error(`Недостатньо ${itemId} в інвентарі`);
    }
    
    // Оновлюємо дані гравця і округлюємо баланс до цілого числа
    const totalEarnings = marketItem.currentPrice * quantity;
    player.coins = Math.round(player.coins + totalEarnings);
    player.inventory[itemId] -= quantity;
    
    // Видаляємо нульові значення з інвентарю
    if (player.inventory[itemId] <= 0) {
      delete player.inventory[itemId];
    }
    
    await player.save();
    
    // Підраховуємо поточну кількість предметів на складі після продажу
    const currentInventoryCount = (player.inventory.seeds || 0) + 
                                  (player.inventory.water || 0) + 
                                  (player.inventory.fertilizer || 0) + 
                                  (player.inventory.pesticide || 0) + 
                                  (player.inventory.cucumber || 0) + 
                                  (player.inventory.tomato || 0) + 
                                  (player.inventory.carrot || 0) + 
                                  (player.inventory.corn || 0);
    
    const inventoryCapacity = player.inventoryCapacity || 20;
    
    // Оновлюємо ціну на ринку
    const updatedMarketItem = await updateMarketPrice(itemId, false, quantity);
    
    return {
      player: {
        ...player.toObject(),
        inventoryCount: currentInventoryCount,
        inventoryCapacity
      },
      marketItem: updatedMarketItem
    };
  } catch (error) {
    console.error('Помилка продажу товару:', error);
    throw error;
  }
};

// Опублікувати випадкову новину і оновити ціни
export const publishRandomNews = async () => {
  try {
    // Отримати випадкову новину
    const count = await News.countDocuments();
    if (count === 0) return null;
    
    const random = Math.floor(Math.random() * count);
    const news = await News.findOne().skip(random);
    
    if (!news) return null;
    
    // Встановлюємо статус "опубліковано" та час публікації
    news.isPublished = true;
    news.publishedAt = new Date();
    await news.save();
    
    // Оновлюємо ціни на товари, які вказані в новині
    for (const itemId of news.affectedItems) {
      const marketItem = await Market.findOne({ itemId });
      
      if (marketItem) {
        // Перевіряємо поточну ціну відносно меж
        const isAtMaxPrice = marketItem.currentPrice >= marketItem.maxPrice;
        const isAtMinPrice = marketItem.currentPrice <= marketItem.minPrice;
        
        // Якщо ціна вже максимальна і новина позитивна (підвищує ціну) - пропускаємо
        if (isAtMaxPrice && news.priceChange > 0) {
          console.log(`Ціна ${itemId} вже максимальна (${marketItem.currentPrice}). Пропускаємо позитивну новину.`);
          continue;
        }
        
        // Якщо ціна вже мінімальна і новина негативна (знижує ціну) - пропускаємо
        if (isAtMinPrice && news.priceChange < 0) {
          console.log(`Ціна ${itemId} вже мінімальна (${marketItem.currentPrice}). Пропускаємо негативну новину.`);
          continue;
        }
        
        // Розраховуємо нову ціну на основі коефіцієнту зміни в новині
        const priceChange = (marketItem.currentPrice * Math.abs(news.priceChange) / 100);
        let newPrice = news.priceChange > 0 
          ? marketItem.currentPrice + priceChange
          : marketItem.currentPrice - priceChange;
        
        // Обмежуємо ціну мінімальним і максимальним значенням та округлюємо до 2 знаків після коми
        newPrice = Math.round((Math.max(marketItem.minPrice, Math.min(marketItem.maxPrice, newPrice))) * 100) / 100;
        
        // Зберігаємо нову ціну і додаємо запис до історії (також з 2 знаками після коми)
        marketItem.priceHistory.push({
          value: Math.round(newPrice * 100) / 100,
          timestamp: new Date()
        });
        
        // Максимальна кількість записів в історії - 100
        if (marketItem.priceHistory.length > 100) {
          marketItem.priceHistory = marketItem.priceHistory.slice(-100);
        }
        
        marketItem.currentPrice = newPrice;
        await marketItem.save();
        
        console.log(`Застосовано ${news.priceChange > 0 ? 'позитивну' : 'негативну'} новину до ${itemId}. Нова ціна: ${newPrice}`);
      }
    }
    
    return news;
  } catch (error) {
    console.error('Помилка публікації випадкової новини:', error);
    throw error;
  }
};

// Отримати історію цін для конкретного товару
export const getItemPriceHistory = async (itemId: string) => {
  try {
    const marketItem = await Market.findOne({ itemId });
    
    if (!marketItem) {
      throw new Error(`Товар з ID ${itemId} не знайдено на ринку`);
    }
    
    // Розраховуємо статистику
    const prices = marketItem.priceHistory.map((entry: IMarketPrice) => entry.value);
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : marketItem.currentPrice;
    const highestPrice = prices.length > 0 ? Math.max(...prices) : marketItem.currentPrice;
    
    return {
      itemId,
      currentPrice: marketItem.currentPrice,
      minPrice: marketItem.minPrice,
      maxPrice: marketItem.maxPrice,
      priceHistory: marketItem.priceHistory,
      statistics: {
        lowestPrice,
        highestPrice,
        totalEntries: marketItem.priceHistory.length
      }
    };
  } catch (error) {
    console.error('Помилка отримання історії цін:', error);
    throw error;
  }
};

// Отримати історію цін для всіх товарів
export const getAllPriceHistory = async () => {
  try {
    const marketItems = await Market.find({});
    const result: any = {};
    
    for (const item of marketItems) {
      const prices = item.priceHistory.map((entry: IMarketPrice) => entry.value);
      const lowestPrice = prices.length > 0 ? Math.min(...prices) : item.currentPrice;
      const highestPrice = prices.length > 0 ? Math.max(...prices) : item.currentPrice;
      
      result[item.itemId] = {
        itemId: item.itemId,
        currentPrice: item.currentPrice,
        minPrice: item.minPrice,
        maxPrice: item.maxPrice,
        priceHistory: item.priceHistory,
        statistics: {
          lowestPrice,
          highestPrice,
          totalEntries: item.priceHistory.length
        }
      };
    }
    
    return result;
  } catch (error) {
    console.error('Помилка отримання історії цін усіх товарів:', error);
    throw error;
  }
}; 
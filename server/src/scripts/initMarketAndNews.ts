import mongoose from 'mongoose';
import Market from '../models/Market';
import News from '../models/News';
import dotenv from 'dotenv';

// Завантаження змінних середовища
dotenv.config();

// Тестові дані ринку
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
    itemId: 'seeds',
    currentPrice: 10,
    minPrice: 5,
    maxPrice: 20,
    priceHistory: [{ value: 10, timestamp: new Date() }]
  },
  {
    itemId: 'water',
    currentPrice: 5,
    minPrice: 2,
    maxPrice: 10,
    priceHistory: [{ value: 5, timestamp: new Date() }]
  },
  {
    itemId: 'fertilizer',
    currentPrice: 20,
    minPrice: 10,
    maxPrice: 40,
    priceHistory: [{ value: 20, timestamp: new Date() }]
  },
  {
    itemId: 'pesticide',
    currentPrice: 25,
    minPrice: 15,
    maxPrice: 50,
    priceHistory: [{ value: 25, timestamp: new Date() }]
  }
];

// Тестові новини
const newsItems = [
  {
    title: 'Відкриття заводу по виробництву томатних соків',
    content: 'У нашому регіоні відкрився новий завод з виробництва томатних соків, що збільшило попит на помідори.',
    priceChange: 30, // +30%
    affectedItems: ['tomato'],
    isPublished: false
  },
  {
    title: 'Відкриття заводу по виробництву морквяних соків',
    content: 'У сусідньому регіоні відкрився завод з виробництва морквяних соків, що підвищило ціни на моркву.',
    priceChange: 40, // +40%
    affectedItems: ['carrot'],
    isPublished: false
  },
  {
    title: 'Підписана угода про експорт огірків',
    content: 'Підписано міжнародну угоду про експорт огірків, що значно підвищило їхню вартість на ринку.',
    priceChange: 50, // +50%
    affectedItems: ['cucumber'],
    isPublished: false
  },
  {
    title: 'Закриття заводу по виробництву томатних соків',
    content: 'Через технічні проблеми закрився завод з виробництва томатних соків, ціни на помідори впали.',
    priceChange: -30, // -30%
    affectedItems: ['tomato'],
    isPublished: false
  },
  {
    title: 'Закриття заводу по виробництву морквяних соків',
    content: 'Через економічні труднощі закрився завод з виробництва морквяних соків, що знизило попит на моркву.',
    priceChange: -40, // -40%
    affectedItems: ['carrot'],
    isPublished: false
  },
  {
    title: 'Підписана угода про імпорт огірків',
    content: 'Підписано міжнародну угоду про масовий імпорт огірків, що знизило їхню вартість на внутрішньому ринку.',
    priceChange: -50, // -50%
    affectedItems: ['cucumber'],
    isPublished: false
  }
];

// Функція ініціалізації
const initMarketAndNews = async () => {
  try {
    // Підключення до бази даних
    const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farm';
    
    await mongoose.connect(dbURI);
    console.log('Підключено до MongoDB');
    
    // Перевірка та створення товарів на ринку
    for (const item of marketItems) {
      const existingItem = await Market.findOne({ itemId: item.itemId });
      
      if (!existingItem) {
        await Market.create(item);
        console.log(`Створено товар на ринку: ${item.itemId}`);
      } else {
        console.log(`Товар ${item.itemId} вже існує на ринку`);
      }
    }
    
    // Перевірка та створення новин
    for (const news of newsItems) {
      const existingNews = await News.findOne({ 
        title: news.title,
        priceChange: news.priceChange
      });
      
      if (!existingNews) {
        await News.create(news);
        console.log(`Створено новину: ${news.title}`);
      } else {
        console.log(`Новина "${news.title}" вже існує`);
      }
    }
    
    console.log('Ініціалізація даних завершена успішно');
    process.exit(0);
  } catch (error) {
    console.error('Помилка ініціалізації даних:', error);
    process.exit(1);
  }
};

// Запуск ініціалізації
initMarketAndNews(); 
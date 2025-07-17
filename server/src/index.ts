import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import routes from './routes';
import { initializeDatabase } from './utils/initDB';
import * as pestController from './controllers/pestController';
import * as newsController from './controllers/newsController';

// Підключення змінних середовища
dotenv.config();

// Налаштування Express
const app: Express = express();
const port = process.env.PORT || 3001;

// Налаштування CORS для Cloudflare Tunnel та локальної розробки
const corsOptions = {
  origin: function (origin: any, callback: any) {
    // Дозволяємо запити без origin (наприклад, мобільні додатки, Telegram WebApp)
    if (!origin) return callback(null, true);
    
    // Логіруємо origin для дебагу
    console.log('CORS запит з origin:', origin);
    
    // Локальна розробка
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      console.log('Дозволено localhost:', origin);
      return callback(null, true);
    }
    
    // Cloudflare Tunnel домени
    if (origin.includes('.trycloudflare.com')) {
      console.log('Дозволено Cloudflare Tunnel:', origin);
      return callback(null, true);
    }
    
    // Telegram WebApp домени
    if (origin.includes('web.telegram.org') || origin.includes('.telegram.org')) {
      console.log('Дозволено Telegram WebApp:', origin);
      return callback(null, true);
    }
    
    // GitHub Pages та інші статичні хостинги
    if (origin.includes('github.io') || origin.includes('netlify.app') || origin.includes('vercel.app')) {
      console.log('Дозволено статичний хостинг:', origin);
      return callback(null, true);
    }
    
    console.log('CORS заблокував домен:', origin);
    callback(new Error('Не дозволено CORS політикою'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  // Додаткові заголовки для мобільної сумісності
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'user-id',
    'Cache-Control',
    'Pragma'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
};

app.use(cors(corsOptions));

// Додаткові заголовки для безпеки та мобільної сумісності
app.use((req: Request, res: Response, next: any) => {
  // Заголовки безпеки
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  
  // Заголовки для кешування
  if (req.method === 'GET' && req.url.includes('/api/')) {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
  }
  
  // Логування запитів для дебагу
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - User-ID: ${req.headers['user-id']} - Origin: ${req.headers.origin}`);
  
  next();
});

app.use(express.json({ limit: '10mb' })); // Збільшуємо ліміт для JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Додаємо підтримку URL-encoded

// Підключення до бази даних
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farm')
  .then(async () => {
    console.log('MongoDB підключено успішно');
    
    // Ініціалізація бази даних
    await initializeDatabase();
    
    // Запуск таймера шкідників
    await pestController.startPestTimer();
    console.log('Таймер шкідників запущено');
    
    // Запуск таймера новин
    await newsController.startNewsTimer();
    
    // Тестовий маршрут
    app.get('/', (req: Request, res: Response) => {
      res.json({ 
        message: 'API фермерської гри працює!',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
    });
    
    // Підключення маршрутів
    app.use('/api', routes);
    
    // Запуск сервера
    app.listen(port, () => {
      console.log(`Сервер запущено на порту ${port}`);
      console.log(`Локальний адрес: http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Помилка підключення до MongoDB:', error);
  }); 
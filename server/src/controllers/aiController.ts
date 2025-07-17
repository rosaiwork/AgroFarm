import { Request, Response } from 'express';
import OpenAI from 'openai';
import AdminSettings from '../models/AdminSettings';
import MarketPrices from '../models/MarketPrices';
import News from '../models/News';
import Player from '../models/Player';
import Plot from '../models/Plot';

// Типи для АІ відповідей
interface AIScenarioResponse {
  success: boolean;
  scenario?: {
    title: string;
    description: string;
    duration: number;
    events: Array<{
      day: number;
      news: string;
      priceChanges: Record<string, number>;
      affectedItems: string[];
    }>;
  };
  error?: string;
}

interface AINewsResponse {
  success: boolean;
  news?: {
    title: string;
    content: string;
    priceChange: number;
    affectedItems: string[];
  };
  error?: string;
}

class AIController {
  private openai: OpenAI | null = null;

  constructor() {
    this.initializeOpenAI();
  }

  private async initializeOpenAI() {
    try {
      // Отримуємо API ключ з бази даних
      const adminSettings = await AdminSettings.findOne();
      if (adminSettings?.openaiApiKey) {
        this.openai = new OpenAI({
          apiKey: adminSettings.openaiApiKey
        });
      }
    } catch (error) {
      console.error('Помилка ініціалізації OpenAI:', error);
    }
  }

  // Встановлення API ключа
  public setApiKey = async (req: Request, res: Response) => {
    try {
      const { apiKey } = req.body;

      if (!apiKey || !apiKey.startsWith('sk-')) {
        return res.status(400).json({
          success: false,
          message: 'Невірний формат API ключа'
        });
      }

      // Тестуємо ключ
      const testOpenAI = new OpenAI({ apiKey });
      
      try {
        await testOpenAI.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
          max_tokens: 5
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Невірний API ключ або проблема з OpenAI'
        });
      }

      // Зберігаємо ключ в базі даних
      await AdminSettings.findOneAndUpdate(
        {},
        { openaiApiKey: apiKey },
        { upsert: true }
      );

      // Ініціалізуємо OpenAI з новим ключем
      this.openai = testOpenAI;

      res.json({
        success: true,
        message: 'API ключ збережено та перевірено'
      });
    } catch (error: any) {
      console.error('Помилка встановлення API ключа:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Помилка встановлення API ключа'
      });
    }
  };

  // Перевірка налаштування API
  public checkApiStatus = async (req: Request, res: Response) => {
    try {
      const adminSettings = await AdminSettings.findOne();
      const isConfigured = !!(adminSettings?.openaiApiKey && this.openai);

      res.json({
        success: true,
        isConfigured,
        message: isConfigured ? 'API налаштовано' : 'API не налаштовано'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  // Генерація сценарію
  public generateScenario = async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;

      if (!this.openai) {
        return res.status(400).json({
          success: false,
          message: 'OpenAI API не налаштовано'
        });
      }

      if (!prompt?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Промт не може бути порожнім'
        });
      }

      const systemPrompt = `Ти - експерт з розробки ігрових сценаріїв для фермерської гри. 
      Створи детальний сценарій на основі користувацького запиту.
      
      Доступні товари в грі: cucumber (огірок), tomato (помідор), carrot (морква), corn (кукурудза), water (вода), fertilizer (добрива), pesticide (пестициди), seeds (насіння).
      
      Відповідь ОБОВ'ЯЗКОВО має бути у форматі JSON:
      {
        "title": "Назва сценарію",
        "description": "Опис сценарію",
        "duration": число_днів,
        "events": [
          {
            "day": номер_дня,
            "news": "Текст новини для гравців",
            "priceChanges": {"товар": відсоток_зміни},
            "affectedItems": ["список", "товарів"]
          }
        ]
      }
      
      Зміни цін вказуй у відсотках (-50 до +100). Негативні значення - зниження, позитивні - зростання.
      Створи реалістичний сценарій з 3-7 днями та логічною послідовністю подій.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1500
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('Порожня відповідь від OpenAI');
      }

      // Парсимо JSON відповідь
      const scenario = JSON.parse(responseText);

      res.json({
        success: true,
        scenario
      });
    } catch (error: any) {
      console.error('Помилка генерації сценарію:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Помилка генерації сценарію'
      });
    }
  };

  // Генерація новини
  public generateNews = async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;

      if (!this.openai) {
        return res.status(400).json({
          success: false,
          message: 'OpenAI API не налаштовано'
        });
      }

      if (!prompt?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Промт не може бути порожнім'
        });
      }

      const systemPrompt = `Ти - журналіст, який пише новини для фермерської гри.
      Створи цікаву новину на основі користувацького запиту.
      
      Доступні товари: cucumber (огірок), tomato (помідор), carrot (морква), corn (кукурудза), water (вода), fertilizer (добрива), pesticide (пестициди), seeds (насіння).
      
      Відповідь ОБОВ'ЯЗКОВО у форматі JSON:
      {
        "title": "Заголовок новини",
        "content": "Повний текст новини (2-3 речення)",
        "priceChange": відсоток_зміни_ціни,
        "affectedItems": ["список", "товарів", "на", "які", "впливає"]
      }
      
      Зміна ціни від -50 до +50 відсотків. Створи реалістичну новину з логічним впливом на ціни.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('Порожня відповідь від OpenAI');
      }

      const news = JSON.parse(responseText);

      res.json({
        success: true,
        news
      });
    } catch (error: any) {
      console.error('Помилка генерації новини:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Помилка генерації новини'
      });
    }
  };

  // Аналіз стану гри
  public analyzeGameState = async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;

      if (!this.openai) {
        return res.status(400).json({
          success: false,
          message: 'OpenAI API не налаштовано'
        });
      }

      // Збираємо статистику гри
      const [players, plots, market, news] = await Promise.all([
        Player.countDocuments(),
        Plot.aggregate([
          { $match: { plantType: { $ne: null } } },
          { $group: { _id: '$plantType', count: { $sum: 1 } } }
        ]),
        MarketPrices.findOne(),
        News.countDocuments()
      ]);

      const gameData = {
        totalPlayers: players,
        plantedCrops: plots,
        marketPrices: market?.prices || {},
        totalNews: news,
        timestamp: new Date()
      };

      const systemPrompt = `Ти - аналітик ігрової економіки фермерської гри. 
      Проаналізуй поточний стан гри та дай рекомендації на основі даних та користувацького запиту.
      
      Дані гри: ${JSON.stringify(gameData)}
      
      Дай відповідь у форматі JSON:
      {
        "analysis": "Детальний аналіз поточного стану",
        "recommendations": [
          "Рекомендація 1",
          "Рекомендація 2"
        ],
        "suggestedActions": [
          {
            "action": "Тип дії",
            "description": "Опис дії",
            "priority": "high/medium/low"
          }
        ]
      }`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt || 'Проаналізуй поточний стан гри та дай рекомендації' }
        ],
        temperature: 0.6,
        max_tokens: 800
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('Порожня відповідь від OpenAI');
      }

      const analysis = JSON.parse(responseText);

      res.json({
        success: true,
        gameData,
        analysis
      });
    } catch (error: any) {
      console.error('Помилка аналізу стану гри:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Помилка аналізу стану гри'
      });
    }
  };
}

export const aiController = new AIController(); 
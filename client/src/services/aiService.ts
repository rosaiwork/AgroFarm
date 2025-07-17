import { apiClient } from '../api/apiClient';

// Типи для АІ відповідей
export interface AIScenarioResponse {
  success: boolean;
  scenario?: {
    title: string;
    description: string;
    duration: number; // в днях
    events: Array<{
      day: number;
      news: string;
      priceChanges: Record<string, number>; // товар -> відсоток зміни
      affectedItems: string[];
    }>;
  };
  error?: string;
}

export interface AINewsResponse {
  success: boolean;
  news?: {
    title: string;
    content: string;
    priceChange: number;
    affectedItems: string[];
  };
  error?: string;
}

class AIService {
  private configured: boolean = false;

  constructor() {
    this.checkConfiguration();
  }

  private async checkConfiguration() {
    try {
      const response = await apiClient.checkAIApiStatus();
      this.configured = response.data?.isConfigured || false;
    } catch (error) {
      console.error('Помилка перевірки конфігурації AI:', error);
      this.configured = false;
    }
  }

  public async setApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await apiClient.setAIApiKey(apiKey);
      if (response.data?.success) {
        this.configured = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Помилка встановлення API ключа:', error);
      return false;
    }
  }

  public isConfigured(): boolean {
    return this.configured;
  }

  // Генерація ігрового сценарію
  public async generateScenario(prompt: string): Promise<AIScenarioResponse> {
    if (!this.configured) {
      return {
        success: false,
        error: 'OpenAI API не налаштовано. Встановіть API ключ.'
      };
    }

    try {
      const response = await apiClient.generateAIScenario(prompt);
      
      if (response.data?.success) {
        return {
          success: true,
          scenario: response.data.scenario
        };
      } else {
        return {
          success: false,
          error: response.data?.message || 'Помилка генерації сценарію'
        };
      }
    } catch (error: any) {
      console.error('Помилка генерації сценарію:', error);
      return {
        success: false,
        error: error.message || 'Помилка генерації сценарію'
      };
    }
  }

  // Генерація окремої новини
  public async generateNews(prompt: string): Promise<AINewsResponse> {
    if (!this.configured) {
      return {
        success: false,
        error: 'OpenAI API не налаштовано. Встановіть API ключ.'
      };
    }

    try {
      const response = await apiClient.generateAINews(prompt);
      
      if (response.data?.success) {
        return {
          success: true,
          news: response.data.news
        };
      } else {
        return {
          success: false,
          error: response.data?.message || 'Помилка генерації новини'
        };
      }
    } catch (error: any) {
      console.error('Помилка генерації новини:', error);
      return {
        success: false,
        error: error.message || 'Помилка генерації новини'
      };
    }
  }

  // Аналіз поточного стану гри та генерація рекомендацій
  public async analyzeGameState(prompt?: string): Promise<any> {
    if (!this.configured) {
      return {
        success: false,
        error: 'OpenAI API не налаштовано'
      };
    }

    try {
      const response = await apiClient.analyzeGameState(prompt);
      
      if (response.data?.success) {
        return {
          success: true,
          gameData: response.data.gameData,
          analysis: response.data.analysis
        };
      } else {
        return {
          success: false,
          error: response.data?.message || 'Помилка аналізу стану гри'
        };
      }
    } catch (error: any) {
      console.error('Помилка аналізу:', error);
      return {
        success: false,
        error: error.message || 'Помилка аналізу стану гри'
      };
    }
  }
}

// Експортуємо єдиний екземпляр сервісу
export const aiService = new AIService(); 
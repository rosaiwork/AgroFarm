import axios from 'axios';

// Базова URL для API запитів
// ТИМЧАСОВЕ РІШЕННЯ - хардкод для тестування
const API_URL = 'https://template-record-bbs-hans.trycloudflare.com/api';

console.log('Використовується API URL:', API_URL);

// Функція для встановлення заголовків авторизації
const getHeaders = () => {
  try {
    // В режимі розробки використовуємо тестовий ID користувача
    // В реальному додатку буде використовуватись ID з Telegram
    const userId = localStorage.getItem('userId') || '12345'; // Тестовий ID
    console.log('Використовується user-id:', userId);
    return {
      'Content-Type': 'application/json',
      'user-id': userId,
    };
  } catch (error) {
    console.error('Помилка отримання заголовків:', error);
    return {
      'Content-Type': 'application/json',
      'user-id': '12345', // Fallback ID
    };
  }
};

// Створення інстансу axios з базовою URL і заголовками
const apiInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 секунд таймаут
  headers: getHeaders(),
});

// Додаємо інтерсептор для запитів
apiInstance.interceptors.request.use(
  (config) => {
    // Оновлюємо заголовки перед кожним запитом
    const headers = getHeaders();
    Object.keys(headers).forEach(key => {
      config.headers[key as keyof typeof headers] = headers[key as keyof typeof headers];
    });
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Додаємо інтерсептор для відповідей
apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response interceptor error:', error);
    
    // Створюємо більш інформативні повідомлення про помилки
    if (error.code === 'ECONNABORTED') {
      error.userMessage = 'Тайм-аут запиту. Перевірте з\'єднання з інтернетом.';
    } else if (error.response?.status === 0 || !error.response) {
      error.userMessage = 'Немає з\'єднання з сервером. Перевірте інтернет.';
    } else if (error.response?.status >= 500) {
      error.userMessage = 'Помилка сервера. Спробуйте пізніше.';
    } else if (error.response?.status === 404) {
      error.userMessage = 'Ресурс не знайдено.';
    } else {
      error.userMessage = error.response?.data?.message || 'Виникла помилка';
    }
    
    return Promise.reject(error);
  }
);

// Запит до API з покращеною обробкою помилок
const apiCall = async (method: string, url: string, data?: any) => {
  try {
    const response = await apiInstance({
      method,
      url,
      data,
    });
    return response;
  } catch (error: any) {
    console.error(`API Error (${method} ${url}):`, error);
    
    // Логіруємо більше деталей для дебагу
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request made but no response:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    throw error;
  }
};

// Функція для безпечного виклику API з retry логікою
const safeApiCall = async (
  method: string, 
  url: string, 
  data?: any, 
  retries: number = 2
): Promise<any> => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await apiCall(method, url, data);
    } catch (error: any) {
      console.warn(`API call attempt ${i + 1} failed:`, error.userMessage || error.message);
      
      // Якщо це остання спроба або помилка не пов'язана з мережею
      if (i === retries || (error.response && error.response.status !== 0)) {
        throw error;
      }
      
      // Чекаємо перед повторною спробою
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

// API клієнт з методами для взаємодії з бекендом
export const apiClient = {
  // Аутентифікація
  authPlayer: (userId: string) => 
    safeApiCall('post', '/player/auth', { userId }),
    
  // Гравець
  getPlayerData: () => safeApiCall('get', '/player'),
  updatePlayerSettings: (settings: any) => safeApiCall('put', '/player/settings', settings),
  buyInventoryItem: (itemType: string, quantity: number = 1) => 
    safeApiCall('post', '/player/buy', { itemType, quantity }),
  sellVegetable: (vegetableType: string, quantity: number = 1) => 
    safeApiCall('post', '/player/sell', { vegetableType, quantity }),
  expandInventory: () => 
    safeApiCall('post', '/player/expand-inventory'),
  getLeaderboard: () => safeApiCall('get', '/player/leaderboard'),
  
  // Грядки
  getPlots: () => safeApiCall('get', '/plots'),
  plantSeed: (plotIndex: number, plantType: string) => 
    safeApiCall('post', '/plots/plant', { plotIndex, plantType }),
  waterPlot: (plotIndex: number) => 
    safeApiCall('post', '/plots/water', { plotIndex }),
  useFertilizer: (plotIndex: number) => 
    safeApiCall('post', '/plots/fertilize', { plotIndex }),
  usePesticide: (plotIndex: number) => 
    safeApiCall('post', '/plots/pesticide', { plotIndex }),
  harvestPlot: (plotIndex: number) => 
    safeApiCall('post', '/plots/harvest', { plotIndex }),
  clearDeadPlot: (plotIndex: number) => 
    safeApiCall('post', '/plots/clear-dead', { plotIndex }),
  removePlant: (plotIndex: number) => 
    safeApiCall('post', '/plots/remove-plant', { plotIndex }),
    
  // Ринок
  getMarketData: () => safeApiCall('get', '/market'),
  buyMarketItem: (itemType: string, quantity: number) => 
    safeApiCall('post', '/market/buy', { itemId: itemType, quantity }),
  sellMarketItem: (itemType: string, quantity: number) => 
    safeApiCall('post', '/market/sell', { itemId: itemType, quantity }),
  
  // Історія цін ринку
  getItemPriceHistory: (itemId: string) => 
    safeApiCall('get', `/market/price-history/${itemId}`),
  getAllPriceHistory: () => 
    safeApiCall('get', '/market/price-history'),
  
  // Новини
  getNews: () => safeApiCall('get', '/news'),
  
  // Адміністрування
  // Час росту рослин
  getGrowthTime: () => safeApiCall('get', '/admin/growth-time'),
  updateGrowthTime: (growthTimeSeconds: number) => 
    safeApiCall('put', '/admin/growth-time', { growthTimeSeconds }),
  
  // Таймер шкідників
  startPestTimer: () => safeApiCall('post', '/admin/pest-timer/start'),
  stopPestTimer: () => safeApiCall('post', '/admin/pest-timer/stop'),
  updatePestTimerInterval: (intervalSeconds: number) => 
    safeApiCall('put', '/admin/pest-timer/interval', { intervalSeconds }),
  getPestTimerStatus: () => safeApiCall('get', '/admin/pest-timer/status'),
  
  // Ціни ринку
  getMarketPrices: () => safeApiCall('get', '/admin/market-prices'),
  updateMarketPrices: (prices: Record<string, number>) => 
    safeApiCall('put', '/admin/market-prices', { prices }),
  
  // Новини адміна
  createNews: (content: string, priceChange: number, affectedVegetables: string[]) => 
    safeApiCall('post', '/admin/news', { content, priceChange, affectedVegetables }),
  applyNewsImmediately: (content: string, priceChange: number, affectedVegetables: string[]) => 
    safeApiCall('post', '/admin/news/apply', { content, priceChange, affectedVegetables }),
  getAdminNews: () => safeApiCall('get', '/admin/news'),
  getAllAdminNews: () => safeApiCall('get', '/admin/news/all'),
  deleteNews: (newsId: string) => safeApiCall('delete', `/admin/news/${newsId}`),
  
  // Таймер рандомних новин
  startNewsTimer: () => safeApiCall('post', '/admin/news-timer/start'),
  stopNewsTimer: () => safeApiCall('post', '/admin/news-timer/stop'),
  updateNewsTimerInterval: (intervalSeconds: number) => 
    safeApiCall('put', '/admin/news-timer/interval', { intervalSeconds }),
  getNewsTimerStatus: () => safeApiCall('get', '/admin/news-timer/status'),
  
  // Статистика
  getStatistics: () => safeApiCall('get', '/admin/statistics'),
  
  // Тестування шкідників
  generatePestsManually: () => safeApiCall('post', '/admin/pests/generate'),

  // AI методи
  setAIApiKey: (apiKey: string) => safeApiCall('post', '/ai/api-key', { apiKey }),
  checkAIApiStatus: () => safeApiCall('get', '/ai/api-status'),
  generateAIScenario: (prompt: string) => safeApiCall('post', '/ai/generate-scenario', { prompt }),
  generateAINews: (prompt: string) => safeApiCall('post', '/ai/generate-news', { prompt }),
  analyzeGameState: (prompt?: string) => safeApiCall('post', '/ai/analyze-game', { prompt }),
};

// Встановлення користувача
export const setCurrentUser = (userId: string) => {
  try {
    localStorage.setItem('userId', userId);
  } catch (error) {
    console.error('Помилка збереження userId в localStorage:', error);
  }
};

// Отримання поточного користувача
export const getCurrentUser = () => {
  try {
    return localStorage.getItem('userId');
  } catch (error) {
    console.error('Помилка читання userId з localStorage:', error);
    return null;
  }
}; 
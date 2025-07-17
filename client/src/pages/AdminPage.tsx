import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { apiClient } from '../api/apiClient';
import { t } from '../utils/localization';
import NewsManager from '../components/NewsManager';
import { aiService, AIScenarioResponse, AINewsResponse } from '../services/aiService';

// Типи для статистики
interface Statistics {
  plantedCrops: { _id: string; count: number }[];
  warehouseStats: { cucumber: number; tomato: number; carrot: number; corn: number };
  marketPrices: Record<string, number>;
  totalPlayers: number;
}

// Стилізовані компоненти
const Container = styled.div`
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(to bottom, #4CAF50, #2E7D32);
`;

const Header = styled.h1`
  color: white;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
`;

const TopButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
`;

const TopButton = styled.button`
  background: white;
  color: #2E7D32;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
  
  &:hover {
    background: #f5f5f5;
    transform: translateY(-2px);
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 6px 12px rgba(0,0,0,0.15);
  border: 2px solid #4CAF50;
`;

const CardTitle = styled.h3`
  color: #2E7D32;
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 0.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #4CAF50;
  }
`;

const TextArea = styled.textarea<{ rows?: number }>`
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  resize: vertical;
  min-height: ${props => props.rows ? `${props.rows * 1.5}rem` : '100px'};
  
  &:focus {
    outline: none;
    border-color: #4CAF50;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #4CAF50;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' | 'success' }>`
  background: ${props => {
    switch (props.variant) {
      case 'danger': return '#f44336';
      case 'success': return '#4CAF50';
      case 'secondary': return '#757575';
      default: return '#2196F3';
    }
  }};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.8rem 1.5rem;
  margin: 0.25rem;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const PriceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin: 1rem 0;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #ddd;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f5f5f5;
  }
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #4CAF50;
    cursor: pointer;
  }
  
  span {
    font-size: 1rem;
    color: #333;
    font-weight: 500;
  }
`;

const Message = styled.div<{ type: 'success' | 'error' | 'info' }>`
  padding: 1rem;
  border-radius: 6px;
  margin: 1rem 0;
  font-weight: bold;
  
  background: ${props => {
    switch (props.type) {
      case 'success': return '#e8f5e9';
      case 'error': return '#ffebee';
      default: return '#e3f2fd';
    }
  }};
  
  color: ${props => {
    switch (props.type) {
      case 'success': return '#2e7d32';
      case 'error': return '#c62828';
      default: return '#1565c0';
    }
  }};
  
  border-left: 4px solid ${props => {
    switch (props.type) {
      case 'success': return '#4caf50';
      case 'error': return '#f44336';
      default: return '#2196f3';
    }
  }};
`;

const StatisticsModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const StatSection = styled.div`
  margin-bottom: 1.5rem;
`;

const StatusIndicator = styled.span<{ $active: boolean }>`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.$active ? '#4CAF50' : '#f44336'};
  margin-left: 0.5rem;
`;

const AdminPage: React.FC = () => {
  // Стани для різних блоків
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Час росту рослин
  const [growthTimeSeconds, setGrowthTimeSeconds] = useState(0);
  
  // Таймер шкідників
  const [pestTimerSeconds, setPestTimerSeconds] = useState(0);
  const [pestTimerActive, setPestTimerActive] = useState(false);
  
  // Ціни ринку
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});
  
  // Новини
  const [newsContent, setNewsContent] = useState('');
  const [newsPriceChange, setNewsPriceChange] = useState(0);
  const [selectedVegetables, setSelectedVegetables] = useState<string[]>([]);
  
  // Таймер новин
  const [newsTimerSeconds, setNewsTimerSeconds] = useState(0);
  const [newsTimerActive, setNewsTimerActive] = useState(false);
  
  // Статистика
  const [showStatistics, setShowStatistics] = useState(false);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  
  // Управління новинами
  const [showNewsManager, setShowNewsManager] = useState(false);
  
  // АІ-агент стани
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiRunning, setAiRunning] = useState(false);
  const [aiApiKey, setAiApiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [currentScenario, setCurrentScenario] = useState<AIScenarioResponse['scenario'] | null>(null);
  const [scenarioProgress, setScenarioProgress] = useState<{
    currentDay: number;
    isActive: boolean;
    intervalId?: NodeJS.Timeout;
  }>({ currentDay: 0, isActive: false });
  
  const vegetables = ['cucumber', 'tomato', 'carrot', 'corn'];
  const itemTypes = ['cucumber', 'tomato', 'carrot', 'corn', 'water', 'fertilizer', 'pesticide', 'seeds'];
  
  // Завантаження даних при ініціалізації
  useEffect(() => {
    loadAdminData();
  }, []);

  // Очищення інтервалів при розмонтуванні компонента
  useEffect(() => {
    return () => {
      if (scenarioProgress.intervalId) {
        clearInterval(scenarioProgress.intervalId);
      }
    };
  }, [scenarioProgress.intervalId]);
  
  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Завантажуємо час росту
      const growthTimeResponse = await apiClient.getGrowthTime();
      if (growthTimeResponse.data) {
        setGrowthTimeSeconds(growthTimeResponse.data.growthTimeSeconds);
      }
      
      // Завантажуємо статус таймера шкідників
      const pestStatusResponse = await apiClient.getPestTimerStatus();
      if (pestStatusResponse.data) {
        setPestTimerSeconds(pestStatusResponse.data.intervalSeconds);
        setPestTimerActive(pestStatusResponse.data.isActive);
      }
      
      // Завантажуємо ціни ринку
      const pricesResponse = await apiClient.getMarketPrices();
      if (pricesResponse.data) {
        setMarketPrices(pricesResponse.data.prices);
      }
      
      // Завантажуємо статус таймера новин
      const newsStatusResponse = await apiClient.getNewsTimerStatus();
      if (newsStatusResponse.data) {
        setNewsTimerSeconds(newsStatusResponse.data.intervalSeconds);
        setNewsTimerActive(newsStatusResponse.data.isActive);
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error('Помилка завантаження даних адміна:', error);
      setMessage({
        text: error.response?.data?.message || 'Помилка завантаження даних',
        type: 'error'
      });
      setLoading(false);
    }
  };
  
  // Оновлення часу росту рослин
  const handleUpdateGrowthTime = async () => {
    try {
      setLoading(true);
      const response = await apiClient.updateGrowthTime(growthTimeSeconds);
      setMessage({
        text: response.data.message || 'Час росту оновлено успішно',
        type: 'success'
      });
      setLoading(false);
    } catch (error: any) {
      setMessage({
        text: error.response?.data?.message || 'Помилка оновлення часу росту',
        type: 'error'
      });
      setLoading(false);
    }
  };
  
  // Управління таймером шкідників
  const handlePestTimerAction = async (action: 'start' | 'stop' | 'update' | 'generate') => {
    try {
      setLoading(true);
      let response;
      
      switch (action) {
        case 'start':
          response = await apiClient.startPestTimer();
          setPestTimerActive(true);
          break;
        case 'stop':
          response = await apiClient.stopPestTimer();
          setPestTimerActive(false);
          break;
        case 'update':
          response = await apiClient.updatePestTimerInterval(pestTimerSeconds);
          // Після оновлення інтервалу, перезавантажуємо статус
          const statusResponse = await apiClient.getPestTimerStatus();
          if (statusResponse.data) {
            setPestTimerSeconds(statusResponse.data.intervalSeconds);
            setPestTimerActive(statusResponse.data.isActive);
          }
          break;
        case 'generate':
          response = await apiClient.generatePestsManually();
          break;
      }
      
      setMessage({
        text: response.data.message || 'Операція виконана успішно',
        type: 'success'
      });
      setLoading(false);
    } catch (error: any) {
      setMessage({
        text: error.response?.data?.message || 'Помилка операції з таймером шкідників',
        type: 'error'
      });
      setLoading(false);
    }
  };
  
  // Оновлення цін ринку
  const handleUpdateMarketPrices = async () => {
    try {
      setLoading(true);
      const response = await apiClient.updateMarketPrices(marketPrices);
      setMessage({
        text: response.data.message || 'Ціни ринку оновлено успішно',
        type: 'success'
      });
      setLoading(false);
    } catch (error: any) {
      setMessage({
        text: error.response?.data?.message || 'Помилка оновлення цін ринку',
        type: 'error'
      });
      setLoading(false);
    }
  };
  
  // Створення/застосування новин
  const handleNewsAction = async (action: 'save' | 'apply') => {
    try {
      if (!newsContent.trim()) {
        setMessage({ text: 'Введіть текст новини', type: 'error' });
        return;
      }
      
      if (selectedVegetables.length === 0) {
        setMessage({ text: 'Виберіть принаймні один овоч', type: 'error' });
        return;
      }
      
      setLoading(true);
      let response;
      
      if (action === 'save') {
        response = await apiClient.createNews(newsContent, newsPriceChange, selectedVegetables);
      } else {
        response = await apiClient.applyNewsImmediately(newsContent, newsPriceChange, selectedVegetables);
      }
      
      setMessage({
        text: response.data.message || 'Операція виконана успішно',
        type: 'success'
      });
      
      // Очищаємо форму після успішного створення новини
      setNewsContent('');
      setNewsPriceChange(0);
      setSelectedVegetables([]);
      
      setLoading(false);
    } catch (error: any) {
      setMessage({
        text: error.response?.data?.message || 'Помилка роботи з новинами',
        type: 'error'
      });
      setLoading(false);
    }
  };
  
  // Управління таймером новин
  const handleNewsTimerAction = async (action: 'start' | 'stop' | 'update') => {
    try {
      setLoading(true);
      let response;
      
      switch (action) {
        case 'start':
          response = await apiClient.startNewsTimer();
          setNewsTimerActive(true);
          break;
        case 'stop':
          response = await apiClient.stopNewsTimer();
          setNewsTimerActive(false);
          break;
        case 'update':
          response = await apiClient.updateNewsTimerInterval(newsTimerSeconds);
          break;
      }
      
      setMessage({
        text: response.data.message || 'Операція виконана успішно',
        type: 'success'
      });
      setLoading(false);
    } catch (error: any) {
      setMessage({
        text: error.response?.data?.message || 'Помилка операції з таймером новин',
        type: 'error'
      });
      setLoading(false);
    }
  };
  
  // Показ статистики
  const handleShowStatistics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getStatistics();
      setStatistics(response.data);
      setShowStatistics(true);
      setLoading(false);
    } catch (error: any) {
      setMessage({
        text: error.response?.data?.message || 'Помилка завантаження статистики',
        type: 'error'
      });
      setLoading(false);
    }
  };
  
  // Показ ринку
  const handleShowMarket = () => {
    window.open('/market', '_blank');
  };
  
  // Обробка зміни checkbox для овочів
  const handleVegetableChange = (vegetable: string, checked: boolean) => {
    if (checked) {
      setSelectedVegetables([...selectedVegetables, vegetable]);
    } else {
      setSelectedVegetables(selectedVegetables.filter(v => v !== vegetable));
    }
  };
  
  // Отримання назви овоча українською
  const getVegetableName = (vegetable: string) => {
    const names: Record<string, string> = {
      cucumber: 'Огірок',
      tomato: 'Помідор',
      carrot: 'Морква',
      corn: 'Кукурудза'
    };
    return names[vegetable] || vegetable;
  };
  
  // Отримання назви товару українською
  const getItemName = (item: string) => {
    const names: Record<string, string> = {
      cucumber: 'Огірок',
      tomato: 'Помідор',
      carrot: 'Морква',
      corn: 'Кукурудза',
      water: 'Вода',
      fertilizer: 'Добриво',
      pesticide: 'Пестицид',
      seeds: 'Насіння'
    };
    return names[item] || item;
  };
  
  // АІ-агент функції
  const handleSetApiKey = async () => {
    if (aiApiKey.trim()) {
      const success = await aiService.setApiKey(aiApiKey);
      if (success) {
        setMessage({
          text: 'OpenAI API ключ збережено успішно!',
          type: 'success'
        });
        setShowApiKeyInput(false);
      } else {
        setMessage({
          text: 'Помилка збереження API ключа',
          type: 'error'
        });
      }
    }
  };

  const handleStartAI = async () => {
    if (!aiService.isConfigured()) {
      setMessage({
        text: 'Спочатку налаштуйте OpenAI API ключ',
        type: 'error'
      });
      setShowApiKeyInput(true);
      return;
    }

    try {
      setLoading(true);
      setAiRunning(true);
      setMessage({
        text: 'АІ-агент запущено! Готовий до генерації сценаріїв та новин.',
        type: 'success'
      });
      setLoading(false);
    } catch (error: any) {
      setMessage({
        text: 'Помилка запуску АІ-агента',
        type: 'error'
      });
      setLoading(false);
      setAiRunning(false);
    }
  };

  const handleStopAI = async () => {
    try {
      setLoading(true);
      setAiRunning(false);
      
      // Зупиняємо поточний сценарій якщо він активний
      if (scenarioProgress.isActive && scenarioProgress.intervalId) {
        clearInterval(scenarioProgress.intervalId);
        setScenarioProgress({ currentDay: 0, isActive: false });
        setCurrentScenario(null);
      }
      
      setMessage({
        text: 'АІ-агент зупинено!',
        type: 'info'
      });
      setLoading(false);
    } catch (error: any) {
      setMessage({
        text: 'Помилка зупинки АІ-агента',
        type: 'error'
      });
      setLoading(false);
    }
  };

  const handleSendPrompt = async () => {
    if (!aiService.isConfigured()) {
      setMessage({
        text: 'Налаштуйте OpenAI API ключ',
        type: 'error'
      });
      setShowApiKeyInput(true);
      return;
    }

    if (!aiPrompt.trim()) {
      setMessage({
        text: 'Введіть промт для АІ-агента',
        type: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      setAiResponse('Генерація відповіді...');
      
      // Визначаємо тип запиту на основі ключових слів
      const promptLower = aiPrompt.toLowerCase();
      
      if (promptLower.includes('сценарій') || promptLower.includes('scenario') || 
          promptLower.includes('день') || promptLower.includes('день')) {
        // Генеруємо сценарій
        const response = await aiService.generateScenario(aiPrompt);
        
        if (response.success && response.scenario) {
          setCurrentScenario(response.scenario);
          setAiResponse(`🎬 Сценарій створено: "${response.scenario.title}"\n\n${response.scenario.description}\n\nТривалість: ${response.scenario.duration} днів\nПодій: ${response.scenario.events.length}`);
          
          setMessage({
            text: `Сценарій "${response.scenario.title}" створено! Натисніть "Запустити сценарій" для активації.`,
            type: 'success'
          });
        } else {
          setAiResponse(`❌ Помилка: ${response.error}`);
          setMessage({
            text: response.error || 'Помилка генерації сценарію',
            type: 'error'
          });
        }
      } else {
        // Генеруємо окрему новину
        const response = await aiService.generateNews(aiPrompt);
        
        if (response.success && response.news) {
          setAiResponse(`📰 Новина створена:\n\n📝 ${response.news.title}\n\n${response.news.content}\n\n💰 Зміна ціни: ${response.news.priceChange}%\n🎯 Вплив на: ${response.news.affectedItems.join(', ')}`);
          
          // Автоматично застосовуємо новину
          try {
            await apiClient.applyNewsImmediately(
              response.news.content,
              response.news.priceChange,
              response.news.affectedItems
            );
            
            setMessage({
              text: 'АІ-новина створена та застосована!',
              type: 'success'
            });
          } catch (error: any) {
            setMessage({
              text: 'Новина створена, але не вдалося застосувати: ' + error.message,
              type: 'error'
            });
          }
        } else {
          setAiResponse(`❌ Помилка: ${response.error}`);
          setMessage({
            text: response.error || 'Помилка генерації новини',
            type: 'error'
          });
        }
      }
      
      // Очищаємо поле промту
      setAiPrompt('');
      setLoading(false);
    } catch (error: any) {
      setAiResponse(`❌ Помилка: ${error.message}`);
      setMessage({
        text: 'Помилка відправки промту: ' + error.message,
        type: 'error'
      });
      setLoading(false);
    }
  };

  // Запуск згенерованого сценарію
  const handleStartScenario = async () => {
    if (!currentScenario) {
      setMessage({
        text: 'Спочатку створіть сценарій',
        type: 'error'
      });
      return;
    }

    try {
      setScenarioProgress({ currentDay: 1, isActive: true });
      
      // Запускаємо перший день сценарію
      await executeScenarioDay(1);
      
      // Налаштовуємо таймер для наступних днів (кожні 30 секунд = 1 день)
      const intervalId = setInterval(async () => {
        const nextDay = scenarioProgress.currentDay + 1;
        
        if (nextDay <= currentScenario.duration) {
          setScenarioProgress(prev => ({ ...prev, currentDay: nextDay }));
          await executeScenarioDay(nextDay);
        } else {
          // Сценарій завершено
          clearInterval(intervalId);
          setScenarioProgress({ currentDay: 0, isActive: false });
          setMessage({
            text: `Сценарій "${currentScenario.title}" завершено!`,
            type: 'success'
          });
        }
      }, 30000); // 30 секунд = 1 ігровий день
      
      setScenarioProgress(prev => ({ ...prev, intervalId }));
      
      setMessage({
        text: `Сценарій "${currentScenario.title}" запущено!`,
        type: 'success'
      });
    } catch (error: any) {
      setMessage({
        text: 'Помилка запуску сценарію: ' + error.message,
        type: 'error'
      });
    }
  };

  // Виконання дня сценарію
  const executeScenarioDay = async (day: number) => {
    if (!currentScenario) return;
    
    const dayEvent = currentScenario.events.find(event => event.day === day);
    if (!dayEvent) return;
    
    try {
      // Застосовуємо новину дня
      await apiClient.applyNewsImmediately(
        dayEvent.news,
        0, // Зміни цін будуть застосовані окремо
        dayEvent.affectedItems
      );
      
      // Застосовуємо зміни цін
      if (Object.keys(dayEvent.priceChanges).length > 0) {
        // Отримуємо поточні ціни
        const currentPricesResponse = await apiClient.getMarketPrices();
        const currentPrices = currentPricesResponse.data.prices;
        
        // Обчислюємо нові ціни
        const newPrices = { ...currentPrices };
        Object.entries(dayEvent.priceChanges).forEach(([item, changePercent]) => {
          if (newPrices[item]) {
            newPrices[item] = Math.max(0.1, newPrices[item] * (1 + changePercent / 100));
          }
        });
        
        // Застосовуємо нові ціни
        await apiClient.updateMarketPrices(newPrices);
      }
      
      setMessage({
        text: `День ${day}: ${dayEvent.news}`,
        type: 'info'
      });
    } catch (error: any) {
      console.error('Помилка виконання дня сценарію:', error);
    }
  };
  
  return (
    <Container>
      <Header>🛠️ Адмін панель</Header>
      
      <TopButtons>
        <TopButton onClick={handleShowStatistics}>
          📊 Показати статистику
        </TopButton>
        <TopButton onClick={handleShowMarket}>
          🏪 Ринок
        </TopButton>
        <TopButton onClick={() => setShowNewsManager(true)}>
          📰 Управління новинами
        </TopButton>
      </TopButtons>
      
      {message && (
        <Message type={message.type}>
          {message.text}
        </Message>
      )}
      
      {/* Модуль АІ-агент */}
      <Card style={{ marginBottom: '2rem' }}>
        <CardTitle>
          🤖 АІ-агент 
          <StatusIndicator $active={aiRunning} />
          {!aiService.isConfigured() && (
            <span style={{ 
              marginLeft: '10px', 
              fontSize: '0.8rem', 
              color: '#f44336',
              fontWeight: 'normal'
            }}>
              (API ключ не налаштовано)
            </span>
          )}
        </CardTitle>

        {/* Налаштування API ключа */}
        {(showApiKeyInput || !aiService.isConfigured()) && (
          <FormGroup style={{ 
            backgroundColor: '#fff3cd', 
            padding: '1rem', 
            borderRadius: '6px',
            border: '1px solid #ffeaa7',
            marginBottom: '1rem'
          }}>
            <Label>🔑 OpenAI API ключ:</Label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Input
                type="password"
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                placeholder="sk-..."
                style={{ flex: 1 }}
              />
              <Button variant="success" onClick={handleSetApiKey}>
                💾 Зберегти
              </Button>
              {aiService.isConfigured() && (
                <Button variant="secondary" onClick={() => setShowApiKeyInput(false)}>
                  ❌ Скасувати
                </Button>
              )}
            </div>
            <small style={{ color: '#856404', marginTop: '0.5rem', display: 'block' }}>
              Отримайте API ключ на <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">platform.openai.com</a>
            </small>
          </FormGroup>
        )}

        <FormGroup>
          <Label>Промт для АІ-агента:</Label>
          <TextArea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Введіть промт для АІ-агента. наприклад: 'Впровадь пяти денний сценарарій засухи з поступовим впливом на всі овочі , як контр захід додай підтримуючі заходи від уряду які повинні підтримувати виробників')..."
            rows={3}
          />
        </FormGroup>

        <ButtonRow>
          <Button 
            variant="success" 
            onClick={handleStartAI} 
            disabled={loading || aiRunning || !aiService.isConfigured()}
          >
            ▶️ Запустити АІ
          </Button>
          <Button 
            variant="danger" 
            onClick={handleStopAI} 
            disabled={loading || !aiRunning}
          >
            ⏹️ Стоп АІ
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSendPrompt} 
            disabled={loading || !aiPrompt.trim() || !aiService.isConfigured()}
          >
            📤 Send Prompt
          </Button>
          {!aiService.isConfigured() && (
            <Button 
              variant="secondary" 
              onClick={() => setShowApiKeyInput(true)}
            >
              🔑 Налаштувати API
            </Button>
          )}
        </ButtonRow>

        {/* Поточний сценарій */}
        {currentScenario && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#e3f2fd',
            borderRadius: '6px',
            border: '1px solid #2196F3'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1565c0' }}>
              🎬 Поточний сценарій: {currentScenario.title}
            </h4>
            <p style={{ margin: '0 0 0.5rem 0', color: '#333', fontSize: '0.9rem' }}>
              {currentScenario.description}
            </p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: '#666' }}>
                📅 Тривалість: {currentScenario.duration} днів
              </span>
              <span style={{ fontSize: '0.8rem', color: '#666' }}>
                🎯 Подій: {currentScenario.events.length}
              </span>
              {scenarioProgress.isActive && (
                <span style={{ fontSize: '0.8rem', color: '#4CAF50', fontWeight: 'bold' }}>
                  ⏳ День {scenarioProgress.currentDay}/{currentScenario.duration}
                </span>
              )}
            </div>
            <ButtonRow style={{ marginTop: '0.5rem' }}>
              <Button 
                variant="success" 
                onClick={handleStartScenario}
                disabled={loading || scenarioProgress.isActive}
                style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
              >
                {scenarioProgress.isActive ? '🟢 Сценарій активний' : '🚀 Запустити сценарій'}
              </Button>
              {scenarioProgress.isActive && (
                <Button 
                  variant="danger" 
                  onClick={() => {
                    if (scenarioProgress.intervalId) {
                      clearInterval(scenarioProgress.intervalId);
                    }
                    setScenarioProgress({ currentDay: 0, isActive: false });
                    setMessage({ text: 'Сценарій зупинено', type: 'info' });
                  }}
                  style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                >
                  ⏹️ Зупинити сценарій
                </Button>
              )}
            </ButtonRow>
          </div>
        )}

        {/* Відповідь АІ */}
        {aiResponse && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#f9f9f9',
            borderRadius: '6px',
            border: '1px solid #ddd'
          }}>
            <Label style={{ marginBottom: '0.5rem' }}>🤖 Відповідь АІ:</Label>
            <pre style={{
              whiteSpace: 'pre-wrap',
              fontSize: '0.9rem',
              lineHeight: '1.4',
              margin: 0,
              color: '#333'
            }}>
              {aiResponse}
            </pre>
          </div>
        )}

        {aiRunning && (
          <div style={{
            marginTop: '1rem',
            padding: '0.8rem',
            backgroundColor: '#e8f5e9',
            borderRadius: '6px',
            border: '1px solid #4CAF50',
            color: '#2e7d32',
            fontSize: '0.9rem'
          }}>
            🟢 АІ-агент активний та готовий до роботи
            <div style={{ fontSize: '0.8rem', marginTop: '0.3rem', opacity: 0.8 }}>
              💡 Підтримувані команди: створення сценаріїв, генерація новин, аналіз ринку
            </div>
          </div>
        )}
      </Card>
      
      <Grid>
        {/* 1. Час росту рослин */}
        <Card>
          <CardTitle>🌱 Час росту рослини</CardTitle>
          <FormGroup>
            <Label>Час росту (секунди):</Label>
            <Input
              type="number"
              value={growthTimeSeconds}
              onChange={(e) => setGrowthTimeSeconds(parseInt(e.target.value) || 0)}
              min="1"
            />
          </FormGroup>
          <Button variant="success" onClick={handleUpdateGrowthTime} disabled={loading}>
            💾 Зберегти
          </Button>
        </Card>
        
        {/* 2. Таймер шкідника */}
        <Card>
          <CardTitle>
            🐛 Таймер шкідника 
            <StatusIndicator $active={pestTimerActive} />
          </CardTitle>
          <FormGroup>
            <Label>Інтервал (секунди):</Label>
            <Input
              type="number"
              value={pestTimerSeconds}
              onChange={(e) => setPestTimerSeconds(parseInt(e.target.value) || 0)}
              min="1"
            />
          </FormGroup>
          <ButtonRow>
            <Button variant="success" onClick={() => handlePestTimerAction('start')} disabled={loading}>
              ▶️ Старт таймер
            </Button>
            <Button variant="danger" onClick={() => handlePestTimerAction('stop')} disabled={loading}>
              ⏹️ Стоп таймер
            </Button>
            <Button variant="primary" onClick={() => handlePestTimerAction('update')} disabled={loading}>
              🔄 Оновити інтервал
            </Button>
            <Button variant="secondary" onClick={() => handlePestTimerAction('generate')} disabled={loading}>
              🐛 Тест генерації
            </Button>
          </ButtonRow>
        </Card>
        
        {/* 3. Ціни ринку */}
        <Card>
          <CardTitle>💰 Ціни глобального ринку</CardTitle>
          <PriceGrid>
            {itemTypes.map(item => (
              <FormGroup key={item}>
                <Label>{getItemName(item)}:</Label>
                <Input
                  type="number"
                  value={marketPrices[item] || 0}
                  onChange={(e) => setMarketPrices({
                    ...marketPrices,
                    [item]: parseFloat(e.target.value) || 0
                  })}
                  min="0"
                  step="0.1"
                />
              </FormGroup>
            ))}
          </PriceGrid>
          <Button variant="success" onClick={handleUpdateMarketPrices} disabled={loading}>
            💾 Зберегти ціни
          </Button>
        </Card>
        
        {/* 4. Створення новин */}
        <Card>
          <CardTitle>📰 Створення новин</CardTitle>
          <FormGroup>
            <Label>Текст новини:</Label>
            <TextArea
              value={newsContent}
              onChange={(e) => setNewsContent(e.target.value)}
              placeholder="Введіть текст новини..."
            />
          </FormGroup>
          <FormGroup>
            <Label>Зміна ціни (%):</Label>
            <Input
              type="number"
              value={newsPriceChange}
              onChange={(e) => setNewsPriceChange(parseFloat(e.target.value) || 0)}
              min="-100"
              max="100"
              step="0.1"
            />
          </FormGroup>
          <FormGroup>
            <Label>Вплив на овочі:</Label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '10px', 
              padding: '15px', 
              background: '#f9f9f9', 
              borderRadius: '8px', 
              border: '1px solid #ddd' 
            }}>
              {vegetables.map(vegetable => (
                <label key={vegetable} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer',
                  padding: '8px',
                  backgroundColor: selectedVegetables.includes(vegetable) ? '#e8f5e9' : 'transparent',
                  borderRadius: '6px',
                  border: selectedVegetables.includes(vegetable) ? '2px solid #4CAF50' : '2px solid transparent',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedVegetables.includes(vegetable)}
                    onChange={(e) => handleVegetableChange(vegetable, e.target.checked)}
                    style={{
                      width: '20px',
                      height: '20px',
                      accentColor: '#4CAF50',
                      cursor: 'pointer',
                      transform: 'scale(1.2)'
                    }}
                  />
                  <span style={{ 
                    fontSize: '16px', 
                    color: selectedVegetables.includes(vegetable) ? '#2E7D32' : '#333',
                    fontWeight: selectedVegetables.includes(vegetable) ? 'bold' : 'normal'
                  }}>
                    {selectedVegetables.includes(vegetable) ? '✓ ' : ''}{getVegetableName(vegetable)}
                  </span>
                </label>
              ))}
            </div>
          </FormGroup>
          <ButtonRow>
            <Button variant="primary" onClick={() => handleNewsAction('save')} disabled={loading}>
              💾 Зберегти в базі даних
            </Button>
            <Button variant="success" onClick={() => handleNewsAction('apply')} disabled={loading}>
              ⚡ Застосувати негайно
            </Button>
          </ButtonRow>
        </Card>
        
        {/* 5. Таймер рандомних новин */}
        <Card>
          <CardTitle>
            🎲 Таймер новин 
            <StatusIndicator $active={newsTimerActive} />
          </CardTitle>
          <FormGroup>
            <Label>Інтервал (секунди):</Label>
            <Input
              type="number"
              value={newsTimerSeconds}
              onChange={(e) => setNewsTimerSeconds(parseInt(e.target.value) || 0)}
              min="1"
            />
          </FormGroup>
          <ButtonRow>
            <Button variant="success" onClick={() => handleNewsTimerAction('start')} disabled={loading}>
              ▶️ Старт таймер
            </Button>
            <Button variant="danger" onClick={() => handleNewsTimerAction('stop')} disabled={loading}>
              ⏹️ Стоп таймер
            </Button>
            <Button variant="primary" onClick={() => handleNewsTimerAction('update')} disabled={loading}>
              🔄 Оновити інтервал
            </Button>
          </ButtonRow>
        </Card>
      </Grid>
      
      {/* Модальне вікно статистики */}
      {showStatistics && statistics && (
        <StatisticsModal onClick={() => setShowStatistics(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CardTitle>📊 Статистика гри</CardTitle>
            
            <StatSection>
              <h4>👥 Загальна інформація:</h4>
              <p>Всього гравців: <strong>{statistics.totalPlayers}</strong></p>
            </StatSection>
            
            <StatSection>
              <h4>🌱 Посаджені рослини по всім гравцям:</h4>
              {statistics.plantedCrops.length > 0 ? (
                statistics.plantedCrops.map(crop => (
                  <p key={crop._id}>
                    {getVegetableName(crop._id)}: <strong>{crop.count} шт</strong>
                  </p>
                ))
              ) : (
                <p>Немає посаджених рослин</p>
              )}
            </StatSection>
            
            <StatSection>
              <h4>📦 Овочі на складах по всім гравцям:</h4>
              {Object.entries(statistics.warehouseStats).map(([vegetable, count]) => (
                <p key={vegetable}>
                  {getVegetableName(vegetable)}: <strong>{count} шт</strong>
                </p>
              ))}
            </StatSection>
            
            <StatSection>
              <h4>💰 Поточні ціни на глобальному ринку:</h4>
              {Object.entries(statistics.marketPrices).map(([item, price]) => (
                <p key={item}>
                  {getItemName(item)}: <strong>{price} монет</strong>
                </p>
              ))}
            </StatSection>
            
            <Button variant="secondary" onClick={() => setShowStatistics(false)}>
              ❌ Закрити
            </Button>
          </ModalContent>
        </StatisticsModal>
      )}
      
      {loading && (
        <Message type="info">
          ⏳ Завантаження...
        </Message>
      )}
      
      {/* Компонент управління новинами */}
      {showNewsManager && (
        <NewsManager onClose={() => setShowNewsManager(false)} />
      )}
    </Container>
  );
};

export default AdminPage; 
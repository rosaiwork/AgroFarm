import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { apiClient } from '../api/apiClient';
import { t, setLanguage, getLanguage, Language } from '../utils/localization';
import { useTonConnect } from '../hooks/useTonConnect';

// Типи для даних гравця
interface PlayerData {
  coins: number;
  inventory: {
    seeds: number;
    water: number;
    fertilizer: number;
    pesticide: number;
    cucumber: number;
    tomato: number;
    carrot: number;
    corn: number;
    [key: string]: number;
  };
  totalHarvest: number;
  inventoryCount: number;
  inventoryCapacity: number;
}

// Стилізовані компоненти
const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
`;

// Фоновий контейнер з зображенням на весь екран
const FinanceBackgroundContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-image: url('/foto/background_fin.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  z-index: -1;
  
  /* Fallback градієнт на випадок, якщо зображення не завантажиться */
  background-color: linear-gradient(to bottom, rgb(255, 215, 0) 0%, #FFA000 100%);
`;

// Контейнер для контенту з прокруткою
const ScrollableContent = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.5rem;
  padding-bottom: 80px; /* Місце для навігації */
  z-index: 1;
  -webkit-overflow-scrolling: touch;
  
  /* Адаптивність для мобільних екранів */
  @media (max-width: 768px) {
    padding: 0.25rem;
    padding-bottom: 80px;
  }
  
  @media (max-width: 480px) {
    padding: 0.125rem;
    padding-bottom: 70px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ConnectWalletButton = styled.button`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 0.75rem 1.5rem;
  color: #2E7D32;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SettingsButton = styled.button`
  background: rgba(158, 158, 158, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(158, 158, 158, 0.3);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  color: #616161;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background: rgba(158, 158, 158, 0.3);
    border: 1px solid rgba(158, 158, 158, 0.4);
    transform: scale(1.05);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const FinancePanel = styled.div`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
`;

const CoinDisplay = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const CoinIcon = styled.div`
  width: 50px;
  height: 50px;
  background: rgba(255, 215, 0, 0.3);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  border: 1px solid rgba(255, 215, 0, 0.4);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const CoinAmount = styled.div`
  font-size: 1.8rem;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
`;

const CoinLabel = styled.div`
  font-size: 1rem;
  color: white;
  font-weight: 600;
  margin-bottom: 1rem;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
`;

const ButtonsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
`;

const ActionButton = styled.button`
  background: rgba(139, 69, 19, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(139, 69, 19, 0.3);
  border-radius: 16px;
  padding: 0.75rem 0.5rem;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  min-height: 44px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  
  &:hover:not(:disabled) {
    background: rgba(139, 69, 19, 0.3);
    border: 1px solid rgba(139, 69, 19, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: rgba(100, 100, 100, 0.2);
    border: 1px solid rgba(100, 100, 100, 0.3);
  }
`;

const InventorySection = styled.div`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
`;

const InventoryTitle = styled.h2`
  color: #2E7D32;
  text-align: center;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
`;

const VegetablesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const VegetableBox = styled.div`
  position: relative;
  background: transparent;
  border: none;
  border-radius: 16px;
  padding: 1rem;
  text-align: center;
  transition: all 0.3s ease;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  
  &:hover {
    transform: translateY(-3px);
  }
`;

const VegetableIcon = styled.img`
  width: 110px;
  height: 110px;
  margin: 0;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const VegetableCount = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  color: #FFFFFF;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(5px);
  border-radius: 12px;
  padding: 4px 8px;
  min-width: 24px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const ResourcesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
`;

const ResourceItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  background: rgba(46, 125, 50, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(46, 125, 50, 0.3);
  border-radius: 16px;
  padding: 0.75rem 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background: rgba(46, 125, 50, 0.3);
    border: 1px solid rgba(46, 125, 50, 0.4);
    transform: translateY(-3px);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
  }
`;

const ResourceIcon = styled.div`
  font-size: 1.5rem;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
`;

const ResourceCount = styled.div`
  font-size: 0.9rem;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
`;

// Модальне вікно налаштувань
const SettingsModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const ModalHeader = styled.h2`
  margin: 0 0 1.5rem 0;
  text-align: center;
  color: white;
  font-size: 1.3rem;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  font-weight: 600;
`;

const SettingsSection = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  color: white;
  font-size: 1.1rem;
  margin-bottom: 1rem;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  font-weight: 600;
`;

const LanguageOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const LanguageButton = styled.button<{ active: boolean }>`
  background: ${props => props.active 
    ? 'rgba(76, 175, 80, 0.3)' 
    : 'rgba(255, 255, 255, 0.1)'};
  backdrop-filter: blur(10px);
  color: white;
  border: 1px solid ${props => props.active ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 16px;
  padding: 1rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  min-height: 48px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  
  &:hover {
    background: ${props => props.active 
      ? 'rgba(76, 175, 80, 0.4)' 
      : 'rgba(255, 255, 255, 0.2)'};
    border: 1px solid ${props => props.active ? 'rgba(76, 175, 80, 0.6)' : 'rgba(255, 255, 255, 0.3)'};
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const NotificationOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const NotificationItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
`;

const NotificationLabel = styled.span`
  color: white;
  font-weight: 500;
  font-size: 0.9rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
`;

const ToggleSwitch = styled.button<{ active: boolean }>`
  width: 50px;
  height: 28px;
  border-radius: 14px;
  border: none;
  background: ${props => props.active ? '#4CAF50' : '#BDBDBD'};
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &::after {
    content: '';
    position: absolute;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: white;
    top: 3px;
    left: ${props => props.active ? '25px' : '3px'};
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

const CloseButton = styled.button`
  background: rgba(244, 67, 54, 0.2);
  backdrop-filter: blur(10px);
  color: white;
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: 16px;
  padding: 1rem;
  width: 100%;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  min-height: 48px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  
  &:hover {
    background: rgba(244, 67, 54, 0.3);
    border: 1px solid rgba(244, 67, 54, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(46, 125, 50, 0.9) 0%, rgba(76, 175, 80, 0.9) 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  color: white;
  font-size: 1.2rem;
  text-align: center;
`;

// Стилі для модальних вікон транзакцій
const TransactionModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1500;
  padding: 1rem;
`;

const TransactionModalContent = styled.div`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 2rem;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const TransactionModalHeader = styled.h2`
  margin: 0 0 1.5rem 0;
  text-align: center;
  color: white;
  font-size: 1.4rem;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  font-weight: 600;
`;

const WalletInfo = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const WalletAddress = styled.div`
  color: white;
  font-size: 0.9rem;
  text-align: center;
  margin-bottom: 0.5rem;
  word-break: break-all;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
`;

const WalletBalance = styled.div`
  color: #4CAF50;
  font-size: 1.2rem;
  font-weight: bold;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
`;

const TransactionForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FormLabel = styled.label`
  color: white;
  font-size: 1rem;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
`;

const FormInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1rem;
  color: white;
  font-size: 1rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
  
  &:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const TransactionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  flex: 1;
  background: ${props => {
    switch (props.variant) {
      case 'danger': return 'rgba(244, 67, 54, 0.2)';
      case 'secondary': return 'rgba(158, 158, 158, 0.2)';
      default: return 'rgba(76, 175, 80, 0.2)';
    }
  }};
  backdrop-filter: blur(10px);
  color: white;
  border: 1px solid ${props => {
    switch (props.variant) {
      case 'danger': return 'rgba(244, 67, 54, 0.3)';
      case 'secondary': return 'rgba(158, 158, 158, 0.3)';
      default: return 'rgba(76, 175, 80, 0.3)';
    }
  }};
  border-radius: 16px;
  padding: 1rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  min-height: 48px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  
  &:hover {
    background: ${props => {
      switch (props.variant) {
        case 'danger': return 'rgba(244, 67, 54, 0.3)';
        case 'secondary': return 'rgba(158, 158, 158, 0.3)';
        default: return 'rgba(76, 175, 80, 0.3)';
      }
    }};
    border: 1px solid ${props => {
      switch (props.variant) {
        case 'danger': return 'rgba(244, 67, 54, 0.4)';
        case 'secondary': return 'rgba(158, 158, 158, 0.4)';
        default: return 'rgba(76, 175, 80, 0.4)';
      }
    }};
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(244, 67, 54, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: 12px;
  padding: 1rem;
  color: white;
  text-align: center;
  margin-bottom: 1rem;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
`;

const SuccessMessage = styled.div`
  background: rgba(76, 175, 80, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 12px;
  padding: 1rem;
  color: white;
  text-align: center;
  margin-bottom: 1rem;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
`;

const FinancePage: React.FC = () => {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(getLanguage());
  
  // TON Connect хук
  const { 
    isConnected, 
    address, 
    shortAddress, 
    balance, 
    connectWallet, 
    disconnectWallet,
    sendTransaction,
    isLoading: tonLoading 
  } = useTonConnect();
  
  // Стейт для модальних вікон
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [transactionSuccess, setTransactionSuccess] = useState<string | null>(null);
  
  // Стейт для перемикачів сповіщень (поки без функціоналу)
  const [notifications, setNotifications] = useState({
    news: true,
    pests: false,
    harvest: true
  });

  // Завантаження даних гравця
  const loadPlayerData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getPlayerData();
      
      if (response.data) {
        setPlayerData(response.data);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Помилка завантаження даних гравця:', error);
      setError('Помилка завантаження даних. Спробуйте оновити сторінку.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayerData();
  }, []);

  // Зміна мови
  const handleLanguageChange = (language: Language) => {
    setLanguage(language);
    setCurrentLanguage(language);
    // Перезавантажуємо сторінку для застосування змін
    window.location.reload();
  };

  // Функція для перемикання сповіщень (поки без функціоналу)
  const toggleNotification = (type: 'news' | 'pests' | 'harvest') => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Обробка підключення/відключення гаманця
  const handleWalletConnect = async () => {
    try {
      if (isConnected) {
        await disconnectWallet();
      } else {
        await connectWallet();
      }
    } catch (error) {
      console.error('Помилка роботи з гаманцем:', error);
      setTransactionError('Помилка підключення гаманця');
    }
  };

  // Обробка поповнення
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setTransactionError('Спочатку підключіть гаманець');
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setTransactionError('Введіть коректну суму для поповнення');
      return;
    }

    try {
      setTransactionError(null);
      setTransactionSuccess(null);
      setLoading(true);

      // Адреса контракту гри (заглушка)
      const gameContractAddress = 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t';
      
      // Відправляємо транзакцію
      await sendTransaction(
        gameContractAddress,
        depositAmount,
        `Deposit ${depositAmount} TON to Farm Game`
      );

      // Тут можна додати API виклик для оновлення балансу в грі
      // await apiClient.updatePlayerBalance(depositAmount);

      setTransactionSuccess(`Успішно поповнено на ${depositAmount} TON`);
      setDepositAmount('');
      setShowDepositModal(false);
      
      // Оновлюємо дані гравця
      await loadPlayerData();
      
    } catch (error: any) {
      console.error('Помилка поповнення:', error);
      setTransactionError(error.message || 'Помилка поповнення рахунку');
    } finally {
      setLoading(false);
    }
  };

  // Обробка виведення
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setTransactionError('Спочатку підключіть гаманець');
      return;
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setTransactionError('Введіть коректну суму для виведення');
      return;
    }

    if (!playerData || playerData.coins < parseFloat(withdrawAmount)) {
      setTransactionError('Недостатньо коштів для виведення');
      return;
    }

    try {
      setTransactionError(null);
      setTransactionSuccess(null);
      setLoading(true);

      // Тут має бути API виклик для виведення коштів з ігрового рахунку
      // const result = await apiClient.withdrawFromGame(withdrawAmount, address);
      
      // Поки що заглушка
      console.log(`Виведення ${withdrawAmount} KNL на адресу ${address}`);

      setTransactionSuccess(`Успішно виведено ${withdrawAmount} KNL`);
      setWithdrawAmount('');
      setShowWithdrawModal(false);
      
      // Оновлюємо дані гравця
      await loadPlayerData();
      
    } catch (error: any) {
      console.error('Помилка виведення:', error);
      setTransactionError(error.message || 'Помилка виведення коштів');
    } finally {
      setLoading(false);
    }
  };

  // Закриття модальних вікон та очищення помилок
  const closeModals = () => {
    setShowDepositModal(false);
    setShowWithdrawModal(false);
    setTransactionError(null);
    setTransactionSuccess(null);
    setDepositAmount('');
    setWithdrawAmount('');
  };

  // Отримання шляху до картинки овочу
  const getVegetableImage = (vegetableType: string): string => {
    const images: Record<string, string> = {
      tomato: '/foto/ripe_tomato.png',
      cucumber: '/foto/ripe_cucumber.png',
      carrot: '/foto/ripe_carrot.png',
      corn: '/foto/ripe_corn.png'
    };
    return images[vegetableType] || '/foto/ripe_tomato.png';
  };

  // Отримання іконки ресурсу
  const getResourceIcon = (resourceType: string): string => {
    const icons: Record<string, string> = {
      water: '💧',
      seeds: '🌱',
      fertilizer: '🧪',
      pesticide: '🧴'
    };
    return icons[resourceType] || '📦';
  };

  if (!playerData) {
    return (
      <Container>
        <LoadingOverlay>
          {t('loading')}
        </LoadingOverlay>
      </Container>
    );
  }

  return (
    <Container>
      {/* Фоновий контейнер на весь екран */}
      <FinanceBackgroundContainer />
      
      {/* Контент з прокруткою */}
      <ScrollableContent>
        <Header>
          <ConnectWalletButton onClick={handleWalletConnect} disabled={tonLoading}>
            {tonLoading ? '⏳' : isConnected ? `🔗 ${shortAddress}` : t('connectWallet')}
          </ConnectWalletButton>
          <SettingsButton onClick={() => setShowSettings(true)}>
            ⚙️
          </SettingsButton>
        </Header>

      {error && (
        <div style={{ 
          color: 'red', 
          background: 'rgba(255,255,255,0.9)', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1rem' 
        }}>
          {error}
        </div>
      )}

      {/* Фінансова панель */}
      <FinancePanel>
        <CoinDisplay>
          <div>
            <CoinAmount>{playerData.coins}</CoinAmount>
            <CoinLabel>KNL</CoinLabel>
          </div>
        </CoinDisplay>
        
        <ButtonsRow>
          <ActionButton onClick={() => setShowDepositModal(true)} disabled={!isConnected}>
            {t('deposit')}
          </ActionButton>
          <ActionButton onClick={() => setShowWithdrawModal(true)} disabled={!isConnected}>
            {t('withdraw')}
          </ActionButton>
          <ActionButton onClick={() => console.log('Referral clicked')}>
            {t('referral')}
          </ActionButton>
        </ButtonsRow>
      </FinancePanel>

      {/* Секція складу */}
      <InventorySection>
        <InventoryTitle>{t('inventory')}</InventoryTitle>
        
        {/* Овочі */}
        <VegetablesGrid>
          {(['tomato', 'cucumber', 'carrot', 'corn'] as const).map(vegetableType => (
            <VegetableBox key={vegetableType}>
              <VegetableIcon 
                src={getVegetableImage(vegetableType)}
                alt={`${vegetableType} icon`}
              />
              <VegetableCount>{playerData.inventory[vegetableType] || 0}</VegetableCount>
            </VegetableBox>
          ))}
        </VegetablesGrid>

        {/* Ресурси */}
        <ResourcesGrid>
          {(['water', 'seeds', 'fertilizer', 'pesticide'] as const).map(resourceType => (
            <ResourceItem key={resourceType}>
              <ResourceIcon>{getResourceIcon(resourceType)}</ResourceIcon>
              <ResourceCount>{playerData.inventory[resourceType] || 0}</ResourceCount>
            </ResourceItem>
          ))}
        </ResourcesGrid>
      </InventorySection>

      {/* Модальне вікно налаштувань */}
      {showSettings && (
        <SettingsModal onClick={() => setShowSettings(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>{t('settings')}</ModalHeader>
            
            <SettingsSection>
              <SectionTitle>{t('language')}</SectionTitle>
              <LanguageOptions>
                <LanguageButton 
                  active={currentLanguage === 'uk'}
                  onClick={() => handleLanguageChange('uk')}
                >
                  🇺🇦 Українська
                </LanguageButton>
                <LanguageButton 
                  active={currentLanguage === 'en'}
                  onClick={() => handleLanguageChange('en')}
                >
                  🇬🇧 English
                </LanguageButton>
              </LanguageOptions>
            </SettingsSection>

            <SettingsSection>
              <SectionTitle>{t('notifications')}</SectionTitle>
              <NotificationOptions>
                <NotificationItem>
                  <NotificationLabel>{t('news')}</NotificationLabel>
                  <ToggleSwitch 
                    active={notifications.news}
                    onClick={() => toggleNotification('news')}
                  />
                </NotificationItem>
                <NotificationItem>
                  <NotificationLabel>{t('pests')}</NotificationLabel>
                  <ToggleSwitch 
                    active={notifications.pests}
                    onClick={() => toggleNotification('pests')}
                  />
                </NotificationItem>
                <NotificationItem>
                  <NotificationLabel>{t('harvestReady')}</NotificationLabel>
                  <ToggleSwitch 
                    active={notifications.harvest}
                    onClick={() => toggleNotification('harvest')}
                  />
                </NotificationItem>
              </NotificationOptions>
            </SettingsSection>
            
            <CloseButton onClick={() => setShowSettings(false)}>
              {t('close')}
            </CloseButton>
          </ModalContent>
        </SettingsModal>
      )}

      {/* Модальне вікно поповнення */}
      {showDepositModal && (
        <TransactionModal onClick={closeModals}>
          <TransactionModalContent onClick={(e) => e.stopPropagation()}>
            <TransactionModalHeader>💰 Поповнення рахунку</TransactionModalHeader>
            
            {isConnected && (
              <WalletInfo>
                <WalletAddress>Гаманець: {shortAddress}</WalletAddress>
                <WalletBalance>Баланс: {balance} TON</WalletBalance>
              </WalletInfo>
            )}

            {transactionError && (
              <ErrorMessage>{transactionError}</ErrorMessage>
            )}

            {transactionSuccess && (
              <SuccessMessage>{transactionSuccess}</SuccessMessage>
            )}

            <TransactionForm onSubmit={handleDeposit}>
              <FormGroup>
                <FormLabel>Сума для поповнення (TON):</FormLabel>
                <FormInput
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </FormGroup>

              <ButtonGroup>
                <TransactionButton type="submit" disabled={loading || !depositAmount}>
                  {loading ? '⏳ Обробка...' : '💰 Поповнити'}
                </TransactionButton>
                <TransactionButton type="button" variant="secondary" onClick={closeModals}>
                  ❌ Скасувати
                </TransactionButton>
              </ButtonGroup>
            </TransactionForm>
          </TransactionModalContent>
        </TransactionModal>
      )}

      {/* Модальне вікно виведення */}
      {showWithdrawModal && (
        <TransactionModal onClick={closeModals}>
          <TransactionModalContent onClick={(e) => e.stopPropagation()}>
            <TransactionModalHeader>💸 Виведення коштів</TransactionModalHeader>
            
            {isConnected && (
              <WalletInfo>
                <WalletAddress>Гаманець: {shortAddress}</WalletAddress>
                <WalletBalance>Доступно в грі: {playerData?.coins || 0} KNL</WalletBalance>
              </WalletInfo>
            )}

            {transactionError && (
              <ErrorMessage>{transactionError}</ErrorMessage>
            )}

            {transactionSuccess && (
              <SuccessMessage>{transactionSuccess}</SuccessMessage>
            )}

            <TransactionForm onSubmit={handleWithdraw}>
              <FormGroup>
                <FormLabel>Сума для виведення (KNL):</FormLabel>
                <FormInput
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={playerData?.coins || 0}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </FormGroup>

              <ButtonGroup>
                <TransactionButton type="submit" disabled={loading || !withdrawAmount}>
                  {loading ? '⏳ Обробка...' : '💸 Вивести'}
                </TransactionButton>
                <TransactionButton type="button" variant="secondary" onClick={closeModals}>
                  ❌ Скасувати
                </TransactionButton>
              </ButtonGroup>
            </TransactionForm>
          </TransactionModalContent>
        </TransactionModal>
      )}

      {loading && (
        <LoadingOverlay>
          {t('loading')}
        </LoadingOverlay>
      )}
      </ScrollableContent>
    </Container>
  );
};

export default FinancePage; 
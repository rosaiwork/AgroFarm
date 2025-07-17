import React, { useEffect, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { apiClient } from '../api/apiClient';
import { t, getLanguage, Language } from '../utils/localization';
import PlotArea from '../components/PlotArea';
import { PlantType, BACKGROUND_DIMENSIONS } from '../config/farmConfig';
import backgroundFarm from '../assets/images/background_farm.png';

interface GrowthStage {
  stage: number;
  needsWater: boolean;
  wasWatered: boolean;
  startTime: string;
  durationMinutes: number;
  usedFertilizer: boolean;
}

interface Plot {
  index: number;
  plantType?: string;
  plantedAt?: string;
  status: 'empty' | 'growing' | 'ready' | 'dead';
  hasPests: boolean;
  growthStages?: GrowthStage[];
  stageIndex?: number;
  progress?: number;
}

interface Inventory {
  seeds: number;
  water: number;
  fertilizer: number;
  pesticide: number;
  cucumber?: number;
  tomato?: number;
  carrot?: number;
  corn?: number;
}

interface PlayerData {
  coins: number;
  inventory: Inventory;
  totalHarvest: number;
  inventoryCount: number;
  inventoryCapacity: number;
}

type ActionMode = 'plant' | 'water' | 'fertilize' | 'pesticide' | null;

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

// Головний контейнер ферми з фоновим зображенням на весь екран
const FarmContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(${backgroundFarm});
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  z-index: 1;
`;

const InventoryPanel = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  display: flex;
  justify-content: space-between;
  background: transparent;
  border-radius: 12px;
  padding: 0.75rem 0.5rem;
  box-shadow: none;
  border: none;
  backdrop-filter: none;
  z-index: 100;
`;

const InventoryItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  padding: 0.25rem;
`;

const ItemIcon = styled.div`
  font-size: 1.8rem;
  margin-bottom: 0.25rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
`;

const ItemCount = styled.span`
  font-size: 0.9rem;
  font-weight: bold;
  color: #2E7D32;
  background: rgba(76, 175, 80, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  min-width: 24px;
  text-align: center;
`;

const ActionButtons = styled.div`
  position: fixed;
  bottom: 4.5rem;
  left: 1rem;
  right: 1rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  z-index: 100;
`;

const ActionButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive?: boolean }>`
  background: ${props => (props.isActive 
    ? 'rgba(76, 175, 80, 0.4)' 
    : 'rgba(255, 255, 255, 0.05)')};
  color: ${props => (props.isActive ? '#FFFFFF' : '#333')};
  border: 2px solid ${props => (props.isActive ? 'rgba(76, 175, 80, 0.8)' : 'rgba(255, 255, 255, 0.15)')};
  border-radius: 16px;
  padding: 0.75rem 0.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  backdrop-filter: ${props => (props.isActive ? 'blur(15px)' : 'none')};
  transition: all 0.3s ease;
  min-height: 60px;
  box-shadow: ${props => (props.isActive 
    ? '0 0 25px rgba(76, 175, 80, 0.6), 0 4px 20px rgba(76, 175, 80, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)' 
    : '0 2px 8px rgba(0, 0, 0, 0.05)')};
  
  &:hover {
    transform: translateY(-2px);
    background: ${props => (props.isActive 
      ? 'rgba(76, 175, 80, 0.5)' 
      : 'rgba(255, 255, 255, 0.1)')};
    border-color: ${props => (props.isActive 
      ? 'rgba(76, 175, 80, 1)' 
      : 'rgba(255, 255, 255, 0.25)')};
    box-shadow: ${props => (props.isActive 
      ? '0 0 30px rgba(76, 175, 80, 0.8), 0 6px 25px rgba(76, 175, 80, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4)' 
      : '0 4px 12px rgba(0, 0, 0, 0.1)')};
    backdrop-filter: ${props => (props.isActive ? 'blur(20px)' : 'blur(5px)')};
  }
  
  &:active {
    transform: translateY(-1px);
    background: ${props => (props.isActive 
      ? 'rgba(76, 175, 80, 0.6)' 
      : 'rgba(255, 255, 255, 0.08)')};
  }
`;

const ActionIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
`;

const ActionSvgIcon = styled.img`
  width: 24px;
  height: 24px;
  margin-bottom: 0.25rem;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
  transition: all 0.3s ease;
`;

const ActionLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.1;
`;

const PlantSelectionModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  padding: 1.5rem;
  width: 100%;
  max-width: 420px;
  backdrop-filter: blur(20px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
`;

const ModalHeader = styled.h2`
  font-size: 1.4rem;
  margin-bottom: 1.5rem;
  text-align: center;
  color: #1B5E20;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  font-weight: 700;
  letter-spacing: 0.5px;
`;

const PlantOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.2rem;
  margin-bottom: 1rem;
`;

const PlantOption = styled.button`
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 120px;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  
  &:hover {
    border-color: rgba(76, 175, 80, 0.6);
    background: rgba(76, 175, 80, 0.1);
    transform: translateY(-3px);
    box-shadow: 
      0 8px 25px rgba(76, 175, 80, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }
  
  &:active {
    transform: translateY(-1px);
  }
`;

const PlantIcon = styled.div`
  font-size: 2.5rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  text-align: center;
`;

const PlantSeedIcon = styled.img`
  width: 62px;
  height: 94px;
  margin-bottom: 0.8rem;
  filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3));
  transition: transform 0.3s ease;
`;

const PlantName = styled.span`
  font-size: 1rem;
  margin: 0.5rem 0;
  font-weight: bold;
  color: #1B5E20;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
`;

const PlantInfo = styled.div`
  font-size: 0.8rem;
  color: #2E4A2E;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  line-height: 1.3;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
`;

const CloseButton = styled.button`
  margin-top: 1rem;
  padding: 1rem;
  width: 100%;
  background: rgba(244, 67, 54, 0.2);
  color: #B71C1C;
  border: 2px solid rgba(244, 67, 54, 0.4);
  border-radius: 16px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 4px 15px rgba(244, 67, 54, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  
  &:hover {
    background: rgba(244, 67, 54, 0.3);
    border-color: rgba(244, 67, 54, 0.6);
    transform: translateY(-2px);
    box-shadow: 
      0 6px 20px rgba(244, 67, 54, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

// Нові стильові компоненти для відображення прогресу
const ProgressBarContainer = styled.div`
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressBar = styled.div<{ width: number }>`
  height: 100%;
  width: ${props => `${props.width}%`};
  background: linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%);
  border-radius: 2px;
  transition: width 0.3s ease;
`;

const ProgressText = styled.span`
  color: #FFFFFF;
  font-size: 0.8rem;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
`;

const PlotStatus = styled.div`
  position: absolute;
  bottom: 15px;
  width: 100%;
  text-align: center;
  font-size: 0.7rem;
  color: #FFFFFF;
  display: flex;
  justify-content: center;
  align-items: center;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
  font-weight: 600;
`;

const WaterIndicator = styled.div`
  position: absolute;
  bottom: 25px;
  left: 6px;
  font-size: 1rem;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
  
  &.pulsating {
    animation: pulse 2s infinite;
    
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }
  }
`;

const DeadPlantOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(139,69,19,0.4) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &::before {
    content: '💀';
    font-size: 2rem;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
  }
`;

const FertilizerIndicator = styled.div`
  position: absolute;
  top: 6px;
  left: 6px;
  font-size: 1rem;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
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

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const HarvestAnimationOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1500;
  pointer-events: none;
`;

const harvestPop = keyframes`
  0% {
    transform: scale(0.5) rotate(-10deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(5deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 0;
  }
`;

const HarvestAnimationContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: ${harvestPop} 1s ease-out;
`;

const HarvestIcon = styled.img`
  width: 120px;
  height: 120px;
  filter: drop-shadow(0 8px 16px rgba(0,0,0,0.4));
`;

const HarvestText = styled.div`
  margin-top: 1rem;
  font-size: 1.5rem;
  font-weight: bold;
  color: #FFFFFF;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
  text-align: center;
`;

const PlantInfoModal = styled.div`
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
  backdrop-filter: blur(3px);
`;

const InfoModalContent = styled.div`
  background: rgba(255, 255, 255, 0.15);
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 400px;
  width: 90%;
  text-align: center;
`;

const InfoModalTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #FFFFFF;
  font-size: 1.4rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
`;

const InfoModalText = styled.p`
  margin: 0.5rem 0;
  color: #FFFFFF;
  font-size: 1rem;
  line-height: 1.4;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
`;

const InfoModalButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
`;

const InfoModalButton = styled.button<{ variant?: 'danger' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  backdrop-filter: blur(5px);
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
  
  ${props => props.variant === 'danger' ? css`
    background: rgba(220, 53, 69, 0.7);
    &:hover {
      background: rgba(200, 35, 51, 0.8);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
    }
  ` : props.variant === 'secondary' ? css`
    background: rgba(108, 117, 125, 0.7);
    &:hover {
      background: rgba(90, 98, 104, 0.8);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(108, 117, 125, 0.4);
    }
  ` : css`
    background: rgba(40, 167, 69, 0.7);
    &:hover {
      background: rgba(33, 136, 56, 0.8);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
    }
  `}
`;

const PestIndicator = styled.div`
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 1.2rem;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
  animation: wiggle 1s ease-in-out infinite;
  
  @keyframes wiggle {
    0%, 100% { transform: rotate(-5deg); }
    50% { transform: rotate(5deg); }
  }
`;

const ErrorMessage = styled.div`
  position: absolute;
  top: 7rem;
  left: 1rem;
  right: 1rem;
  background: rgba(244, 67, 54, 0.95);
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  backdrop-filter: blur(5px);
  z-index: 200;
  font-weight: 500;
  text-align: center;
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
  cursor: pointer;
  transition: opacity 0.3s ease;
  
  &:hover {
    opacity: 0.8;
  }
`;

const StatusMessage = styled.div`
  position: absolute;
  top: 7rem;
  left: 1rem;
  right: 1rem;
  background: rgba(76, 175, 80, 0.95);
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  backdrop-filter: blur(5px);
  z-index: 200;
  font-weight: 500;
  text-align: center;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  cursor: pointer;
  transition: opacity 0.3s ease;
  
  &:hover {
    opacity: 0.8;
  }
`;

const FarmPage: React.FC = () => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [inventory, setInventory] = useState<Inventory>({ seeds: 10, water: 20, fertilizer: 5, pesticide: 5 });
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [activeMode, setActiveMode] = useState<ActionMode>(null);
  const [showPlantModal, setShowPlantModal] = useState(false);
  const [selectedPlotIndex, setSelectedPlotIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [statusMessageTimer, setStatusMessageTimer] = useState<NodeJS.Timeout | null>(null);
  const [showHarvestAnimation, setShowHarvestAnimation] = useState(false);
  const [harvestPlantType, setHarvestPlantType] = useState<string | null>(null);
  const [showPlantInfoModal, setShowPlantInfoModal] = useState(false);
  const [selectedPlantIndex, setSelectedPlantIndex] = useState<number | null>(null);
  
  // Функція для форматування дати з бази даних
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Невідомо';
    return new Date(dateString).toLocaleString('uk-UA');
  };

  // Функція для встановлення повідомлення з автоматичним очищенням
  const setTemporaryStatusMessage = (message: string, duration: number = 3000) => {
    // Очищаємо попередній таймер, якщо існує
    if (statusMessageTimer) {
      clearTimeout(statusMessageTimer);
    }
    
    // Встановлюємо нове повідомлення
    setStatusMessage(message);
    
    // Встановлюємо таймер для очищення повідомлення
    const timer = setTimeout(() => {
      setStatusMessage(null);
      setStatusMessageTimer(null);
    }, duration);
    
    setStatusMessageTimer(timer);
  };

  // Функція для встановлення тимчасових помилок
  const setTemporaryError = (message: string, duration: number = 4000) => {
    // Очищаємо попередній таймер, якщо існує
    if (statusMessageTimer) {
      clearTimeout(statusMessageTimer);
    }
    
    // Встановлюємо нову помилку
    setError(message);
    
    // Встановлюємо таймер для очищення помилки
    const timer = setTimeout(() => {
      setError(null);
      setStatusMessageTimer(null);
    }, duration);
    
    setStatusMessageTimer(timer);
  };

  // Функція для отримання назви рослини українською
  const getPlantName = (plantType?: string): string => {
    const plantNames: Record<string, string> = {
      cucumber: t('cucumber'),
      tomato: t('tomato'),
      carrot: t('carrot'),
      corn: t('corn')
    };
    return plantType ? plantNames[plantType] || plantType : t('unknownPlant');
  };

  // Функція для отримання шляху до harvest зображення
  const getHarvestImagePath = (plantType: string): string => {
    return `/foto/harvest_${plantType}.png`;
  };

  // Функція для показу анімації збору врожаю
  const showHarvestAnimationWithPlant = (plantType: string) => {
    setHarvestPlantType(plantType);
    setShowHarvestAnimation(true);
    
    // Автоматично приховуємо анімацію через 2 секунди
    setTimeout(() => {
      setShowHarvestAnimation(false);
      setHarvestPlantType(null);
    }, 2000);
  };

  // Функція для обробки видалення рослини з інфо-модального вікна
  const handleRemovePlantFromModal = () => {
    if (selectedPlantIndex !== null) {
      handleRemovePlant(selectedPlantIndex);
      setShowPlantInfoModal(false);
      setSelectedPlantIndex(null);
    }
  };

  // Функція для закриття інфо-модального вікна
  const closeInfoModal = () => {
    setShowPlantInfoModal(false);
    setSelectedPlantIndex(null);
  };
  
  // Завантаження грядок та інвентарю
  const loadFarmData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getPlots();
      
      if (response.data) {
        console.log('Отримані дані про грядки:', JSON.stringify(response.data, null, 2));
        setPlots(response.data);
      }
      
      const playerResponse = await apiClient.getPlayerData();
      
      if (playerResponse.data) {
        setInventory(playerResponse.data.inventory);
        setPlayerData({
          coins: playerResponse.data.coins,
          inventory: playerResponse.data.inventory,
          totalHarvest: playerResponse.data.totalHarvest,
          inventoryCount: playerResponse.data.inventoryCount,
          inventoryCapacity: playerResponse.data.inventoryCapacity
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Помилка завантаження даних ферми:', error);
      setError('Помилка завантаження даних. Спробуйте оновити сторінку.');
      setLoading(false);
    }
  };

  // Тихе оновлення даних без показу екрана завантаження
  const silentUpdateFarmData = async () => {
    try {
      console.log('Тихе оновлення даних...');
      
      const response = await apiClient.getPlots();
      
      if (response.data) {
        setPlots(response.data);
      }
      
      const playerResponse = await apiClient.getPlayerData();
      
      if (playerResponse.data) {
        setInventory(playerResponse.data.inventory);
        setPlayerData({
          coins: playerResponse.data.coins,
          inventory: playerResponse.data.inventory,
          totalHarvest: playerResponse.data.totalHarvest,
          inventoryCount: playerResponse.data.inventoryCount,
          inventoryCapacity: playerResponse.data.inventoryCapacity
        });
      }
      
      console.log('Тихе оновлення завершено');
    } catch (error) {
      console.error('Помилка тихого оновлення даних ферми:', error);
      // Не показуємо помилку користувачу при тихому оновленні
    }
  };
  
  useEffect(() => {
    loadFarmData();
    
    // Тихе оновлення даних кожні 30 секунд
    const interval = setInterval(() => {
      silentUpdateFarmData();
    }, 30000);
    
    return () => {
      clearInterval(interval);
      // Очищаємо таймери при розмонтуванні компонента
      if (statusMessageTimer) {
        clearTimeout(statusMessageTimer);
      }
    };
  }, []);
  

  
  const handlePlotClick = (index: number) => {
    // Перевірка на невизначений індекс
    if (index === undefined) {
      console.error('Помилка: індекс грядки не визначено');
      setTemporaryError('Помилка доступу до грядки: індекс не визначено');
      return;
    }
    
    // Перевірка на валідний індекс і наявність даних
    if (index < 0 || index >= plots.length || !plots[index]) {
      console.error(`Помилка: Спроба доступу до неіснуючої грядки з індексом ${index}`);
      setTemporaryError('Помилка доступу до грядки');
      return;
    }
    
    const plot = plots[index];
    
    if (activeMode === 'plant' && plot.status === 'empty') {
      setSelectedPlotIndex(index);
      setShowPlantModal(true);
      setStatusMessage(null);
    } else if (activeMode === 'water' && plot.status === 'growing') {
      handleWaterPlot(index);
      setTemporaryStatusMessage(t('plantWatered'));
    } else if (activeMode === 'fertilize' && plot.status === 'growing') {
      handleUseFertilizer(index);
      setTemporaryStatusMessage(t('fertilizerApplied'));
    } else if (activeMode === 'pesticide' && plot.status === 'growing' && plot.hasPests) {
      handleUsePesticide(index);
      setTemporaryStatusMessage(t('pesticideApplied'));
    } else if (plot.status === 'ready') {
      handleHarvestPlot(index);
      setTemporaryStatusMessage(t('harvestCollected'));
    } else if (plot.status === 'dead') {
      handleClearDeadPlot(index);
    } else {
      // Відображення інформації про грядку
      if (plot.status === 'growing') {
        // Відкриваємо модальне вікно з інформацією про рослину
        setSelectedPlantIndex(index);
        setShowPlantInfoModal(true);
              } else if (plot.status === 'empty') {
          setTemporaryStatusMessage(t('emptyPlotMessage'), 4000);
        } else if (plot.status === 'dead') {
          if (plot.hasPests) {
            setTemporaryStatusMessage(t('plantDiedFromPests'), 5000);
          } else {
            setTemporaryStatusMessage(t('plantDied'), 5000);
          }
        } else if (plot.status === 'ready') {
          const plantName = getPlantName(plot.plantType);
          setTemporaryStatusMessage(`${plantName} - ${t('readyToHarvest')}`, 4000);
        }
    }
  };
  
  const handlePlantSelected = async (plantType: PlantType) => {
    if (selectedPlotIndex !== null) {
      try {
        setError(null);
        
        // Оптимістичне оновлення - додаємо рослину
        const optimisticUpdate = () => {
          const updatedPlots = [...plots];
          updatedPlots[selectedPlotIndex] = {
            index: selectedPlotIndex,
            plantType: plantType,
            status: 'growing' as const,
            hasPests: false,
            stageIndex: 0,
            progress: 0,
            plantedAt: new Date().toISOString(),
            growthStages: [
              {
                stage: 1,
                needsWater: true,
                wasWatered: false,
                startTime: new Date().toISOString(),
                durationMinutes: 30,
                usedFertilizer: false
              }
            ]
          };
          setPlots(updatedPlots);
          
          // Зменшити кількість насіння
          setInventory(prev => ({ ...prev, seeds: prev.seeds - 1 }));
        };
        
        // Виконуємо оптимістичне оновлення
        optimisticUpdate();
        
        setShowPlantModal(false);
        setSelectedPlotIndex(null);
        
        const response = await apiClient.plantSeed(selectedPlotIndex, plantType);
        
        if (response.data) {
          // Синхронізація з сервером через затримку
          setTimeout(() => {
            silentUpdateFarmData();
          }, 1000);
        }
        
      } catch (error: any) {
        console.error('Помилка посадки рослини:', error);
        
        // У разі помилки відкочуємо оптимістичне оновлення
        await silentUpdateFarmData();
        
        setTemporaryError(error.response?.data?.message || 'Помилка посадки рослини');
      }
    }
  };
  
  const handleWaterPlot = async (index: number) => {
    try {
      // Перевірка на невизначений індекс
      if (index === undefined) {
        console.error('Помилка: індекс грядки не визначено');
        setTemporaryError('Помилка доступу до грядки: індекс не визначено');
        return;
      }
      
      // Перевірка на валідний індекс
      if (index < 0 || index >= plots.length || !plots[index]) {
        setTemporaryError('Помилка доступу до грядки');
        return;
      }
      
      // Убираємо setLoading(true) щоб не впливати на рендеринг спрайтів
      setError(null);
      
      if (inventory.water <= 0) {
        setTemporaryError('Недостатньо води!');
        return;
      }
      
      const plot = plots[index];
      
      // Перевірка чи рослина вже полита на поточній стадії
      if (plot.growthStages && 
          plot.stageIndex !== undefined && 
          plot.growthStages[plot.stageIndex]?.wasWatered) {
        setTemporaryError('Рослина вже полита на цій стадії');
        return;
      }
      
      // Оптимістичне оновлення UI - оновлюємо стан до запиту
      const optimisticUpdate = () => {
        if (plot.growthStages && plot.stageIndex !== undefined) {
          const updatedPlots = [...plots];
          const updatedPlot = { ...plot };
          updatedPlot.growthStages = [...plot.growthStages];
          updatedPlot.growthStages[plot.stageIndex] = {
            ...plot.growthStages[plot.stageIndex],
            wasWatered: true
          };
          updatedPlots[index] = updatedPlot;
          setPlots(updatedPlots);
          setInventory(prev => ({ ...prev, water: prev.water - 1 }));
        }
      };
      
      // Виконуємо оптимістичне оновлення
      optimisticUpdate();
      
      const response = await apiClient.waterPlot(index);
      
      if (response.data) {
        console.log('Підтвердження поливу з сервера:', {
          originalIndex: index,
          serverResponse: response.data,
          serverWasWatered: response.data.growthStages?.[response.data.stageIndex || 0]?.wasWatered
        });
        
        // Невелика затримка перед синхронізацією для стабільності UI
        setTimeout(() => {
          silentUpdateFarmData();
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('Помилка поливу рослини:', error);
      
      // У разі помилки відкочуємо оптимістичне оновлення
      await silentUpdateFarmData();
      
      // Особливе повідомлення про шкідників
      if (error.response?.data?.message?.includes('шкідники')) {
        setTemporaryError('Неможливо полити рослину, спочатку видаліть шкідників!');
      } else {
        setTemporaryError(error.response?.data?.message || 'Помилка поливу рослини');
      }
    }
  };
  
  const handleUseFertilizer = async (index: number) => {
    try {
      // Перевірка на невизначений індекс
      if (index === undefined) {
        console.error('Помилка: індекс грядки не визначено');
        setTemporaryError('Помилка доступу до грядки: індекс не визначено');
        return;
      }
      
      // Перевірка на валідний індекс
      if (index < 0 || index >= plots.length || !plots[index]) {
        setTemporaryError('Помилка доступу до грядки');
        return;
      }
      
      setError(null);
      
      if (inventory.fertilizer <= 0) {
        setTemporaryError('Недостатньо добрива!');
        return;
      }
      
      const plot = plots[index];
      
      // Оптимістичне оновлення - позначаємо що добриво використано
      const optimisticUpdate = () => {
        if (plot.growthStages && plot.stageIndex !== undefined) {
          const updatedPlots = [...plots];
          const updatedPlot = { ...plot };
          updatedPlot.growthStages = [...plot.growthStages];
          updatedPlot.growthStages[plot.stageIndex] = {
            ...plot.growthStages[plot.stageIndex],
            usedFertilizer: true
          };
          updatedPlots[index] = updatedPlot;
          setPlots(updatedPlots);
          setInventory(prev => ({ ...prev, fertilizer: prev.fertilizer - 1 }));
        }
      };
      
      // Виконуємо оптимістичне оновлення
      optimisticUpdate();
      
      const response = await apiClient.useFertilizer(index);
      
      if (response.data) {
        console.log('Підтвердження використання добрива з сервера:', {
          originalIndex: index,
          serverResponse: response.data
        });
        
        // Синхронізація з сервером через затримку
        setTimeout(() => {
          silentUpdateFarmData();
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('Помилка використання добрива:', error);
      
      // У разі помилки відкочуємо оптимістичне оновлення
      await silentUpdateFarmData();
      
      setTemporaryError(error.response?.data?.message || 'Помилка використання добрива');
    }
  };
  
  const handleUsePesticide = async (index: number) => {
    try {
      // Перевірка на невизначений індекс
      if (index === undefined) {
        console.error('Помилка: індекс грядки не визначено');
        setTemporaryError('Помилка доступу до грядки: індекс не визначено');
        return;
      }
      
      // Перевірка на валідний індекс
      if (index < 0 || index >= plots.length || !plots[index]) {
        setTemporaryError('Помилка доступу до грядки');
        return;
      }
      
      setError(null);
      
      if (inventory.pesticide <= 0) {
        setTemporaryError('Недостатньо пестицидів!');
        return;
      }
      
      const plot = plots[index];
      
      // Оптимістичне оновлення - видаляємо шкідників
      const optimisticUpdate = () => {
        const updatedPlots = [...plots];
        const updatedPlot = { ...plot };
        updatedPlot.hasPests = false;
        updatedPlots[index] = updatedPlot;
        setPlots(updatedPlots);
        setInventory(prev => ({ ...prev, pesticide: prev.pesticide - 1 }));
      };
      
      // Виконуємо оптимістичне оновлення
      optimisticUpdate();
      
      const response = await apiClient.usePesticide(index);
      
      if (response.data) {
        console.log('Підтвердження використання пестициду з сервера:', {
          originalIndex: index,
          serverResponse: response.data
        });
        
        // Синхронізація з сервером через затримку
        setTimeout(() => {
          silentUpdateFarmData();
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('Помилка використання пестициду:', error);
      
      // У разі помилки відкочуємо оптимістичне оновлення
      await silentUpdateFarmData();
      
      setTemporaryError(error.response?.data?.message || 'Помилка використання пестициду');
    }
  };
  
  const handleHarvestPlot = async (index: number) => {
    try {
      // Перевірка на невизначений індекс
      if (index === undefined) {
        console.error('Помилка: індекс грядки не визначено');
        setTemporaryError('Помилка доступу до грядки: індекс не визначено');
        return;
      }
      
      // Перевірка на валідний індекс
      if (index < 0 || index >= plots.length || !plots[index]) {
        setTemporaryError('Помилка доступу до грядки');
        return;
      }
      
      setError(null);
      
      const plot = plots[index];
      
      // Показуємо анімацію збору врожаю
      if (plot.plantType && plot.status === 'ready') {
        showHarvestAnimationWithPlant(plot.plantType);
      }
      
      // Оптимістичне оновлення - очищуємо грядку та додаємо врожай
      const optimisticUpdate = () => {
        const updatedPlots = [...plots];
        updatedPlots[index] = {
          index: index,
          status: 'empty' as const,
          hasPests: false
        };
        setPlots(updatedPlots);
        
        // Додаємо врожай до інвентаря (примірно)
        if (plot.plantType) {
          const harvestAmount = 1; // Базова кількість
          setInventory(prev => ({
            ...prev,
            [plot.plantType as string]: (prev[plot.plantType as keyof Inventory] as number || 0) + harvestAmount
          }));
          
          // Оновлюємо playerData
          if (playerData) {
            setPlayerData(prev => prev ? {
              ...prev,
              totalHarvest: prev.totalHarvest + harvestAmount,
              inventoryCount: prev.inventoryCount + harvestAmount,
              inventory: {
                ...prev.inventory,
                [plot.plantType as string]: (prev.inventory[plot.plantType as keyof Inventory] as number || 0) + harvestAmount
              }
            } : prev);
          }
        }
      };
      
      // Виконуємо оптимістичне оновлення
      optimisticUpdate();
      
      const response = await apiClient.harvestPlot(index);
      
      if (response.data) {
        // Синхронізація з сервером через затримку
        setTimeout(() => {
          silentUpdateFarmData();
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('Помилка збору врожаю:', error);
      
      // У разі помилки відкочуємо оптимістичне оновлення
      await silentUpdateFarmData();
      
      setTemporaryError(error.response?.data?.message || 'Помилка збору врожаю');
    }
  };
  
  /**
   * Обробляє видалення мертвої рослини з грядки
   */
  const handleClearDeadPlot = async (index: number) => {
    try {
      // Перевірка на невизначений індекс
      if (index === undefined) {
        console.error('Помилка: індекс грядки не визначено');
        setTemporaryError('Помилка доступу до грядки: індекс не визначено');
        return;
      }
      
      // Перевірка на валідний індекс
      if (index < 0 || index >= plots.length || !plots[index]) {
        setTemporaryError('Помилка доступу до грядки');
        return;
      }
      
      setError(null);
      
      // Оптимістичне оновлення - очищуємо грядку
      const optimisticUpdate = () => {
        const updatedPlots = [...plots];
        updatedPlots[index] = {
          index: index,
          status: 'empty' as const,
          hasPests: false
        };
        setPlots(updatedPlots);
        setTemporaryStatusMessage(t('plotCleared'));
      };
      
      // Виконуємо оптимістичне оновлення
      optimisticUpdate();
      
      const response = await apiClient.clearDeadPlot(index);
      
      if (response.data) {
        // Синхронізація з сервером через затримку
        setTimeout(() => {
          silentUpdateFarmData();
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('Помилка очищення грядки:', error);
      
      // У разі помилки відкочуємо оптимістичне оновлення
      await silentUpdateFarmData();
      
      setTemporaryError(error.response?.data?.message || 'Помилка очищення грядки');
    }
  };
  
  const handleRemovePlant = async (index: number) => {
    try {
      setError(null);
      
      // Оптимістичне оновлення - очищуємо грядку
      const optimisticUpdate = () => {
        const updatedPlots = [...plots];
        updatedPlots[index] = {
          index: index,
          status: 'empty' as const,
          hasPests: false
        };
        setPlots(updatedPlots);
        setTemporaryStatusMessage('Рослина видалена з грядки');
      };
      
      // Виконуємо оптимістичне оновлення
      optimisticUpdate();
      

      
      const response = await apiClient.removePlant(index);
      
      if (response.data) {
        // Синхронізація з сервером через затримку
        setTimeout(() => {
          silentUpdateFarmData();
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('Помилка видалення рослини:', error);
      
      // У разі помилки відкочуємо оптимістичне оновлення
      await silentUpdateFarmData();
      
      setTemporaryError(error.response?.data?.message || 'Помилка видалення рослини');
    }
  };
  
  const getPlantIcon = (plot: Plot) => {
    if (plot.status === 'empty') return null;
    if (plot.status === 'dead') return '💀';
    
    const icons: Record<string, string[]> = {
      cucumber: ['🌱', '🥒', '🥒', '🥒'],
      tomato: ['🌱', '🍅', '🍅', '🍅'],
      carrot: ['🌱', '🥕', '🥕', '🥕'],
      corn: ['🌱', '🌽', '🌽', '🌽']
    };
    
    if (plot.plantType && plot.stageIndex !== undefined) {
      return icons[plot.plantType][plot.stageIndex] || '🌱';
    } else if (plot.status === 'ready') {
      // Якщо рослина готова, показуємо зрілу рослину
      return plot.plantType ? icons[plot.plantType][3] : '🌱';
    }
    
    return '🌱';
  };
  
  // Відображення стану рослини
  const getPlotStatus = (plot: Plot) => {
    if (plot.status === 'empty') return t('empty');
    if (plot.status === 'dead') {
      if (plot.hasPests) return `${t('dead')} (${t('hasPests')})`;
      return t('dead');
    }
    if (plot.status === 'ready') return t('ready');
    
    // Якщо росте, показуємо поточну стадію
    if (plot.status === 'growing' && plot.stageIndex !== undefined) {
      const needsWater = plot.growthStages && 
                          plot.stageIndex !== undefined && 
                          plot.growthStages[plot.stageIndex]?.needsWater && 
                          !plot.growthStages[plot.stageIndex]?.wasWatered;
      
      const usedFertilizer = plot.growthStages && 
                             plot.stageIndex !== undefined && 
                             plot.growthStages[plot.stageIndex]?.usedFertilizer;
      
      let status = `${t('stage')} ${plot.stageIndex + 1}/4`;
      
      if (needsWater) {
        status += ` (${t('needsWater')})`;
      }
      
      return (
        <>
          {status}
          {usedFertilizer && <span key="fertilizer-icon" style={{ marginLeft: '2px' }}>🧪</span>}
          {plot.hasPests && <span key="pest-icon" style={{ marginLeft: '2px' }}>🐛</span>}
        </>
      );
    }
    
    return t('growing');
  };
  
  return (
    <Container>
      <FarmContainer>
        {plots.map((plot) => plot && (
          <PlotArea
            key={`plot-${plot.index}`}
            plot={{
              index: plot.index,
              plantType: plot.plantType as PlantType,
              plantedAt: plot.plantedAt,
              status: plot.status,
              hasPests: plot.hasPests,
              growthStages: plot.growthStages,
              stageIndex: plot.stageIndex,
              progress: plot.progress
            }}
            onPlotClick={handlePlotClick}
          />
        ))}
      </FarmContainer>
      
      <InventoryPanel>
        <InventoryItem>
          <ItemIcon>🌱</ItemIcon>
          <ItemCount>{inventory.seeds}</ItemCount>
        </InventoryItem>
        <InventoryItem>
          <ItemIcon>💧</ItemIcon>
          <ItemCount>{inventory.water}</ItemCount>
        </InventoryItem>
        <InventoryItem>
          <ItemIcon>🧪</ItemIcon>
          <ItemCount>{inventory.fertilizer}</ItemCount>
        </InventoryItem>
        <InventoryItem>
          <ItemIcon>🧴</ItemIcon>
          <ItemCount>{inventory.pesticide}</ItemCount>
        </InventoryItem>
      </InventoryPanel>
      
      {error && (
        <ErrorMessage onClick={() => setError(null)}>
          {error}
          <span style={{ 
            marginLeft: '10px', 
            fontSize: '0.8rem', 
            opacity: 0.7,
            cursor: 'pointer'
          }}>
            ✕
          </span>
        </ErrorMessage>
      )}
      
      {statusMessage && (
        <StatusMessage onClick={() => setStatusMessage(null)}>
          {statusMessage}
          <span style={{ 
            marginLeft: '10px', 
            fontSize: '0.8rem', 
            opacity: 0.7,
            cursor: 'pointer'
          }}>
            ✕
          </span>
        </StatusMessage>
      )}
      
      <ActionButtons>
        <ActionButton 
          isActive={activeMode === 'plant'} 
          onClick={() => {
            setActiveMode(activeMode === 'plant' ? null : 'plant');
            setStatusMessage(null);
            setError(null);
            // Очищаємо таймер статусних повідомлень
            if (statusMessageTimer) {
              clearTimeout(statusMessageTimer);
              setStatusMessageTimer(null);
            }
          }}
        >
          <ActionSvgIcon src="/icons/plant_a_plant.svg" alt="Plant" />
          <ActionLabel>{t('plant')}</ActionLabel>
        </ActionButton>
        <ActionButton 
          isActive={activeMode === 'water'} 
          onClick={() => {
            setActiveMode(activeMode === 'water' ? null : 'water');
            setStatusMessage(null);
            setError(null);
            // Очищаємо таймер статусних повідомлень
            if (statusMessageTimer) {
              clearTimeout(statusMessageTimer);
              setStatusMessageTimer(null);
            }
          }}
        >
          <ActionSvgIcon src="/icons/water_plant.svg" alt="Water" />
          <ActionLabel>{t('waterPlant')}</ActionLabel>
        </ActionButton>
        <ActionButton 
          isActive={activeMode === 'fertilize'} 
          onClick={() => {
            setActiveMode(activeMode === 'fertilize' ? null : 'fertilize');
            setStatusMessage(null);
            setError(null);
            // Очищаємо таймер статусних повідомлень
            if (statusMessageTimer) {
              clearTimeout(statusMessageTimer);
              setStatusMessageTimer(null);
            }
          }}
        >
          <ActionSvgIcon src="/icons/fertilizer.svg" alt="Fertilizer" />
          <ActionLabel>{t('fertilize')}</ActionLabel>
        </ActionButton>
        <ActionButton 
          isActive={activeMode === 'pesticide'} 
          onClick={() => {
            setActiveMode(activeMode === 'pesticide' ? null : 'pesticide');
            setStatusMessage(null);
            setError(null);
            // Очищаємо таймер статусних повідомлень
            if (statusMessageTimer) {
              clearTimeout(statusMessageTimer);
              setStatusMessageTimer(null);
            }
          }}
        >
          <ActionSvgIcon src="/icons/pesticide.svg" alt="Pesticide" />
          <ActionLabel>{t('pesticides')}</ActionLabel>
        </ActionButton>
      </ActionButtons>
      
      {showPlantModal && (
        <PlantSelectionModal>
          <ModalContent>
            <PlantOptions>
              <PlantOption key="cucumber-option" onClick={() => handlePlantSelected('cucumber')}>
                <PlantSeedIcon key="cucumber-icon" src="/icons/seeds_cucumber.png" alt="Cucumber Seeds" />
                <PlantInfo key="cucumber-info">
                  <span key="time-cucumber">{t('growthTime')}: 8 {t('hours')}</span>
                  <span key="water-cucumber">{t('watering')}: 4</span>
                </PlantInfo>
                <div key="cucumber-desc" style={{ fontSize: '0.7rem', color: '#666', marginTop: '5px' }}>
                  
                </div>
              </PlantOption>
              <PlantOption key="tomato-option" onClick={() => handlePlantSelected('tomato')}>
                <PlantSeedIcon key="tomato-icon" src="/icons/seeds_tomato.png" alt="Tomato Seeds" />
                <PlantInfo key="tomato-info">
                  <span key="time-tomato">{t('growthTime')}: 11 {t('hours')}</span>
                  <span key="water-tomato">{t('watering')}: 2</span>
                </PlantInfo>
                <div key="tomato-desc" style={{ fontSize: '0.7rem', color: '#666', marginTop: '5px' }}>
                  
                </div>
              </PlantOption>
              <PlantOption key="carrot-option" onClick={() => handlePlantSelected('carrot')}>
                <PlantSeedIcon key="carrot-icon" src="/icons/seeds_carrot.png" alt="Carrot Seeds" />
                <PlantInfo key="carrot-info">
                  <span key="time-carrot">{t('growthTime')}: 13 {t('hours')}</span>
                  <span key="water-carrot">{t('watering')}: 1</span>
                </PlantInfo>
                <div key="carrot-desc" style={{ fontSize: '0.7rem', color: '#666', marginTop: '5px' }}>
                  
                </div>
              </PlantOption>
              <PlantOption key="corn-option" onClick={() => handlePlantSelected('corn')}>
                <PlantSeedIcon key="corn-icon" src="/icons/seeds_corn.png" alt="Corn Seeds" />
                <PlantInfo key="corn-info">
                  <span key="time-corn">{t('growthTime')}: 10 {t('hours')}</span>
                  <span key="water-corn">{t('watering')}: 3</span>
                </PlantInfo>
                <div key="corn-desc" style={{ fontSize: '0.7rem', color: '#666', marginTop: '5px' }}>
                  
                </div>
              </PlantOption>
            </PlantOptions>
            <CloseButton onClick={() => setShowPlantModal(false)}>
              {t('close')}
            </CloseButton>
          </ModalContent>
        </PlantSelectionModal>
      )}
      

      
      {loading && (
        <LoadingOverlay>
          <div>{t('loading')}</div>
        </LoadingOverlay>
      )}

      {showHarvestAnimation && harvestPlantType && (
        <HarvestAnimationOverlay>
          <HarvestAnimationContainer>
            <HarvestIcon 
              src={getHarvestImagePath(harvestPlantType)} 
              alt={`Harvest ${harvestPlantType}`}
            />
            <HarvestText>
              {getPlantName(harvestPlantType)} {t('harvestCollectedAnimated')}
            </HarvestText>
          </HarvestAnimationContainer>
        </HarvestAnimationOverlay>
      )}

      {showPlantInfoModal && selectedPlantIndex !== null && (
        <PlantInfoModal onClick={closeInfoModal}>
          <InfoModalContent onClick={(e) => e.stopPropagation()}>
            {(() => {
              const plot = plots[selectedPlantIndex];
              if (!plot) return null;
              
              const plantName = getPlantName(plot.plantType);
              const stageText = plot.stageIndex !== undefined ? `${plot.stageIndex + 1}/4` : '?/4';
              const progress = plot.progress !== undefined ? `${plot.progress}%` : '0%';
              
              let statusInfo = '';
              if (plot.hasPests) {
                statusInfo = t('pestsStatus');
              } else if (plot.growthStages && 
                         plot.stageIndex !== undefined && 
                         plot.growthStages[plot.stageIndex]?.needsWater && 
                         !plot.growthStages[plot.stageIndex]?.wasWatered) {
                statusInfo = t('needsWaterStatus');
              }
              
              return (
                <>
                  <InfoModalTitle>{plantName}</InfoModalTitle>
                  <InfoModalText>{t('growthStage')}: {stageText}</InfoModalText>
                  <InfoModalText>{t('progress')}: {progress}</InfoModalText>
                  {statusInfo && (
                    <InfoModalText style={{ 
                      color: plot.hasPests ? '#ff6b6b' : '#ffa726', 
                      fontWeight: 'bold',
                      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
                    }}>
                      {statusInfo}
                    </InfoModalText>
                  )}
                  <InfoModalButtons>
                    <InfoModalButton onClick={closeInfoModal}>
                      {t('close')}
                    </InfoModalButton>
                    <InfoModalButton variant="danger" onClick={handleRemovePlantFromModal}>
                      {t('removePlant')}
                    </InfoModalButton>
                  </InfoModalButtons>
                </>
              );
            })()}
          </InfoModalContent>
        </PlantInfoModal>
      )}
    </Container>
  );
};

export default FarmPage; 
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { apiClient } from '../api/apiClient';
import { t, getLanguage, Language } from '../utils/localization';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// import backgroundMarket from '../assets/images/background_market.png';

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

// Тип для предметів ринку
interface MarketItem {
  _id: string;
  itemId: string;
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  priceHistory: { value: number; timestamp: string }[];
}

// Типи для предметів та овочів
type ResourceType = 'seeds' | 'water' | 'fertilizer' | 'pesticide';
type VegetableType = 'cucumber' | 'tomato' | 'carrot' | 'corn';

// Тип для NFT
interface NFTItem {
  id: string;
  name: string;
  icon: string;
  description: string;
}

// Головний контейнер на весь екран (як на фермі)
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
const MarketBackgroundContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-image: url('/foto/background_market.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  z-index: -1;
  
  /* Fallback градієнт на випадок, якщо зображення не завантажиться */
  background-color: linear-gradient(to bottom, rgb(182, 200, 181) 0%, #98FB98 100%);
`;

// Контейнер для контенту з прокруткою
const ScrollableContent = styled.div`
  position: relative; /* Змінюємо на relative */
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.5rem;
  padding-bottom: 80px; /* Місце для навігації */
  z-index: 1; /* Позитивний z-index */
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

const MarketStatusBar = styled.div`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 16px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  
  /* Додатковий ефект скла */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    border-radius: 16px;
    z-index: -1;
  }
`;

const StatusText = styled.div`
  font-size: 1rem;
  font-weight: 600;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  color: white;
`;

const ExpandButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`;

const InventoryExpandButton = styled.button`
  background: rgba(76, 175, 80, 0.8);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  
  &:hover {
    background: rgba(76, 175, 80, 0.9);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
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

const ButtonDescription = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  text-align: center;
`;

// Ненав'язливе повідомлення в статус барі
const StatusMessage = styled.div<{ type: 'success' | 'error' | 'info' }>`
  position: absolute;
  top: -2.5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  z-index: 100;
  animation: slideDown 0.3s ease-out;
  
  background: ${props => {
    if (props.type === 'success') return 'rgba(76, 175, 80, 0.9)';
    if (props.type === 'error') return 'rgba(244, 67, 54, 0.9)';
    return 'rgba(33, 150, 243, 0.9)';
  }};
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`;

// Нові компоненти для торгівлі
const TradingModeContainer = styled.div`
  display: flex;
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
  gap: 1px;
`;

const TradingModeButton = styled.button<{ isActive: boolean; mode: 'buy' | 'sell' }>`
  flex: 1;
  padding: 0.4rem;
  border: none;
  background: ${props => props.isActive 
    ? props.mode === 'buy' 
      ? '#4CAF50' 
      : '#F44336'
    : 'transparent'};
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  
  &:hover {
    background: ${props => props.isActive 
      ? props.mode === 'buy' 
        ? '#4CAF50' 
        : '#F44336'
      : 'rgba(255, 255, 255, 0.2)'};
  }
`;

const TradingTypeSelect = styled.select`
  width: 100%;
  padding: 0.4rem;
  margin-bottom: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  
  option {
    background: #2d3748;
    color: white;
  }
`;

const QuantitySelector = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
`;

const QuantityButton = styled.button`
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const QuantityDisplay = styled.div`
  flex: 1;
  text-align: center;
  padding: 0.4rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
`;

const MainTradingButton = styled.button<{ mode: 'buy' | 'sell' }>`
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  background: ${props => props.mode === 'buy' 
    ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' 
    : 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)'};
  color: white;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
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

const SectionTitle = styled.h2`
  color: #FFFFFF;
  font-size: 1.2rem;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 600;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
`;

const MarketGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const MarketCard = styled.div`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 0.75rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  
  /* Додатковий ефект скла */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    border-radius: 12px;
    z-index: -1;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
`;

const ItemTitle = styled.h3`
  color: #FFFFFF;
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
`;

const ItemIconLarge = styled.div`
  font-size: 2rem;
  background: transparent;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const PriceRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  gap: 0.2rem;
`;

const CurrentPrice = styled.div`
  color: #FFFFFF;
  font-size: 1.1rem;
  font-weight: 700;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
`;

const PriceChange = styled.div<{ isPositive: boolean }>`
  font-size: 0.7rem;
  color: ${props => props.isPositive ? '#4CAF50' : '#F44336'};
  background: transparent;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
`;

const Tab = styled.button<{ isActive: boolean }>`
  flex: 1;
  padding: 0.3rem;
  border: none;
  background: ${props => props.isActive ? '#4CAF50' : 'transparent'};
  color: #FFFFFF;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
  
  &:hover {
    background: ${props => props.isActive ? '#4CAF50' : 'rgba(255, 255, 255, 0.2)'};
  }
`;

const ChartContainer = styled.div`
  height: 80px;
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border-radius: 10px;
  padding: 0.4rem;
  position: relative;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  
  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.15);
  }
`;

const SimpleChart = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 6px;
  
  &:hover {
    transform: scale(1.03);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
    background: rgba(255, 255, 255, 0.05);
  }
  
  &:active {
    transform: scale(1.01);
  }
`;

const ChartLine = styled.svg`
  width: 100%;
  height: 100%;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
`;

const StatBox = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 0.4rem;
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #a0aec0;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const StatValue = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.4rem;
  margin-top: auto;
`;

const ActionButton = styled.button<{ variant: 'buy' | 'sell' }>`
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 36px;
  
  background: ${props => props.variant === 'buy' 
    ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' 
    : 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'};
  
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
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

const QuantityInput = styled.input`
  width: 45px;
  padding: 0.3rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-weight: bold;
  font-size: 0.8rem;
  margin-right: 0.4rem;
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

// Додаткові стилі для модального вікна
const ChartModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2001;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 20px;
  padding: 1.5rem;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  
  /* Додатковий ефект скла */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    border-radius: 20px;
    z-index: -1;
  }
  
  @media (max-width: 768px) {
    max-width: 95vw;
    padding: 1rem;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ModalItemIcon = styled.div`
  font-size: 2.5rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  
  /* Додатковий ефект скла */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
    border-radius: 16px;
    z-index: -1;
  }
`;

const ModalItemInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ModalItemName = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: white;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
`;

const ModalCurrentPrice = styled.div`
  font-size: 1.3rem;
  color: #4CAF50;
  font-weight: bold;
  margin-top: 0.25rem;
`;

const ModalPriceChange = styled.div<{ isPositive: boolean }>`
  font-size: 1rem;
  color: ${props => props.isPositive ? '#4CAF50' : '#f44336'};
  margin-top: 0.25rem;
`;

const CloseButton = styled.button`
  background: rgba(244, 67, 54, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: white;
  border: 1px solid rgba(244, 67, 54, 0.4);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(244, 67, 54, 0.2);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(244, 67, 54, 0.3);
    border-color: rgba(244, 67, 54, 0.6);
    transform: scale(1.1);
  }
`;

const ChartTabs = styled.div`
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const ChartTab = styled.button<{ active: boolean }>`
  padding: 0.75rem 1.5rem;
  border: none;
  background: ${props => props.active ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: white;
  cursor: pointer;
  border-bottom: 3px solid ${props => props.active ? '#4CAF50' : 'transparent'};
  border-left: ${props => props.active ? '1px solid rgba(76, 175, 80, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)'};
  border-right: ${props => props.active ? '1px solid rgba(76, 175, 80, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)'};
  border-top: ${props => props.active ? '1px solid rgba(76, 175, 80, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)'};
  font-weight: 600;
  transition: all 0.2s ease;
  border-radius: 8px 8px 0 0;
  
  &:hover {
    background: ${props => props.active ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.15)'};
  }
`;

const ChartWrapper = styled.div`
  height: 320px;
  margin-bottom: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 0.5rem;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  overflow: hidden;
`;

const StatisticsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 1rem;
  border-radius: 16px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
`;

// NFT картка (неактивна)
const NFTCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 0.75rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  opacity: 0.6;
  cursor: not-allowed;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 0.8;
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  /* Додатковий ефект скла */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
    border-radius: 12px;
    z-index: -1;
  }
  
  /* "Скоро доступно" індикатор */
  &::after {
    content: 'Coming Soon';
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: rgba(255, 152, 0, 0.8);
    color: white;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 0.6rem;
    font-weight: 600;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  }
`;

const NFTDescriptionArea = styled.div`
  height: 80px;
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border-radius: 10px;
  padding: 0.4rem;
  position: relative;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.08);
  }
`;

const NFTDescriptionText = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.7rem;
  text-align: center;
  line-height: 1.3;
  font-weight: 500;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
`;

const NFTIconSvg = styled.img`
  width: 32px;
  height: 32px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  opacity: 0.8;
`;

// Модальне вікно для NFT
const NFTModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2001;
  padding: 1rem;
`;

const NFTModalContent = styled.div`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 20px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  text-align: center;
  
  /* Додатковий ефект скла */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    border-radius: 20px;
    z-index: -1;
  }
`;

const NFTModalIcon = styled.img`
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
`;

const NFTModalTitle = styled.h2`
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  color: white;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
`;

const NFTModalDescription = styled.p`
  margin: 0 0 2rem 0;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
`;

const NFTModalCloseButton = styled.button`
  background: rgba(244, 67, 54, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: white;
  border: 1px solid rgba(244, 67, 54, 0.4);
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(244, 67, 54, 0.2);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(244, 67, 54, 0.3);
    border-color: rgba(244, 67, 54, 0.6);
    transform: translateY(-1px);
  }
`;

// Індикатор тихого оновлення
const RefreshIndicator = styled.div<{ isVisible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #4CAF50, #81C784, #4CAF50);
  background-size: 200% 100%;
  animation: ${props => props.isVisible ? 'shimmer 1.5s ease-in-out infinite' : 'none'};
  z-index: 2001;
  opacity: ${props => props.isVisible ? 1 : 0};
  transition: opacity 0.3s ease;
  
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;

const MarketPage: React.FC = () => {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [tradingModes, setTradingModes] = useState<Record<string, 'buy' | 'sell'>>({});
  const [tradingTypes, setTradingTypes] = useState<Record<string, 'market' | 'limit' | 'takeProfit'>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedChartItem, setSelectedChartItem] = useState<string | null>(null);
  const [chartModalData, setChartModalData] = useState<any>(null);
  const [modalActiveTab, setModalActiveTab] = useState<'overview' | 'stats'>('overview');
  const [modalLoading, setModalLoading] = useState(false);
  const [aggregationLevel, setAggregationLevel] = useState<number>(5);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null);

  // Дані NFT карток
  const nftItems: NFTItem[] = [
    {
      id: 'auto_landing',
      name: t('autoPlanting'),
      icon: '/icons/auto landing.svg',
      description: t('autoPlantingDesc')
    },
    {
      id: 'avto_irrigation',
      name: t('autoIrrigation'),
      icon: '/icons/avto_Irrigation.svg',
      description: t('autoIrrigationDesc')
    },
    {
      id: 'controller_pest',
      name: t('pestControl'),
      icon: '/icons/Controller_pest.svg',
      description: t('pestControlDesc')
    },
    {
      id: 'acceleration',
      name: t('acceleration'),
      icon: '/icons/acceleration.svg',
      description: t('accelerationDesc')
    },
    {
      id: 'auto_harvest',
      name: t('autoHarvest'),
      icon: '/icons/auto_harvest.svg',
      description: t('autoHarvestDesc')
    },
    {
      id: 'water_extraction',
      name: t('waterExtraction'),
      icon: '/icons/water extraction.svg',
      description: t('waterExtractionDesc')
    },
    {
      id: 'fertilizer_extraction',
      name: t('fertilizerExtraction'),
      icon: '/icons/fertilizer extraction.svg',
      description: t('fertilizerExtractionDesc')
    },
    {
      id: 'unlimited_storage',
      name: t('unlimitedStorage'),
      icon: '/icons/unlimited storage.svg',
      description: t('unlimitedStorageDesc')
    }
  ];
  

  
  // Завантаження даних гравця і ринку (з повноекранним лоадером)
  const loadData = async () => {
    try {
      setLoading(true);
      
      const [playerResponse, marketResponse] = await Promise.all([
        apiClient.getPlayerData(),
        apiClient.getMarketData()
      ]);
      
      if (playerResponse.data) {
        setPlayerData(playerResponse.data);
      }
      
      if (marketResponse.data) {
        setMarketItems(marketResponse.data);
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error('Помилка завантаження даних:', error);
      setMessage({
        text: error.response?.data?.message || 'Помилка завантаження даних',
        type: 'error'
      });
      setLoading(false);
    }
  };

  // Тихе оновлення даних без показу лоадера
  const silentRefreshData = async () => {
    try {
      setIsRefreshing(true);
      
      const [playerResponse, marketResponse] = await Promise.all([
        apiClient.getPlayerData(),
        apiClient.getMarketData()
      ]);
      
      if (playerResponse.data) {
        setPlayerData(playerResponse.data);
      }
      
      if (marketResponse.data) {
        setMarketItems(marketResponse.data);
      }
      
      // Невелика затримка для показу індикатора
      setTimeout(() => setIsRefreshing(false), 500);
    } catch (error: any) {
      console.error('Помилка тихого оновлення даних:', error);
      setIsRefreshing(false);
      // При помилці тихого оновлення не показуємо повідомлення, щоб не заважати користувачеві
    }
  };
  
  useEffect(() => {
    loadData(); // Перше завантаження з лоадером
    
    // Тихе оновлення даних кожні 60 секунд
    const interval = setInterval(() => {
      silentRefreshData(); // Використовуємо тихе оновлення
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Автоматичне зникнення повідомлень через 3 секунди
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  // Отримання ціни товару
  const getItemPrice = (itemId: string): number => {
    const item = marketItems.find(item => item.itemId === itemId);
    return item ? Math.round(item.currentPrice) : 0;
  };
  
  // Отримання відсоткової зміни ціни
  const getPriceChange = (itemId: string): { value: number; percentage: number } => {
    const item = marketItems.find(item => item.itemId === itemId);
    if (!item || !item.priceHistory || item.priceHistory.length < 2) {
      return { value: 0, percentage: 0 };
    }
    
    const currentPrice = item.currentPrice;
    const previousPrice = item.priceHistory[item.priceHistory.length - 2]?.value || currentPrice;
    const change = currentPrice - previousPrice;
    const percentage = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
    
    return { value: Number(change.toFixed(2)), percentage: Number(percentage.toFixed(2)) };
  };
  
  // Отримання статистики цін
  const getPriceStats = (itemId: string): { lowest: number; highest: number } => {
    const item = marketItems.find(item => item.itemId === itemId);
    if (!item || !item.priceHistory || item.priceHistory.length === 0) {
      return { lowest: 0, highest: 0 };
    }
    
    const prices = item.priceHistory.map(h => h.value);
    return {
      lowest: Math.round(Math.min(...prices)),
      highest: Math.round(Math.max(...prices))
    };
  };
  
  // Функція для агрегації даних (усереднення)
  const aggregateData = (priceHistory: any[], groupSize: number = 5) => {
    const aggregated = [];
    
    for (let i = 0; i < priceHistory.length; i += groupSize) {
      const group = priceHistory.slice(i, i + groupSize);
      if (group.length > 0) {
        const avgPrice = group.reduce((sum, entry) => sum + entry.value, 0) / group.length;
        const lastEntry = group[group.length - 1];
        
        aggregated.push({
          value: avgPrice,
          timestamp: lastEntry.timestamp
        });
      }
    }
    
    return aggregated;
  };
  
  // Функція для відкриття модального вікна з графіком
  const openChartModal = async (itemId: string) => {
    setSelectedChartItem(itemId);
    setModalLoading(true);
    
    try {
      const response = await apiClient.getItemPriceHistory(itemId);
      const data = response.data;
      
      // Використовуємо всі дані з агрегацією
      const aggregatedHistory = aggregateData(data.priceHistory, aggregationLevel);
      
      // Підготуємо дані для детального графіка
      const formattedData = aggregatedHistory.map((entry: any, index: number) => ({
        time: `${index + 1}`,
        price: Number(entry.value.toFixed(2)),
        timestamp: entry.timestamp,
        date: new Date(entry.timestamp).toLocaleDateString('uk-UA', { 
          day: '2-digit', 
          month: '2-digit'
        }),
        fullDate: new Date(entry.timestamp).toLocaleDateString('uk-UA', { 
          day: '2-digit', 
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }));
      
      setChartModalData({
        ...data,
        chartData: formattedData,
        aggregatedHistory
      });
    } catch (error) {
      console.error('Помилка завантаження детальної історії цін:', error);
    } finally {
      setModalLoading(false);
    }
  };
  
  // Функція для закриття модального вікна
  const closeChartModal = () => {
    setSelectedChartItem(null);
    setChartModalData(null);
    setModalActiveTab('overview');
  };

  // Функції для NFT модального вікна
  const openNFTModal = (nft: NFTItem) => {
    setSelectedNFT(nft);
  };

  const closeNFTModal = () => {
    setSelectedNFT(null);
  };
  
  // Оновлений createSimpleChart з обробником кліку
  const createSimpleChart = (itemId: string): React.ReactNode => {
    const item = marketItems.find(item => item.itemId === itemId);
    if (!item || !item.priceHistory || item.priceHistory.length < 2) {
      return (
        <div 
          style={{ 
            color: 'rgba(255,255,255,0.5)', 
            textAlign: 'center', 
            paddingTop: '20px', 
            fontSize: '0.7rem', 
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={() => openChartModal(itemId)}
        >
          Немає даних (натисніть для деталей)
        </div>
      );
    }
    
    const prices = item.priceHistory.slice(-25).map(h => h.value);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    
    // Створюємо більше точок для плавності
    const points = prices.map((price, index) => {
      const x = (index / (prices.length - 1)) * 100;
      const y = 100 - ((price - minPrice) / priceRange) * 100;
      return `${x},${y}`;
    }).join(' ');
    
    // Створюємо area fill для градієнта
    const areaPoints = `0,100 ${points} 100,100`;
    
    const change = getPriceChange(itemId);
    const lineColor = change.percentage >= 0 ? '#4CAF50' : '#F44336';
    const gradientId = `gradient-${itemId}`;
    
    return (
      <ChartLine 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
        onClick={() => openChartModal(itemId)}
        style={{ cursor: 'pointer' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.05"/>
          </linearGradient>
        </defs>
        
        {/* Заливка області під графіком */}
        <polygon
          fill={`url(#${gradientId})`}
          points={areaPoints}
          opacity="0.6"
        />
        
        {/* Основна лінія графіка */}
        <polyline
          fill="none"
          stroke={lineColor}
          strokeWidth="1.5"
          points={points}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
        
        {/* Тонка лінія підсвічування */}
        <polyline
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="0.5"
          points={points}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
      </ChartLine>
    );
  };
  
  // Функція для форматування ціни
  const formatPrice = (value: number) => `${value.toFixed(2)} KNL`;
  
  // Функція для розрахунку зміни ціни в модальному вікні
  const calculateModalPriceChange = (): { change: number; percentage: number } => {
    if (!chartModalData || chartModalData.priceHistory.length < 2) {
      return { change: 0, percentage: 0 };
    }
    
    const current = chartModalData.currentPrice;
    const previous = chartModalData.priceHistory[chartModalData.priceHistory.length - 2]?.value || current;
    const change = current - previous;
    const percentage = previous > 0 ? (change / previous) * 100 : 0;
    
    return { change, percentage };
  };
  
  // Купівля ресурсів
  const handleBuyResource = async (itemType: ResourceType) => {
    try {
      setMessage(null);
      
      const quantity = quantities[itemType] || 1;
      const response = await apiClient.buyMarketItem(itemType, quantity);
      
      if (response.data) {
        setPlayerData(prevData => ({
          ...prevData!,
          coins: response.data.player.coins,
          inventory: response.data.player.inventory,
          inventoryCount: response.data.player.inventoryCount,
          inventoryCapacity: response.data.player.inventoryCapacity
        }));
        
        setMarketItems(prevItems => 
          prevItems.map(item => 
            item.itemId === itemType ? response.data.marketItem : item
          )
        );
        
        setMessage({
          text: response.data.message || `Успішно придбано ${quantity} ${getItemName(itemType)}`,
          type: 'success'
        });
      }
    } catch (error: any) {
      console.error('Помилка купівлі ресурсу:', error);
      setMessage({
        text: error.response?.data?.message || 'Помилка купівлі ресурсу',
        type: 'error'
      });
    }
  };
  
  // Продаж овочів
  const handleSellVegetable = async (vegetableType: VegetableType) => {
    try {
      setMessage(null);
      
      const quantity = quantities[vegetableType] || 1;
      const response = await apiClient.sellMarketItem(vegetableType, quantity);
      
      if (response.data) {
        setPlayerData(prevData => ({
          ...prevData!,
          coins: response.data.coins,
          inventory: response.data.inventory,
          inventoryCount: response.data.inventoryCount,
          inventoryCapacity: response.data.inventoryCapacity
        }));
        
        setMarketItems(prevItems => 
          prevItems.map(item => 
            item.itemId === vegetableType ? response.data.marketItem : item
          )
        );
        
        setMessage({
          text: response.data.message || `Успішно продано ${quantity} ${getVegetableName(vegetableType)}`,
          type: 'success'
        });
      }
    } catch (error: any) {
      console.error('Помилка продажу овочів:', error);
      setMessage({
        text: error.response?.data?.message || 'Помилка продажу овочів',
        type: 'error'
      });
    }
  };
  
  // Купівля овочів
  const handleBuyVegetable = async (vegetableType: VegetableType) => {
    try {
      setMessage(null);
      
      const quantity = quantities[vegetableType] || 1;
      const totalCost = getItemPrice(vegetableType) * quantity;
      
      if (playerData!.coins < totalCost) {
        setMessage({
          text: 'Недостатньо монет для купівлі',
          type: 'error'
        });
        return;
      }
      
      if (playerData!.inventoryCount + quantity > playerData!.inventoryCapacity) {
        setMessage({
          text: 'Недостатньо місця на складі',
          type: 'error'
        });
        return;
      }
      
      const response = await apiClient.buyMarketItem(vegetableType, quantity);
      
      if (response.data) {
        setPlayerData(prevData => ({
          ...prevData!,
          coins: response.data.player.coins,
          inventory: response.data.player.inventory,
          inventoryCount: response.data.player.inventoryCount,
          inventoryCapacity: response.data.player.inventoryCapacity
        }));
        
        setMarketItems(prevItems => 
          prevItems.map(item => 
            item.itemId === vegetableType ? response.data.marketItem : item
          )
        );
        
        setMessage({
          text: `Успішно придбано ${quantity} ${getVegetableName(vegetableType)}`,
          type: 'success'
        });
      }
    } catch (error: any) {
      console.error('Помилка купівлі овочів:', error);
      setMessage({
        text: error.response?.data?.message || 'Помилка купівлі овочів',
        type: 'error'
      });
    }
  };
  
  // Розширення складу
  const handleExpandInventory = async () => {
    try {
      setMessage(null);
      
      const response = await apiClient.expandInventory();
      
      if (response.data) {
        setPlayerData(prevData => ({
          ...prevData!,
          coins: response.data.coins,
          inventoryCapacity: response.data.inventoryCapacity
        }));
        
        setMessage({
          text: response.data.message || t('warehouseExpanded'),
          type: 'success'
        });
      }
    } catch (error: any) {
      console.error('Помилка розширення складу:', error);
      setMessage({
        text: error.response?.data?.message || 'Помилка розширення складу',
        type: 'error'
      });
    }
  };
  


  // Ініціалізація станів для нових товарів
  const initializeItemStates = (itemId: string) => {
    if (!(itemId in tradingModes)) {
      setTradingModes(prev => ({ ...prev, [itemId]: 'buy' }));
    }
    if (!(itemId in tradingTypes)) {
      setTradingTypes(prev => ({ ...prev, [itemId]: 'market' }));
    }
    if (!(itemId in quantities)) {
      setQuantities(prev => ({ ...prev, [itemId]: 1 }));
    }
  };

  // Нові функції для торгівлі
  const setTradingMode = (itemId: string, mode: 'buy' | 'sell') => {
    setTradingModes(prev => ({ ...prev, [itemId]: mode }));
  };

  const setTradingType = (itemId: string, type: 'market' | 'limit' | 'takeProfit') => {
    setTradingTypes(prev => ({ ...prev, [itemId]: type }));
  };

  const adjustQuantity = (itemId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(1, (prev[itemId] || 1) + delta)
    }));
  };

  const handleTrade = async (itemId: string) => {
    const mode = tradingModes[itemId] || 'buy';
    const quantity = quantities[itemId] || 1;
    
    if (mode === 'buy') {
      if (['seeds', 'water', 'fertilizer', 'pesticide'].includes(itemId)) {
        await handleBuyResource(itemId as ResourceType);
      } else {
        await handleBuyVegetable(itemId as VegetableType);
      }
    } else {
      if (['cucumber', 'tomato', 'carrot', 'corn'].includes(itemId)) {
        await handleSellVegetable(itemId as VegetableType);
      }
    }
  };
  
  // Функції для назв та іконок
  const getItemName = (itemType: string): string => {
    const names: Record<string, string> = {
      seeds: t('seeds'),
      water: t('water'),
      fertilizer: t('fertilizer'),
      pesticide: t('pesticide')
    };
    return names[itemType] || itemType;
  };
  
  const getVegetableName = (vegetableType: string): string => {
    const names: Record<string, string> = {
      cucumber: t('cucumber'),
      tomato: t('tomato'),
      carrot: t('carrot'),
      corn: t('corn')
    };
    return names[vegetableType] || vegetableType;
  };
  
  const getItemIcon = (itemType: string): string => {
    const icons: Record<string, string> = {
      seeds: '🌱',
      water: '💧',
      fertilizer: '🧪',
      pesticide: '🧴',
      cucumber: '🥒',
      tomato: '🍅',
      carrot: '🥕',
      corn: '🌽'
    };
    return icons[itemType] || '📦';
  };
  
  if (!playerData) {
    return <div>{t('loading')}</div>;
  }
  
  return (
    <Container>
      {/* Індикатор тихого оновлення */}
      <RefreshIndicator isVisible={isRefreshing} />
      
      {/* Фоновий контейнер на весь екран */}
      <MarketBackgroundContainer />
      
      {/* Контент з прокруткою */}
      <ScrollableContent>
        <MarketStatusBar>
          {/* Ненав'язливе повідомлення в статус барі */}
          {message && (
            <StatusMessage type={message.type}>
              {message.text}
            </StatusMessage>
          )}
          
          <StatusText>{t('storageStatus')}: {playerData.inventoryCount} / {playerData.inventoryCapacity}</StatusText>
          <ExpandButtonContainer>
            <InventoryExpandButton 
              onClick={handleExpandInventory}
              disabled={playerData.coins < 10}
            >
              {t('expand')}
            </InventoryExpandButton>
            <ButtonDescription>{t('expandDescription')}</ButtonDescription>
          </ExpandButtonContainer>
        </MarketStatusBar>
      
      <SectionTitle>{t('buyResources')}</SectionTitle>
      <MarketGrid>
        {(['seeds', 'water', 'fertilizer', 'pesticide'] as ResourceType[]).map(itemType => {
          const price = getItemPrice(itemType);
          const change = getPriceChange(itemType);
          
          // Ініціалізація станів
          initializeItemStates(itemType);
          
          const currentMode = tradingModes[itemType] || 'buy';
          const currentType = tradingTypes[itemType] || 'market';
          const currentQuantity = quantities[itemType] || 1;
          
          return (
            <MarketCard key={itemType}>
              <CardHeader>
                <ItemTitle>{getItemName(itemType)}</ItemTitle>
                <ItemIconLarge>{getItemIcon(itemType)}</ItemIconLarge>
              </CardHeader>
              
              <PriceRow>
                <CurrentPrice>{price} KNL</CurrentPrice>
                <PriceChange isPositive={change.percentage >= 0}>
                  {change.percentage >= 0 ? '+' : ''}{change.value} ({change.percentage >= 0 ? '+' : ''}{change.percentage}%)
                </PriceChange>
              </PriceRow>
              
              <ChartContainer>
                <SimpleChart>{createSimpleChart(itemType)}</SimpleChart>
              </ChartContainer>
              
              <div style={{ color: 'white', fontSize: '0.75rem', marginBottom: '0.5rem', textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                {t('inStorage')}: {playerData.inventory[itemType]}
              </div>
              
              <TradingModeContainer>
                <TradingModeButton
                  isActive={currentMode === 'buy'}
                  mode="buy"
                  onClick={() => setTradingMode(itemType, 'buy')}
                >
                  {t('buy')}
                </TradingModeButton>
                <TradingModeButton
                  isActive={currentMode === 'sell'}
                  mode="sell"
                  onClick={() => setTradingMode(itemType, 'sell')}
                  disabled={true}
                >
                  {t('sell')}
                </TradingModeButton>
              </TradingModeContainer>
              
              <TradingTypeSelect
                value={currentType}
                onChange={(e) => setTradingType(itemType, e.target.value as 'market' | 'limit' | 'takeProfit')}
              >
                <option value="market">{t('marketOrder')}</option>
                <option value="limit">{t('limitOrder')}</option>
                <option value="takeProfit">{t('takeProfitOrder')}</option>
              </TradingTypeSelect>
              
              <QuantitySelector>
                <QuantityButton onClick={() => adjustQuantity(itemType, -1)}>-</QuantityButton>
                <QuantityDisplay>{currentQuantity}</QuantityDisplay>
                <QuantityButton onClick={() => adjustQuantity(itemType, 1)}>+</QuantityButton>
              </QuantitySelector>
              
              <MainTradingButton
                mode={currentMode}
                onClick={() => handleTrade(itemType)}
                disabled={currentMode === 'buy' && playerData.coins < price * currentQuantity}
              >
                {currentMode === 'buy' ? t('buy') : t('sell')}
              </MainTradingButton>
            </MarketCard>
          );
        })}
      </MarketGrid>
      
      <SectionTitle>{t('vegetableTrading')}</SectionTitle>
      <MarketGrid>
        {(['cucumber', 'tomato', 'carrot', 'corn'] as VegetableType[]).map(vegetableType => {
          const price = getItemPrice(vegetableType);
          const change = getPriceChange(vegetableType);
          
          // Ініціалізація станів
          initializeItemStates(vegetableType);
          
          const currentMode = tradingModes[vegetableType] || 'buy';
          const currentType = tradingTypes[vegetableType] || 'market';
          const currentQuantity = quantities[vegetableType] || 1;
          
          return (
            <MarketCard key={vegetableType}>
              <CardHeader>
                <ItemTitle>{getVegetableName(vegetableType)}</ItemTitle>
                <ItemIconLarge>{getItemIcon(vegetableType)}</ItemIconLarge>
              </CardHeader>
              
              <PriceRow>
                <CurrentPrice>{price} KNL</CurrentPrice>
                <PriceChange isPositive={change.percentage >= 0}>
                  {change.percentage >= 0 ? '+' : ''}{change.value} ({change.percentage >= 0 ? '+' : ''}{change.percentage}%)
                </PriceChange>
              </PriceRow>
              
              <ChartContainer>
                <SimpleChart>{createSimpleChart(vegetableType)}</SimpleChart>
              </ChartContainer>
              
              <div style={{ color: 'white', fontSize: '0.75rem', marginBottom: '0.5rem', textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                {t('inStorage')}: {playerData.inventory[vegetableType]}
              </div>
              
              <TradingModeContainer>
                <TradingModeButton
                  isActive={currentMode === 'buy'}
                  mode="buy"
                  onClick={() => setTradingMode(vegetableType, 'buy')}
                >
                  {t('buy')}
                </TradingModeButton>
                <TradingModeButton
                  isActive={currentMode === 'sell'}
                  mode="sell"
                  onClick={() => setTradingMode(vegetableType, 'sell')}
                >
                  {t('sell')}
                </TradingModeButton>
              </TradingModeContainer>
              
              <TradingTypeSelect
                value={currentType}
                onChange={(e) => setTradingType(vegetableType, e.target.value as 'market' | 'limit' | 'takeProfit')}
              >
                <option value="market">{t('marketOrder')}</option>
                <option value="limit">{t('limitOrder')}</option>
                <option value="takeProfit">{t('takeProfitOrder')}</option>
              </TradingTypeSelect>
              
              <QuantitySelector>
                <QuantityButton 
                  onClick={() => adjustQuantity(vegetableType, -1)}
                  disabled={currentQuantity <= 1}
                >
                  -
                </QuantityButton>
                <QuantityDisplay>{currentQuantity}</QuantityDisplay>
                <QuantityButton onClick={() => adjustQuantity(vegetableType, 1)}>+</QuantityButton>
              </QuantitySelector>
              
              <MainTradingButton
                mode={currentMode}
                onClick={() => handleTrade(vegetableType)}
                disabled={
                  currentMode === 'buy' 
                    ? playerData.coins < price * currentQuantity || playerData.inventoryCount + currentQuantity > playerData.inventoryCapacity
                    : playerData.inventory[vegetableType] < currentQuantity
                }
              >
                {currentMode === 'buy' ? t('buy') : t('sell')}
              </MainTradingButton>
            </MarketCard>
          );
        })}
      </MarketGrid>

              {/* Розділ торгівлі NFT */}
        <SectionTitle>{t('nftTrading')}</SectionTitle>
      <MarketGrid>
        {nftItems.map((nft) => (
          <NFTCard key={nft.id}>
            <CardHeader>
              <ItemTitle>{nft.name}</ItemTitle>
              <ItemIconLarge>
                <NFTIconSvg src={nft.icon} alt={nft.name} />
              </ItemIconLarge>
            </CardHeader>

            <PriceRow>
              <CurrentPrice>--- KNL</CurrentPrice>
              <PriceChange isPositive={false}>---%</PriceChange>
            </PriceRow>

            <NFTDescriptionArea onClick={() => openNFTModal(nft)}>
              <NFTDescriptionText>
                {nft.description.length > 80 
                  ? `${nft.description.substring(0, 80)}...` 
                  : nft.description
                }
              </NFTDescriptionText>
            </NFTDescriptionArea>

            <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem', marginBottom: '0.5rem', textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
              Власність: 0
            </div>

            <TradingModeContainer>
              <TradingModeButton isActive={false} mode="buy" disabled>
                {t('buy')}
              </TradingModeButton>
              <TradingModeButton isActive={false} mode="sell" disabled>
                {t('sell')}
              </TradingModeButton>
            </TradingModeContainer>

            <TradingTypeSelect disabled>
              <option>{t('marketOrder')}</option>
            </TradingTypeSelect>

            <QuantitySelector>
              <QuantityButton disabled>-</QuantityButton>
              <QuantityDisplay>0</QuantityDisplay>
              <QuantityButton disabled>+</QuantityButton>
            </QuantitySelector>

            <MainTradingButton mode="buy" disabled>
              {t('comingSoon')}
            </MainTradingButton>
          </NFTCard>
        ))}
      </MarketGrid>
      
      {loading && (
        <LoadingOverlay>
          <div>{t('loading')}</div>
        </LoadingOverlay>
      )}
      
      {/* Модальне вікно з детальним графіком */}
      {selectedChartItem && (
        <ChartModal onClick={closeChartModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <ModalItemIcon>{getItemIcon(selectedChartItem)}</ModalItemIcon>
                <ModalItemInfo>
                  <ModalItemName>
                    {(['seeds', 'water', 'fertilizer', 'pesticide'] as ResourceType[]).includes(selectedChartItem as ResourceType) 
                      ? getItemName(selectedChartItem) 
                      : getVegetableName(selectedChartItem)}
                  </ModalItemName>
                  {chartModalData && (
                    <>
                      <ModalCurrentPrice>{formatPrice(chartModalData.currentPrice)}</ModalCurrentPrice>
                      <ModalPriceChange isPositive={calculateModalPriceChange().percentage >= 0}>
                        {calculateModalPriceChange().percentage >= 0 ? '+' : ''}{calculateModalPriceChange().change.toFixed(2)} 
                        ({calculateModalPriceChange().percentage >= 0 ? '+' : ''}{calculateModalPriceChange().percentage.toFixed(2)}%)
                      </ModalPriceChange>
                    </>
                  )}
                </ModalItemInfo>
              </ModalTitle>
              <CloseButton onClick={closeChartModal}>×</CloseButton>
            </ModalHeader>
            
            <ChartTabs>
              <ChartTab 
                active={modalActiveTab === 'overview'}
                onClick={() => setModalActiveTab('overview')}
              >
                {t('overview')}
              </ChartTab>
              <ChartTab 
                active={modalActiveTab === 'stats'}
                onClick={() => setModalActiveTab('stats')}
              >
                {t('statistics')}
              </ChartTab>
            </ChartTabs>
            
            {chartModalData && modalActiveTab === 'overview' && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  marginBottom: '0.5rem',
                  textAlign: 'center'
                }}>
                  Показано {chartModalData.chartData.length} агрегованих періодів з {chartModalData.priceHistory.length} записів
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  {[1, 3, 5, 10].map(level => (
                    <button
                      key={level}
                      onClick={() => {
                        setAggregationLevel(level);
                        if (selectedChartItem) {
                          openChartModal(selectedChartItem);
                        }
                      }}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.7rem',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        background: aggregationLevel === level 
                          ? 'rgba(76, 175, 80, 0.3)' 
                          : 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        cursor: 'pointer',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {level === 1 ? 'Всі точки' : `По ${level}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {modalLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                Завантаження...
              </div>
            ) : chartModalData ? (
              <>
                {modalActiveTab === 'overview' ? (
                  <ChartWrapper>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={chartModalData.chartData}
                        margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
                      >
                        <CartesianGrid 
                          strokeDasharray="2 2" 
                          stroke="rgba(255, 255, 255, 0.1)" 
                          opacity={0.3}
                        />
                        <XAxis 
                          dataKey="time" 
                          stroke="rgba(255, 255, 255, 0.6)"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1 }}
                          interval="preserveStartEnd"
                          tick={{ fontSize: 10, fill: 'rgba(255, 255, 255, 0.6)' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(45, 55, 72, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '12px',
                            color: 'white',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                          }}
                          formatter={(value: any) => [`${value} KNL`, 'Ціна']}
                          labelFormatter={(label: any) => {
                            const dataPoint = chartModalData.chartData[Number(label) - 1];
                            return dataPoint ? `Період ${label} (${dataPoint.date})` : `Період ${label}`;
                          }}
                          cursor={{ 
                            stroke: 'rgba(255, 255, 255, 0.3)', 
                            strokeWidth: 1,
                            strokeDasharray: '3 3'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke={calculateModalPriceChange().percentage >= 0 ? '#4CAF50' : '#f44336'}
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ 
                            r: 5, 
                            stroke: '#ffffff', 
                            strokeWidth: 2,
                            fill: calculateModalPriceChange().percentage >= 0 ? '#4CAF50' : '#f44336'
                          }}
                          connectNulls={true}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartWrapper>
                ) : (
                  <StatisticsGrid>
                    <StatCard>
                      <StatLabel>Найнижча ціна</StatLabel>
                      <StatValue>{formatPrice(Math.min(...chartModalData.priceHistory.map((h: any) => h.value)))}</StatValue>
                    </StatCard>
                    <StatCard>
                      <StatLabel>Найвища ціна</StatLabel>
                      <StatValue>{formatPrice(Math.max(...chartModalData.priceHistory.map((h: any) => h.value)))}</StatValue>
                    </StatCard>
                    <StatCard>
                      <StatLabel>Середня ціна</StatLabel>
                      <StatValue>{formatPrice(chartModalData.priceHistory.reduce((sum: number, h: any) => sum + h.value, 0) / chartModalData.priceHistory.length)}</StatValue>
                    </StatCard>
                    <StatCard>
                      <StatLabel>Записів в історії</StatLabel>
                      <StatValue>{chartModalData.priceHistory.length}</StatValue>
                    </StatCard>
                  </StatisticsGrid>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                Помилка завантаження даних
              </div>
            )}
          </ModalContent>
        </ChartModal>
      )}

      {/* Модальне вікно для NFT */}
      {selectedNFT && (
        <NFTModal onClick={closeNFTModal}>
          <NFTModalContent onClick={(e) => e.stopPropagation()}>
            <NFTModalIcon src={selectedNFT.icon} alt={selectedNFT.name} />
            <NFTModalTitle>{selectedNFT.name}</NFTModalTitle>
            <NFTModalDescription>{selectedNFT.description}</NFTModalDescription>
            <NFTModalCloseButton onClick={closeNFTModal}>
              {t('close')}
            </NFTModalCloseButton>
          </NFTModalContent>
        </NFTModal>
      )}
      </ScrollableContent>
    </Container>
  );
};

export default MarketPage; 
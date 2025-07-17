import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '../api/apiClient';
import { t } from '../utils/localization';

interface PriceHistory {
  value: number;
  timestamp: string;
}

interface PriceData {
  itemId: string;
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  priceHistory: PriceHistory[];
  statistics: {
    lowestPrice: number;
    highestPrice: number;
    totalEntries: number;
  };
}

interface PriceChartProps {
  itemId: string;
  itemName: string;
  itemIcon: string;
  isVisible: boolean;
}

const ChartContainer = styled.div<{ isVisible: boolean }>`
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  color: white;
  display: ${props => props.isVisible ? 'block' : 'none'};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ItemInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ItemIcon = styled.div`
  font-size: 2rem;
`;

const ItemDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const ItemName = styled.h3`
  margin: 0;
  font-size: 1.5rem;
  color: white;
`;

const CurrentPrice = styled.div`
  font-size: 1.2rem;
  color: #4CAF50;
  font-weight: bold;
`;

const PriceChange = styled.div<{ isPositive: boolean }>`
  font-size: 0.9rem;
  color: ${props => props.isPositive ? '#4CAF50' : '#f44336'};
`;

const ChartTabs = styled.div`
  display: flex;
  margin-bottom: 1rem;
  border-bottom: 1px solid #4a5568;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  border: none;
  background: ${props => props.active ? '#4CAF50' : 'transparent'};
  color: white;
  cursor: pointer;
  border-bottom: 2px solid ${props => props.active ? '#4CAF50' : 'transparent'};
  
  &:hover {
    background: ${props => props.active ? '#4CAF50' : '#4a5568'};
  }
`;

const ChartWrapper = styled.div`
  height: 200px;
  margin-bottom: 1rem;
`;

const StatisticsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 0.8rem;
  border-radius: 8px;
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: #a0aec0;
  margin-bottom: 0.3rem;
`;

const StatValue = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
  color: white;
`;

const PriceChart: React.FC<PriceChartProps> = ({ itemId, itemName, itemIcon, isVisible }) => {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'stats'>('overview');
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (isVisible && !priceData) {
      loadPriceData();
    }
  }, [isVisible, itemId]);

  const loadPriceData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getItemPriceHistory(itemId);
      const data = response.data;
      setPriceData(data);
      
      // Підготуємо дані для графіка
      const formattedData = data.priceHistory
        .slice(-30) // Останні 30 записів
        .map((entry: PriceHistory, index: number) => ({
          time: `${index + 1}`,
          price: entry.value,
          timestamp: entry.timestamp
        }));
      
      setChartData(formattedData);
    } catch (error) {
      console.error('Помилка завантаження історії цін:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePriceChange = (): { change: number; percentage: number } => {
    if (!priceData || priceData.priceHistory.length < 2) {
      return { change: 0, percentage: 0 };
    }
    
    const current = priceData.currentPrice;
    const previous = priceData.priceHistory[priceData.priceHistory.length - 2]?.value || current;
    const change = current - previous;
    const percentage = previous > 0 ? (change / previous) * 100 : 0;
    
    return { change, percentage };
  };

  const formatPrice = (value: number) => `${value.toFixed(2)} KNL`;

  if (!isVisible) return null;

  if (loading) {
    return (
      <ChartContainer isVisible={true}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          {t('loading')}...
        </div>
      </ChartContainer>
    );
  }

  if (!priceData) {
    return (
      <ChartContainer isVisible={true}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Помилка завантаження даних
        </div>
      </ChartContainer>
    );
  }

  const { change, percentage } = calculatePriceChange();

  return (
    <ChartContainer isVisible={isVisible}>
      <ChartHeader>
        <ItemInfo>
          <ItemIcon>{itemIcon}</ItemIcon>
          <ItemDetails>
            <ItemName>{itemName}</ItemName>
            <CurrentPrice>{formatPrice(priceData.currentPrice)}</CurrentPrice>
            <PriceChange isPositive={change >= 0}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)} ({percentage >= 0 ? '+' : ''}{percentage.toFixed(2)}%)
            </PriceChange>
          </ItemDetails>
        </ItemInfo>
      </ChartHeader>

      <ChartTabs>
        <Tab active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
          {t('overview')}
        </Tab>
        <Tab active={activeTab === 'stats'} onClick={() => setActiveTab('stats')}>
          {t('stats')}
        </Tab>
      </ChartTabs>

      {activeTab === 'overview' && (
        <ChartWrapper>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
              <XAxis 
                dataKey="time" 
                stroke="#a0aec0"
                fontSize={12}
              />
              <YAxis 
                stroke="#a0aec0"
                fontSize={12}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#2d3748',
                  border: '1px solid #4a5568',
                  borderRadius: '8px',
                  color: 'white'
                }}
                formatter={(value: number) => [formatPrice(value), t('price')]}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#4CAF50" 
                strokeWidth={2}
                dot={{ fill: '#4CAF50', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#4CAF50', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}

      {activeTab === 'stats' && (
        <StatisticsGrid>
          <StatCard>
            <StatLabel>{t('lowestPrice')}</StatLabel>
            <StatValue>{formatPrice(priceData.statistics.lowestPrice)}</StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>{t('highestPrice')}</StatLabel>
            <StatValue>{formatPrice(priceData.statistics.highestPrice)}</StatValue>
          </StatCard>
        </StatisticsGrid>
      )}
    </ChartContainer>
  );
};

export default PriceChart; 
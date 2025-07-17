import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { apiClient, setCurrentUser, getCurrentUser } from '../api/apiClient';
import { t } from '../utils/localization';

interface News {
  _id: string;
  title: string;
  content: string;
  publishedAt: string;
}

interface LeaderboardItem {
  user_id: string;
  totalHarvest: number;
}

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
const HomeBackgroundContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-image: url('/foto/background_home.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  z-index: -1;
  
  /* Fallback градієнт на випадок, якщо зображення не завантажиться */
  background-color: linear-gradient(to bottom, rgb(46, 125, 50) 0%, #4CAF50 100%);
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
  margin: 0 auto;
  max-width: 100%;
  
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

const Header = styled.h1`
  text-align: center;
  color: #2E7D32;
  margin-bottom: 1rem;
  font-size: clamp(1.5rem, 4vw, 2rem);
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
`;

// Стилі для новин
const NewsSection = styled.section`
  margin-bottom: 1.5rem;
`;

const NewsNavigationContainer = styled.div`
  margin-bottom: 1rem;
`;

const NewsNavigation = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const NewsCounter = styled.div`
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
`;

const NavButton = styled.button`
  background: rgba(76, 175, 80, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
  
  &:hover {
    transform: scale(1.1);
    background: rgba(76, 175, 80, 0.4);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    background: rgba(189, 189, 189, 0.3);
    cursor: not-allowed;
    transform: none;
    opacity: 0.5;
  }
`;

const NewsIndicators = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const NewsIndicator = styled.div<{ active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.active ? '#4CAF50' : '#E0E0E0'};
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    background: ${props => props.active ? '#4CAF50' : '#BDBDBD'};
  }
`;

const NewsCard = styled.div`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  min-height: 160px;
  
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

const NewsHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const NewsIcon = styled.div`
  background: rgba(255, 215, 0, 0.3);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 215, 0, 0.5);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  margin-right: 0.75rem;
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.3);
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
`;

const NewsTitle = styled.h2`
  color: #FFFFFF;
  font-size: 1.1rem;
  font-weight: 600;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
`;

const NewsContent = styled.p`
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 1rem;
  line-height: 1.5;
  font-size: 0.95rem;
`;

const NewsDate = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8rem;
  font-style: italic;
  text-align: right;
`;

const PriceChange = styled.div<{ isPositive: boolean }>`
  background: ${props => props.isPositive ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 1.1rem;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  margin-bottom: 0.5rem;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
`;

const NewsSubtext = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
  font-style: italic;
`;

// Стилі для кнопок чату
const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ActionButton = styled.button`
  flex: 1;
  background: rgba(255, 152, 0, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  min-height: 48px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
  
  &:hover {
    transform: translateY(-2px);
    background: rgba(255, 152, 0, 0.4);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

// Стилі для лідерборду
const LeaderboardSection = styled.section`
  margin-bottom: 2rem;
`;

const SectionHeader = styled.h2`
  color: white;
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
`;

const LeaderboardCard = styled.div`
  background: transparent;
  border-radius: 16px;
  padding: 1rem;
`;

const LeaderboardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const LeaderboardItem = styled.div<{ position: number }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

const Position = styled.div<{ position: number }>`
  background: rgba(158, 158, 158, 0.8);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
`;

const PlayerName = styled.div`
  flex: 1;
  margin-left: 1rem;
  color: white;
  font-weight: 500;
  font-size: 0.95rem;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
`;

const Score = styled.div`
  font-weight: bold;
  color: white;
  font-size: 1rem;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
`;

const HomePage: React.FC = () => {
  const [news, setNews] = useState<News[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      setCurrentUser(userId);
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [newsResponse, leaderboardResponse] = await Promise.all([
        apiClient.getNews(),
        apiClient.getLeaderboard()
      ]);
      
      // Беремо останні 3 новини
      const latestNews = newsResponse.data.slice(0, 3);
      setNews(latestNews);
      setLeaderboard(leaderboardResponse.data);
    } catch (error) {
      console.error('Помилка завантаження даних:', error);
      setError('Не вдалося завантажити дані');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleChatClick = () => {
    // Логіка переходу в чат
    console.log('Перехід в чат');
  };

  const handleGroupClick = () => {
    // Логіка переходу в групу
    console.log('Перехід в групу');
  };

  const nextNews = () => {
    setCurrentNewsIndex((prev) => 
      prev < news.length - 1 ? prev + 1 : 0
    );
  };

  const prevNews = () => {
    setCurrentNewsIndex((prev) => 
      prev > 0 ? prev - 1 : news.length - 1
    );
  };

  const goToNews = (index: number) => {
    setCurrentNewsIndex(index);
  };

  if (loading) {
    return (
      <Container>
        <HomeBackgroundContainer />
        <ScrollableContent>
          <EmptyState>Завантаження...</EmptyState>
        </ScrollableContent>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <HomeBackgroundContainer />
        <ScrollableContent>
          <EmptyState>{error}</EmptyState>
        </ScrollableContent>
      </Container>
    );
  }

  const currentNews = news[currentNewsIndex];

  return (
    <Container>
      {/* Фоновий контейнер на весь екран */}
      <HomeBackgroundContainer />
      
      {/* Контент з прокруткою */}
      <ScrollableContent>

      
      <NewsSection>
        {news.length > 0 ? (
          <>
            {news.length > 1 && (
              <NewsNavigationContainer>
                <NewsNavigation>
                  <NavButton onClick={prevNews} disabled={news.length <= 1}>
                    ‹
                  </NavButton>
                  <NewsCounter>
                    {currentNewsIndex + 1} / {news.length}
                  </NewsCounter>
                  <NavButton onClick={nextNews} disabled={news.length <= 1}>
                    ›
                  </NavButton>
                </NewsNavigation>
                
                <NewsIndicators>
                  {news.map((_, index) => (
                    <NewsIndicator
                      key={index}
                      active={index === currentNewsIndex}
                      onClick={() => goToNews(index)}
                    />
                  ))}
                </NewsIndicators>
              </NewsNavigationContainer>
            )}
            
            {currentNews && (
              <NewsCard>
                <NewsHeader>
                  <NewsIcon>{currentNewsIndex + 1}</NewsIcon>
                  <NewsTitle>NEWS</NewsTitle>
                </NewsHeader>
                <NewsContent>{currentNews.content}</NewsContent>
                {currentNews.title.includes('+') && (
                  <PriceChange isPositive={true}>{currentNews.title}</PriceChange>
                )}
                {currentNews.title.includes('-') && (
                  <PriceChange isPositive={false}>{currentNews.title}</PriceChange>
                )}
                <NewsSubtext>
                  {currentNews.title.includes('carrot') && 'Ціни на моркву змінилися.'}
                  {currentNews.title.includes('tomato') && 'Ціни на помідори змінилися.'}
                  {currentNews.title.includes('cucumber') && 'Ціни на огірки змінилися.'}
                  {currentNews.title.includes('corn') && 'Ціни на кукурудзу змінилися.'}
                </NewsSubtext>
                <NewsDate>{formatDate(currentNews.publishedAt)}</NewsDate>
              </NewsCard>
            )}
          </>
        ) : (
          <EmptyState>Новин поки немає</EmptyState>
        )}
      </NewsSection>

      <ButtonGroup>
        <ActionButton onClick={handleChatClick}>CHAT</ActionButton>
        <ActionButton onClick={handleGroupClick}>GROUP</ActionButton>
      </ButtonGroup>

      <LeaderboardSection>
        <SectionHeader>LEADERBOARD</SectionHeader>
        <LeaderboardCard>
          <LeaderboardList>
            {leaderboard.length > 0 ? (
              leaderboard.slice(0, 5).map((item, index) => (
                <LeaderboardItem key={item.user_id} position={index + 1}>
                  <Position position={index + 1}>{index + 1}</Position>
                  <PlayerName>{item.user_id}</PlayerName>
                  <Score>{item.totalHarvest}</Score>
                </LeaderboardItem>
              ))
            ) : (
              <EmptyState>Лідерборд порожній</EmptyState>
            )}
          </LeaderboardList>
        </LeaderboardCard>
      </LeaderboardSection>
      </ScrollableContent>
    </Container>
  );
};

export default HomePage; 
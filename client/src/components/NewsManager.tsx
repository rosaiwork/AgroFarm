import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { apiClient } from '../api/apiClient';

interface News {
  _id: string;
  title: string;
  content: string;
  priceChange: number;
  affectedItems: string[];
  isPublished: boolean;
  isApplied: boolean;
  publishedAt?: string;
  appliedAt?: string;
  createdAt: string;
}

interface NewsManagerProps {
  onClose: () => void;
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 1rem;
`;

const Title = styled.h2`
  margin: 0;
  color: #2E7D32;
  font-size: 1.5rem;
`;

const CloseButton = styled.button`
  background: #f44336;
  color: white;
  border: none;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #d32f2f;
  }
`;

const NewsGrid = styled.div`
  display: grid;
  gap: 1rem;
  max-height: 60vh;
  overflow-y: auto;
`;

const NewsCard = styled.div<{ priceChange: number }>`
  border: 2px solid ${props => props.priceChange > 0 ? '#4CAF50' : '#f44336'};
  border-radius: 8px;
  padding: 1rem;
  background: ${props => props.priceChange > 0 ? '#e8f5e9' : '#ffebee'};
  position: relative;
`;

const NewsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const NewsTitle = styled.h3`
  margin: 0;
  color: #333;
  font-size: 1rem;
`;

const PriceChangeBadge = styled.span<{ positive: boolean }>`
  background: ${props => props.positive ? '#4CAF50' : '#f44336'};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
`;

const NewsContent = styled.p`
  margin: 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const NewsInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin: 0.5rem 0;
  font-size: 0.8rem;
  color: #777;
`;

const AffectedItems = styled.div`
  margin: 0.5rem 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
`;

const ItemBadge = styled.span`
  background: #2196F3;
  color: white;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
`;

const StatusBadges = styled.div`
  display: flex;
  gap: 0.5rem;
  margin: 0.5rem 0;
`;

const StatusBadge = styled.span<{ active: boolean }>`
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: bold;
  background: ${props => props.active ? '#4CAF50' : '#e0e0e0'};
  color: ${props => props.active ? 'white' : '#666'};
`;

const DeleteButton = styled.button`
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  margin-right: 0.5rem;
  
  &:hover {
    background: #d32f2f;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PublishButton = styled.button`
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  
  &:hover {
    background: #45a049;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
`;

const NewsManager: React.FC<NewsManagerProps> = ({ onClose }) => {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAllAdminNews();
      setNews(response.data.news || []);
    } catch (error) {
      console.error('Помилка завантаження новин:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNews = async (newsId: string) => {
    try {
      setDeleting(newsId);
      await apiClient.deleteNews(newsId);
      setNews(prevNews => prevNews.filter(item => item._id !== newsId));
    } catch (error) {
      console.error('Помилка видалення новини:', error);
      alert('Помилка при видаленні новини');
    } finally {
      setDeleting(null);
    }
  };

  const handlePublishNews = async (newsItem: News) => {
    try {
      setPublishing(newsItem._id);
      // Використовуємо існуючий API для застосування новини негайно
      await apiClient.applyNewsImmediately(
        newsItem.content, 
        newsItem.priceChange, 
        newsItem.affectedItems
      );
      
      // Оновлюємо стан новини в списку
      setNews(prevNews => 
        prevNews.map(item => 
          item._id === newsItem._id 
            ? { ...item, isApplied: true, appliedAt: new Date().toISOString() }
            : item
        )
      );
    } catch (error: any) {
      console.error('Помилка публікації новини:', error);
      alert(error.response?.data?.message || 'Помилка при публікації новини');
    } finally {
      setPublishing(null);
    }
  };

  const getVegetableName = (item: string) => {
    const names: Record<string, string> = {
      cucumber: 'Огірок',
      tomato: 'Помідор',
      carrot: 'Морква',
      corn: 'Кукурудза',
      seeds: 'Насіння',
      water: 'Вода',
      fertilizer: 'Добрива',
      pesticide: 'Пестициди'
    };
    return names[item] || item;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('uk-UA');
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Управління новинами ({news.length})</Title>
          <CloseButton onClick={onClose}>×</CloseButton>
        </Header>

        {loading ? (
          <LoadingMessage>Завантаження новин...</LoadingMessage>
        ) : news.length === 0 ? (
          <EmptyMessage>Новин поки що немає</EmptyMessage>
        ) : (
          <NewsGrid>
            {news.map((item) => (
              <NewsCard key={item._id} priceChange={item.priceChange}>
                <NewsHeader>
                  <NewsTitle>{item.title}</NewsTitle>
                  <PriceChangeBadge positive={item.priceChange > 0}>
                    {item.priceChange > 0 ? '+' : ''}{item.priceChange}%
                  </PriceChangeBadge>
                </NewsHeader>

                <NewsContent>{item.content}</NewsContent>

                <AffectedItems>
                  <strong>Вплив на:</strong>
                  {item.affectedItems.map((affectedItem, index) => (
                    <ItemBadge key={index}>
                      {getVegetableName(affectedItem)}
                    </ItemBadge>
                  ))}
                </AffectedItems>

                <StatusBadges>
                  <StatusBadge active={item.isPublished}>
                    {item.isPublished ? 'Опубліковано' : 'Не опубліковано'}
                  </StatusBadge>
                  <StatusBadge active={item.isApplied}>
                    {item.isApplied ? 'Застосовано' : 'Не застосовано'}
                  </StatusBadge>
                </StatusBadges>

                <NewsInfo>
                  <div>Створено: {formatDate(item.createdAt)}</div>
                  {item.publishedAt && (
                    <div>Опубліковано: {formatDate(item.publishedAt)}</div>
                  )}
                  {item.appliedAt && (
                    <div>Застосовано: {formatDate(item.appliedAt)}</div>
                  )}
                </NewsInfo>

                <ButtonGroup>
                  {!item.isApplied && (
                    <PublishButton
                      onClick={() => handlePublishNews(item)}
                      disabled={publishing === item._id}
                    >
                      {publishing === item._id ? 'Публікація...' : '⚡ Опублікувати негайно'}
                    </PublishButton>
                  )}
                  <DeleteButton
                    onClick={() => handleDeleteNews(item._id)}
                    disabled={deleting === item._id}
                  >
                    {deleting === item._id ? 'Видалення...' : '🗑️ Видалити'}
                  </DeleteButton>
                </ButtonGroup>
              </NewsCard>
            ))}
          </NewsGrid>
        )}
      </Modal>
    </Overlay>
  );
};

export default NewsManager; 
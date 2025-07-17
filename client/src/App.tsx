import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import MainLayout from './components/layouts/MainLayout';
import HomePage from './pages/HomePage';
import FarmPage from './pages/FarmPage';
import MarketPage from './pages/MarketPage';
import FinancePage from './pages/FinancePage';
import AdminPage from './pages/AdminPage';
import TonConnectProvider from './providers/TonConnectProvider';
import { initializeLanguage } from './utils/localization';
import './App.css';

// Функція для перевірки мобільного пристрою
const isMobileDevice = () => {
  try {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  } catch (error) {
    console.error('Помилка перевірки мобільного пристрою:', error);
    return false;
  }
};

// Функція для перевірки підтримки localStorage
const isLocalStorageAvailable = () => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, 'test');
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    console.error('localStorage недоступний:', error);
    return false;
  }
};

// Функція для безпечного отримання userId
const getSafeUserId = () => {
  if (!isLocalStorageAvailable()) {
    return '';
  }
  try {
    return localStorage.getItem('userId') || '';
  } catch (error) {
    console.error('Помилка отримання userId:', error);
    return '';
  }
};

// Функція для безпечного збереження userId
const setSafeUserId = (userId: string) => {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage недоступний, userId не буде збережено');
    return false;
  }
  try {
    localStorage.setItem('userId', userId);
    return true;
  } catch (error) {
    console.error('Помилка збереження userId:', error);
    return false;
  }
};

function App() {
  const [userId, setUserId] = useState(getSafeUserId());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ініціалізуємо локалізацію при завантаженні
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Ініціалізуємо локалізацію
        initializeLanguage();
        
        // Логіруємо інформацію про пристрій для дебагу
        console.log('Device info:', {
          isMobile: isMobileDevice(),
          userAgent: navigator.userAgent,
          localStorageAvailable: isLocalStorageAvailable(),
          userId: getSafeUserId()
        });
        
        setIsLoading(false);
      } catch (err) {
        console.error('Помилка ініціалізації додатку:', err);
        setError('Помилка завантаження. Спробуйте перезавантажити сторінку.');
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);
  
  const handleUserIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId.trim()) {
      const success = setSafeUserId(userId);
      if (success) {
        window.location.reload();
      } else {
        setError('Не вдалося зберегти дані. Спробуйте ще раз.');
      }
    }
  };
  
  // Показуємо завантаження
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#4CAF50',
        color: 'white',
        flexDirection: 'column'
      }}>
        <h2>Завантаження...</h2>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255,255,255,0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Показуємо помилку
  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f44336',
        color: 'white',
        flexDirection: 'column',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2>Виникла помилка</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            backgroundColor: 'white',
            color: '#f44336',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Перезавантажити
        </button>
      </div>
    );
  }
  
  // Тимчасова сторінка для введення тестового userID
  if (!getSafeUserId()) {
    return (
      <div className="login-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#4CAF50',
        color: 'white',
        flexDirection: 'column',
        padding: '20px'
      }}>
        <h1>Фермерська гра</h1>
        <p>Введіть ваш тестовий ID для входу в гру</p>
        {!isLocalStorageAvailable() && (
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            ⚠️ localStorage недоступний. Прогрес може не зберігатися.
          </div>
        )}
        <form onSubmit={handleUserIdSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          width: '100%',
          maxWidth: '300px'
        }}>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Введіть ваш ID"
            style={{
              padding: '10px',
              borderRadius: '5px',
              border: 'none',
              fontSize: '16px'
            }}
          />
          <button type="submit" style={{
            padding: '10px',
            backgroundColor: 'white',
            color: '#4CAF50',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            Увійти
          </button>
        </form>
      </div>
    );
  }
  
  return (
    <TonConnectProvider>
      <Provider store={store}>
        <Router>
          <Routes>
            <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
            <Route path="/farm" element={<MainLayout><FarmPage /></MainLayout>} />
            <Route path="/market" element={<MainLayout><MarketPage /></MainLayout>} />
            <Route path="/finance" element={<MainLayout><FinancePage /></MainLayout>} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </Router>
      </Provider>
    </TonConnectProvider>
  );
}

export default App;

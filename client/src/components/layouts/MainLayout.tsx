import React, { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { t, getLanguage, Language } from '../../utils/localization';

interface MainLayoutProps {
  children: ReactNode;
}

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(to bottom, #87CEEB 0%, #98FB98 100%);
  position: relative;
  overflow-x: hidden;
`;

const Content = styled.main`
  flex: 1;
  padding: 0.5rem;
  padding-bottom: 90px; /* Збільшено місце для навігації */
  overflow-y: auto;
  overflow-x: hidden;
  /* Покращення скролу на мобільних */
  -webkit-overflow-scrolling: touch;
  /* Заборона горизонтального скролу */
  max-width: 100vw;
`;

const Navigation = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-around;
  padding: 0.6rem 0.3rem;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  /* Заборона скролу навігації */
  overflow: hidden;
  height: 70px;
  
  /* Додатковий ефект скла */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    z-index: -1;
  }
`;

const NavItem = styled(Link)<{ isActive: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  padding: 0.6rem;
  border-radius: 12px;
  transition: all 0.2s ease;
  min-width: 50px;
  /* Мінімальний розмір для тач-взаємодії */
  min-height: 50px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  ${props => props.isActive && `
    background-color: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
  `}
`;

const NavIcon = styled.img<{ isActive: boolean }>`
  width: 40px;
  height: 40px;
  filter: ${props => props.isActive 
    ? 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%) drop-shadow(0 2px 4px rgba(0,0,0,0.3))' 
    : 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(70%) contrast(100%)'};
  transform: ${props => props.isActive ? 'scale(1.1)' : 'scale(1)'};
  transition: all 0.2s ease;
`;



const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(getLanguage());
  
  // Оновлюємо мову при зміні сторінки
  useEffect(() => {
    setCurrentLanguage(getLanguage());
  }, [location.pathname]);
  
  // Заборона зуму при подвійному тапі
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);
  
  return (
    <LayoutContainer>
      <Content>{children}</Content>
      
      <Navigation>
        <NavItem to="/" isActive={location.pathname === '/'}>
          <NavIcon 
            src="/icons/home.svg" 
            alt="Home" 
            isActive={location.pathname === '/'} 
          />
        </NavItem>
        <NavItem to="/farm" isActive={location.pathname === '/farm'}>
          <NavIcon 
            src="/icons/farm.svg" 
            alt="Farm" 
            isActive={location.pathname === '/farm'} 
          />
        </NavItem>
        <NavItem to="/market" isActive={location.pathname === '/market'}>
          <NavIcon 
            src="/icons/market.svg" 
            alt="Market" 
            isActive={location.pathname === '/market'} 
          />
        </NavItem>
        <NavItem to="/finance" isActive={location.pathname === '/finance'}>
          <NavIcon 
            src="/icons/finance.svg" 
            alt="Finance" 
            isActive={location.pathname === '/finance'} 
          />
        </NavItem>
      </Navigation>
    </LayoutContainer>
  );
};

export default MainLayout; 
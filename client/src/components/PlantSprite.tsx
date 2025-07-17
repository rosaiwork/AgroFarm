import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { PLANT_SPRITES, PLANT_POSITIONS, PlantType } from '../config/farmConfig';
import { t } from '../utils/localization';

interface PlantSpriteProps {
  plantType: PlantType;
  stage: number;
  isReady?: boolean;
  isDead?: boolean;
  hasPests?: boolean;
  needsWater?: boolean;
  spriteIndex: number; // 0, 1, або 2 (для трьох рослин на грядці)
  plotIndex: number;
  onClick?: () => void;
}

// Анімація для шкідників
const wiggle = keyframes`
  0% { transform: rotate(-2deg) scale(1); }
  50% { transform: rotate(2deg) scale(1.05); }
  100% { transform: rotate(-2deg) scale(1); }
`;

// Анімація росту
const growIn = keyframes`
  0% { 
    transform: scale(0) translateY(20px);
    opacity: 0;
  }
  100% { 
    transform: scale(1) translateY(0);
    opacity: 1;
  }
`;

// Анімація готовності до збору
const readyPulse = keyframes`
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.2) drop-shadow(0 0 10px rgba(255, 215, 0, 0.6)); }
`;

const SpriteContainer = styled.div<{
  x: number;
  y: number;
  scale: number;
  zIndex: number;
  isReady: boolean;
  hasPests: boolean;
}>`
  position: absolute;
  left: ${props => props.x}%;
  top: ${props => props.y}%;
  transform: translate(-50%, -100%) scale(${props => props.scale});
  transform-origin: bottom center;
  z-index: ${props => props.zIndex};
  cursor: pointer;
  transition: all 0.3s ease;
  animation: ${growIn} 0.5s ease-out;
  
  ${props => props.isReady && css`
    animation: ${readyPulse} 2s infinite ease-in-out;
  `}
  

  
  &:hover {
    transform: translate(-50%, -100%) scale(${props => props.scale * 1.1});
    filter: brightness(1.1);
  }
  
  &:active {
    transform: translate(-50%, -100%) scale(${props => props.scale * 0.95});
  }
`;

const PlantImage = styled.img`
  width: auto;
  height: 60px; // Базовий розмір, буде масштабований через scale
  max-width: none;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  pointer-events: none;
`;

const PestOverlay = styled.div`
  position: absolute;
  top: 40px;
  left: 20px;
  width: 25px;
  height: 25px;
  z-index: 11;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
  ${css`animation: ${wiggle} 0.8s infinite ease-in-out;`}
`;

const PestIcon = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

// Анімація для індикатора поливу
const waterPulse = keyframes`
  0%, 100% { 
    transform: scale(1); 
    opacity: 1; 
  }
  50% { 
    transform: scale(1.6); 
    opacity: 1; 
  }
`;

const WaterIndicator = styled.div`
  position: absolute;
  bottom: -12px;
  right: 10px;
  width: 20px;
  height: 20px;
  ${css`animation: ${waterPulse} 3.1s infinite ease-in-out;`}
  z-index: 11;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
`;

const WaterIcon = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const PlantSprite: React.FC<PlantSpriteProps> = ({
  plantType,
  stage,
  isReady = false,
  isDead = false,
  hasPests = false,
  needsWater = false,
  spriteIndex,
  plotIndex,
  onClick
}) => {
  // Отримуємо спрайт на основі стану рослини
  const getSprite = (): string => {
    const sprites = PLANT_SPRITES[plantType];
    
    if (isDead) {
      return sprites.dead;
    }
    
    // Якщо рослина готова до збору, завжди показуємо stage4-1.png
    if (isReady) {
      return sprites.stage4Ready;
    }
    
    switch (stage) {
      case 1: return sprites.stage1;
      case 2: return sprites.stage2;
      case 3: return sprites.stage3;
      case 4: return sprites.stage4;
      default: return sprites.stage1;
    }
  };

  // Отримуємо позицію рослини
  const position = PLANT_POSITIONS[plantType][spriteIndex];
  
  if (!position) {
    console.warn(`No position found for plant ${plantType} sprite ${spriteIndex}`);
    return null;
  }

  return (
    <SpriteContainer
      x={position.x}
      y={position.y}
      scale={position.scale}
      zIndex={position.zIndex}
      isReady={isReady && stage === 4}
      hasPests={hasPests}
      onClick={onClick}
    >
      <PlantImage
        src={getSprite()}
        alt={`${plantType} stage ${stage}`}
        draggable={false}
      />
      {hasPests && (
        <PestOverlay>
          <PestIcon 
            src="/foto/pest.png" 
                          alt={t('pestsAlt')}
            draggable={false}
          />
        </PestOverlay>
      )}
      {needsWater && !isDead && (
        <WaterIndicator>
          <WaterIcon 
            src="/foto/water.png" 
            alt={t('needsWaterAlt')}
            draggable={false}
          />
        </WaterIndicator>
      )}
    </SpriteContainer>
  );
};

export default PlantSprite; 
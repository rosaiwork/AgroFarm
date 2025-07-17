import React from 'react';
import styled from 'styled-components';
import PlantSprite from './PlantSprite';
import { PLOT_POSITIONS, PlantType } from '../config/farmConfig';

interface Plot {
  index: number;
  plantType?: PlantType;
  plantedAt?: string;
  status: 'empty' | 'growing' | 'ready' | 'dead';
  hasPests: boolean;
  needsWater?: boolean;
  growthStages?: any[];
  stageIndex?: number;
  progress?: number;
}

interface PlotAreaProps {
  plot: Plot;
  onPlotClick: (plotIndex: number) => void;
}

const PlotContainer = styled.div<{
  x: number;
  y: number;
  width: number;
  height: number;
}>`
  position: absolute;
  left: ${props => props.x}%;
  top: ${props => props.y}%;
  width: ${props => props.width}%;
  height: ${props => props.height}%;
  cursor: pointer;
  z-index: 1;
`;

// Невидима зона для кліків
const ClickArea = styled.div<{ plotIndex: number }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  z-index: 1;
`;

const PlotArea: React.FC<PlotAreaProps> = React.memo(({ plot, onPlotClick }) => {
  const plotPosition = PLOT_POSITIONS[plot.index];
  
  if (!plotPosition) {
    console.warn(`No position found for plot ${plot.index}`);
    return null;
  }

  const handleClick = () => {
    onPlotClick(plot.index);
  };

  // Визначаємо стадію рослини
  const getCurrentStage = (): number => {
    if (plot.status === 'empty' || !plot.growthStages) return 0;
    
    // Якщо рослина готова до збору, завжди відображаємо 4-ту стадію
    if (plot.status === 'ready') return 4;
    
    return (plot.stageIndex || 0) + 1;
  };

  const isReady = plot.status === 'ready';
  const isDead = plot.status === 'dead';
  const currentStage = getCurrentStage();
  
  // Визначаємо чи потребує рослина поливу
  const needsWater = plot.growthStages &&
    plot.stageIndex !== undefined &&
    plot.growthStages[plot.stageIndex]?.needsWater &&
    !plot.growthStages[plot.stageIndex]?.wasWatered &&
    plot.status !== 'ready' &&
    plot.status !== 'dead';

  return (
    <PlotContainer
      x={plotPosition.x}
      y={plotPosition.y}
      width={plotPosition.width}
      height={plotPosition.height}
    >
      <ClickArea plotIndex={plot.index} onClick={handleClick} />
      
      {/* Рендеримо спрайти рослин, якщо грядка не порожня */}
      {plot.plantType && plot.status !== 'empty' && (
        <>
          {/* Три спрайти для кожної грядки */}
          {[0, 1, 2].map((spriteIndex) => (
            <PlantSprite
              key={`${plot.index}-${spriteIndex}`}
              plantType={plot.plantType as PlantType}
              stage={currentStage}
              isReady={isReady}
              isDead={isDead}
              hasPests={plot.hasPests}
              needsWater={needsWater}
              spriteIndex={spriteIndex}
              plotIndex={plot.index}
              onClick={handleClick}
            />
          ))}
        </>
      )}
    </PlotContainer>
  );
});

export default PlotArea; 
import { Player, GameSettings } from '../models';
import mongoose from 'mongoose';

let pestTimer: NodeJS.Timeout | null = null;

/**
 * Запуск таймера шкідників
 */
export const startPestTimer = async () => {
  try {
    console.log('=== ЗАПУСК ТАЙМЕРА ШКІДНИКІВ ===');
    
    // Отримати налаштування таймера шкідників з бази даних
    const gameSettings = await GameSettings.findOne();
    
    if (!gameSettings) {
      console.error('⚠️ Не знайдено налаштування гри в базі даних');
      throw new Error('Не знайдено налаштування гри в базі даних');
    }
    
    console.log('📋 Налаштування гри:', {
      pestTimerSeconds: gameSettings.pestTimerSeconds,
      pestTimerEnabled: gameSettings.pestTimerEnabled,
      baseGrowthTimeMinutes: gameSettings.baseGrowthTimeMinutes
    });
    
    const pestTimerSeconds = gameSettings.pestTimerSeconds;
    
    console.log(`⏰ Запуск таймера шкідників з інтервалом ${pestTimerSeconds} секунд (${Math.round(pestTimerSeconds/60)} хвилин)`);
    
    // Зупинити існуючий таймер, якщо він запущений
    if (pestTimer) {
      console.log('🛑 Зупиняємо існуючий таймер');
      clearInterval(pestTimer);
    }
    
    // Перевіряємо, чи включений таймер шкідників
    if (!gameSettings.pestTimerEnabled) {
      console.log('❌ Таймер шкідників відключений в налаштуваннях');
      return { success: false, message: 'Таймер шкідників відключений в налаштуваннях' };
    }
    
    // Запустити новий таймер
    pestTimer = setInterval(async () => {
      console.log('🔄 Спрацював таймер шкідників');
      await generatePests();
    }, pestTimerSeconds * 1000);
    
    console.log('✅ Таймер шкідників успішно запущено');
    return { success: true, message: `Таймер шкідників запущено з інтервалом ${pestTimerSeconds} секунд` };
  } catch (error) {
    console.error('❌ Помилка запуску таймера шкідників:', error);
    return { success: false, message: 'Помилка запуску таймера шкідників' };
  }
};

/**
 * Зупинка таймера шкідників
 */
export const stopPestTimer = () => {
  if (pestTimer) {
    clearInterval(pestTimer);
    pestTimer = null;
    return { success: true, message: 'Таймер шкідників зупинено' };
  }
  return { success: false, message: 'Таймер шкідників не був запущений' };
};

/**
 * Генерація шкідників для рандомних рослин
 */
export const generatePests = async () => {
  console.log('🐛 === ГЕНЕРАЦІЯ ШКІДНИКІВ ===');
  
  try {
    // Отримати всі активні рослини з усіх грядок гравців
    const players = await Player.find();
    console.log(`👥 Знайдено ${players.length} гравців`);
    
    // Масив для зберігання підходящих рослин
    const eligiblePlots: { playerId: mongoose.Types.ObjectId, plotIndex: number }[] = [];
    
    // Проходимо по всіх гравцях і їх грядках
    players.forEach(player => {
      let playerPlotCount = 0;
      player.plots.forEach((plot, index) => {
        // Вибираємо тільки активні рослини без шкідників
        if (plot.status === 'growing' && !plot.hasPests) {
          eligiblePlots.push({ playerId: player._id as mongoose.Types.ObjectId, plotIndex: index });
          playerPlotCount++;
        }
      });
      if (playerPlotCount > 0) {
        console.log(`  👤 Гравець ${player.user_id}: ${playerPlotCount} підходящих рослин`);
      }
    });
    
    console.log(`🌱 Знайдено ${eligiblePlots.length} підходящих рослин для зараження шкідниками`);
    
    // Якщо немає підходящих рослин, завершуємо
    if (eligiblePlots.length === 0) {
      console.log('Немає підходящих рослин для зараження шкідниками');
      return;
    }
    
    // Розрахуємо кількість рослин, які будуть заражені (10%, але мінімум 1)
    const pestsToGenerate = Math.max(1, Math.ceil(eligiblePlots.length * 0.1));
    
    console.log(`Буде заражено ${pestsToGenerate} рослин`);
    
    // Перемішуємо масив рослин (алгоритм Fisher-Yates shuffle)
    for (let i = eligiblePlots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [eligiblePlots[i], eligiblePlots[j]] = [eligiblePlots[j], eligiblePlots[i]];
    }
    
    // Беремо необхідну кількість рослин для зараження
    const plotsToInfect = eligiblePlots.slice(0, pestsToGenerate);
    
    // Зараження рослин шкідниками
    for (const plotInfo of plotsToInfect) {
      const player = await Player.findById(plotInfo.playerId);
      
      if (player && player.plots[plotInfo.plotIndex]) {
        const plot = player.plots[plotInfo.plotIndex];
        
        // Встановлюємо прапорець шкідників
        plot.hasPests = true;
        plot.pestAppearedAt = new Date();
        
        // Сповільнюємо ріст рослини (множимо тривалість всіх незавершених стадій на 2)
        if (plot.growthStages) {
          // Визначаємо поточну стадію
          const now = new Date();
          let currentStageIndex = -1;
          
          for (let i = 0; i < plot.growthStages.length; i++) {
            const stage = plot.growthStages[i];
            const stageEndTime = new Date(stage.startTime);
            stageEndTime.setMinutes(stageEndTime.getMinutes() + stage.durationMinutes);
            
            if (now >= stage.startTime && now < stageEndTime) {
              currentStageIndex = i;
              break;
            }
          }
          
          // Сповільнюємо всі стадії, починаючи з поточної
          if (currentStageIndex !== -1) {
            for (let i = currentStageIndex; i < plot.growthStages.length; i++) {
              plot.growthStages[i].durationMinutes *= 2;
            }
            
            // Перераховуємо startTime для наступних стадій
            for (let i = currentStageIndex + 1; i < plot.growthStages.length; i++) {
              const prevStage = plot.growthStages[i - 1];
              const prevStageEndTime = new Date(prevStage.startTime);
              prevStageEndTime.setMinutes(prevStageEndTime.getMinutes() + prevStage.durationMinutes);
              
              plot.growthStages[i].startTime = prevStageEndTime;
            }
          }
        }
        
        await player.save();
        console.log(`Шкідники з'явилися на грядці ${plotInfo.plotIndex} гравця ${player.user_id}`);
      }
    }
    
    console.log(`Успішно заражено ${plotsToInfect.length} рослин шкідниками`);
  } catch (error) {
    console.error('Помилка генерації шкідників:', error);
  }
};

/**
 * Ручна генерація шкідників (для тестування)
 */
export const manualGeneratePests = async () => {
  try {
    console.log('Ручне генерування шкідників...');
    await generatePests();
    return { success: true, message: 'Шкідники успішно згенеровані' };
  } catch (error) {
    console.error('Помилка генерування шкідників:', error);
    return { success: false, message: 'Помилка генерування шкідників' };
  }
}; 
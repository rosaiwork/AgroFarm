import { Player, PlantType, GameSettings } from '../models';
import { IPlayer, IPlot, IGrowthStage } from '../models/Player';

// Типи для результату обчислення стану рослини
export type PlantGrowingState = {
  status: 'growing';
  stageIndex: number;
  stage: number;
  needsWater: boolean;
  progress: number;
  wasWatered: boolean;
  usedFertilizer: boolean;
};

export type PlantOtherState = {
  status: 'empty' | 'ready' | 'dead' | 'error';
  message?: string;
};

export type PlantState = PlantGrowingState | PlantOtherState;

/**
 * Обчислює поточний стан рослини на грядці
 * @param plot Грядка для обчислення
 * @returns Інформація про поточний стан рослини
 */
export const calculatePlantState = async (plot: IPlot): Promise<PlantState> => {
  console.log('calculatePlantState: Обчислення стану для грядки', plot.index);
  
  if (!plot.plantType || plot.status !== 'growing' || !plot.growthStages) {
    console.log('calculatePlantState: Грядка порожня або не росте', { 
      plantType: plot.plantType, 
      status: plot.status,
      hasGrowthStages: !!plot.growthStages
    });
    return { status: plot.status as 'empty' | 'ready' | 'dead' };
  }

  const now = new Date();
  const plantType = await PlantType.findById(plot.plantType);
  
  if (!plantType) {
    console.log('calculatePlantState: Тип рослини не знайдено', { plantType: plot.plantType });
    return { status: 'error', message: 'Тип рослини не знайдено' } as PlantOtherState;
  }

  console.log('calculatePlantState: Знайдено тип рослини', {
    name: plantType.displayName,
    growthCoefficient: plantType.growthCoefficient,
    wateringStages: plantType.wateringStages,
    currentStatus: plot.status
  });

  // Визначення поточної стадії
  let currentStage: IGrowthStage | null = null;
  let currentStageIndex = -1;
  let isReadyToHarvest = false;
  
  console.log('calculatePlantState: Стадії росту', plot.growthStages.map(stage => ({
    stage: stage.stage,
    needsWater: stage.needsWater,
    wasWatered: stage.wasWatered,
    startTime: stage.startTime,
    durationMinutes: stage.durationMinutes,
    usedFertilizer: stage.usedFertilizer
  })));
  
  // Перебираємо всі стадії росту, щоб знайти поточну
  for (let i = 0; i < plot.growthStages.length; i++) {
    const stage = plot.growthStages[i];
    const stageEndTime = new Date(stage.startTime.getTime() + stage.durationMinutes * 60000);
    
    console.log(`calculatePlantState: Перевірка стадії ${i+1}`, {
      now: now.toISOString(),
      startTime: stage.startTime.toISOString(),
      endTime: stageEndTime.toISOString(),
      isInStage: now >= stage.startTime && now < stageEndTime,
      needsWater: stage.needsWater,
      wasWatered: stage.wasWatered
    });
    
    // Якщо поточний час в межах цієї стадії
    if (now >= stage.startTime && now < stageEndTime) {
      currentStage = stage;
      currentStageIndex = i;
      console.log(`calculatePlantState: Рослина на стадії ${i+1}`);
      break;
    }
    
    // Якщо ця стадія вже минула (current time > endTime)
    if (now >= stageEndTime) {
      // Якщо стадія вимагала поливу, але не була полита - рослина гине
      if (stage.needsWater && !stage.wasWatered) {
        console.log(`calculatePlantState: Рослина загинула, бо не була полита на стадії ${i+1}`);
        return { 
          status: 'dead', 
          message: `Рослина загинула через відсутність поливу на стадії ${i+1}` 
        } as PlantOtherState;
      }
    }
    
    // Перевірка на повне дозрівання (пройшли всі стадії)
    if (i === plot.growthStages.length - 1 && now >= stageEndTime) {
      isReadyToHarvest = true;
      console.log('calculatePlantState: Рослина пройшла всі стадії і готова до збору');
    }
  }
  
  // Рослина досягла зрілості
  if (isReadyToHarvest) {
    // Перевірка, чи всі необхідні поливи були виконані
    const allRequiredWatering = plot.growthStages
      .filter(stage => stage.needsWater)
      .every(stage => stage.wasWatered);
    
    console.log('calculatePlantState: Перевірка поливів для зрілої рослини', {
      allRequiredWatering,
      stagesNeedingWater: plot.growthStages.filter(stage => stage.needsWater).length,
      stagesWatered: plot.growthStages.filter(stage => stage.needsWater && stage.wasWatered).length
    });
    
    // Перевірка на наявність шкідників
    if (plot.hasPests) {
      console.log('calculatePlantState: Рослина заражена шкідниками і загинула');
      return { 
        status: 'dead', 
        message: 'Рослина загинула через шкідників' 
      } as PlantOtherState;
    }
    
    if (allRequiredWatering) {
      return { status: 'ready', message: 'Рослина готова до збору' } as PlantOtherState;
    } else {
      return { status: 'dead', message: 'Рослина загинула через відсутність поливу' } as PlantOtherState;
    }
  }
  
  // Рослина ще в процесі росту
  if (currentStage) {
    // Якщо поточна стадія потребує поливу, відображаємо індикатор
    const needsWateringNow = currentStage.needsWater && !currentStage.wasWatered;
    
    // Обчислити прогрес в поточній стадії
    const stageStartTime = new Date(currentStage.startTime).getTime();
    const stageEndTime = stageStartTime + currentStage.durationMinutes * 60000;
    const currentTime = now.getTime();
    
    const stageProgress = Math.min(
      Math.floor(((currentTime - stageStartTime) / (stageEndTime - stageStartTime)) * 100),
      100
    );
    
    console.log('calculatePlantState: Розрахунок прогресу росту', {
      stageStartTime: new Date(stageStartTime).toISOString(),
      stageEndTime: new Date(stageEndTime).toISOString(),
      currentTime: new Date(currentTime).toISOString(),
      stageProgress,
      needsWateringNow,
      stageIndex: currentStageIndex,
      totalStages: plot.growthStages.length
    });
    
    const result: PlantGrowingState = {
      status: 'growing',
      stageIndex: currentStageIndex,
      stage: currentStage.stage,
      needsWater: needsWateringNow,
      progress: stageProgress,
      wasWatered: currentStage.wasWatered,
      usedFertilizer: currentStage.usedFertilizer
    };
    
    console.log('calculatePlantState: Результат обчислення', result);
    return result;
  }
  
  // Якщо не знайдена поточна стадія, але є хоча б одна стадія росту
  if (plot.growthStages.length > 0) {
    // Перевіряємо, чи поточний час менший за час початку першої стадії
    const firstStage = plot.growthStages[0];
    if (now < firstStage.startTime) {
      // Рослина ще не почала рости, використовуємо першу стадію
      console.log('calculatePlantState: Рослина ще не почала рости, використовуємо першу стадію');
      
      const needsWateringNow = firstStage.needsWater && !firstStage.wasWatered;
      const stageStartTime = new Date(firstStage.startTime).getTime();
      const stageEndTime = stageStartTime + firstStage.durationMinutes * 60000;
      
      // Прогрес 0%, оскільки стадія ще не почалася
      const result: PlantGrowingState = {
        status: 'growing',
        stageIndex: 0,
        stage: firstStage.stage,
        needsWater: needsWateringNow,
        progress: 0,
        wasWatered: firstStage.wasWatered,
        usedFertilizer: firstStage.usedFertilizer
      };
      
      return result;
    }
    
    // Перевіряємо, чи є невикористані стадії росту (можливо потрібно перейти до наступної)
    // Знаходимо останню стадію, яка вже завершилась
    let lastEndedStageIndex = -1;
    for (let i = plot.growthStages.length - 1; i >= 0; i--) {
      const stage = plot.growthStages[i];
      const stageEndTime = new Date(stage.startTime.getTime() + stage.durationMinutes * 60000);
      
      if (now >= stageEndTime) {
        lastEndedStageIndex = i;
        break;
      }
    }
    
    // Якщо знайдена стадія, яка вже завершилась, і вона не є останньою
    if (lastEndedStageIndex >= 0 && lastEndedStageIndex < plot.growthStages.length - 1) {
      // Переходимо до наступної стадії
      const nextStageIndex = lastEndedStageIndex + 1;
      const nextStage = plot.growthStages[nextStageIndex];
      
      console.log(`calculatePlantState: Перехід до наступної стадії ${nextStageIndex + 1}`);
      
      // Оновлюємо час початку наступної стадії на поточний час
      nextStage.startTime = new Date(now);
      
      // Рослина переходить у наступну стадію
      const needsWateringNow = nextStage.needsWater && !nextStage.wasWatered;
      
      const result: PlantGrowingState = {
        status: 'growing',
        stageIndex: nextStageIndex,
        stage: nextStage.stage,
        needsWater: needsWateringNow,
        progress: 0, // Прогрес 0%, оскільки стадія тільки почалася
        wasWatered: nextStage.wasWatered,
        usedFertilizer: nextStage.usedFertilizer
      };
      
      return result;
    }
    
    // Якщо всі стадії вже завершились, але рослина не готова до збору
    // (може статися при зміні тривалості стадій)
    if (lastEndedStageIndex === plot.growthStages.length - 1) {
      console.log('calculatePlantState: Всі стадії завершені, рослина готова до збору');
      
      // Перевірка, чи всі необхідні поливи були виконані
      const allRequiredWatering = plot.growthStages
        .filter(stage => stage.needsWater)
        .every(stage => stage.wasWatered);
      
      if (plot.hasPests) {
        return { 
          status: 'dead', 
          message: 'Рослина загинула через шкідників' 
        } as PlantOtherState;
      }
      
      if (allRequiredWatering) {
        return { status: 'ready', message: 'Рослина готова до збору' } as PlantOtherState;
      } else {
        return { status: 'dead', message: 'Рослина загинула через відсутність поливу' } as PlantOtherState;
      }
    }
  }
  
  console.log('calculatePlantState: Не вдалося визначити стадію росту, повертаємо поточний статус', { status: plot.status });
  return { status: plot.status as 'empty' | 'ready' | 'dead' };
};

/**
 * Оновлює стан всіх грядок гравця
 * @param userId ID гравця
 */
export const updatePlayerPlots = async (userId: string) => {
  let player = await Player.findOne({ user_id: userId });
  
  if (!player) {
    console.log('updatePlayerPlots: Гравця не знайдено, створюємо нового');
    // Створюємо нового гравця з 9 порожніми грядками
    player = await Player.create({
      user_id: userId,
      plots: Array(9).fill(null).map((_, i) => ({ 
        index: i, 
        status: 'empty', 
        hasPests: false 
      }))
    });
  }
  
  console.log(`updatePlayerPlots: Знайдено ${player.plots.length} грядок для гравця ${userId}`);
  
  let isUpdated = false;
  
  // Перевіряємо кожну грядку
  for (let i = 0; i < player.plots.length; i++) {
    const plot = player.plots[i];
    
    if (plot.status === 'growing') {
      const plantState = await calculatePlantState(plot);
      
      if (plantState.status !== 'growing') {
        player.plots[i].status = plantState.status as 'empty' | 'growing' | 'ready' | 'dead';
        isUpdated = true;
      }
    }
  }
  
  if (isUpdated) {
    await player.save();
  }
  
  return player.plots;
};

/**
 * Створює стадії росту для рослини
 * @param plantTypeId Тип рослини
 * @returns Стадії росту
 */
export const createGrowthStages = async (plantTypeId: string) => {
  const plant = await PlantType.findById(plantTypeId);
  
  if (!plant) {
    throw new Error('Тип рослини не знайдено');
  }
  
  const gameSettings = await GameSettings.findOne();
  
  if (!gameSettings) {
    throw new Error('Налаштування гри не знайдено');
  }
  
  const baseGrowthTime = gameSettings.baseGrowthTimeMinutes;
  const totalGrowthTime = baseGrowthTime * plant.growthCoefficient;
  const durationPerStage = totalGrowthTime / 4;
  
  const now = new Date();
  const growthStages: IGrowthStage[] = [];
  
  for (let i = 0; i < 4; i++) {
    const stage = i + 1;
    const needsWater = plant.wateringStages.includes(stage);
    const startTime = new Date(now.getTime() + i * durationPerStage * 60000);
    
    growthStages.push({
      stage,
      needsWater,
      wasWatered: false,
      wateringTime: null,
      startTime,
      durationMinutes: durationPerStage,
      usedFertilizer: false
    });
  }
  
  return growthStages;
};

/**
 * Оновлює стадії росту після застосування добрива
 * @param growthStages Стадії росту
 * @param currentStageIndex Індекс поточної стадії
 * @returns Оновлені стадії росту
 */
export const applyFertilizer = (growthStages: IGrowthStage[], currentStageIndex: number) => {
  if (!growthStages[currentStageIndex]) {
    throw new Error('Стадію не знайдено');
  }
  
  if (growthStages[currentStageIndex].usedFertilizer) {
    throw new Error('Добриво вже використане');
  }

  const now = new Date();
  const currentStage = growthStages[currentStageIndex];
  
  // Розрахунок поточного прогресу стадії
  const stageStartTime = new Date(currentStage.startTime).getTime();
  const originalEndTime = stageStartTime + currentStage.durationMinutes * 60000;
  const currentTime = now.getTime();
  
  // Час, що пройшов і залишився (у мілісекундах)
  const timeElapsed = currentTime - stageStartTime;
  const timeRemaining = originalEndTime - currentTime;
  
  // Зменшуємо час, що залишився, на 20%
  const reducedTimeRemaining = timeRemaining * 0.8;
  const timeReduction = timeRemaining - reducedTimeRemaining;
  
  console.log(`applyFertilizer: Стадія ${currentStageIndex + 1}`, {
    originalDuration: currentStage.durationMinutes,
    timeElapsedMinutes: timeElapsed / 60000,
    timeRemainingMinutes: timeRemaining / 60000,
    reducedTimeRemainingMinutes: reducedTimeRemaining / 60000,
    reductionMinutes: timeReduction / 60000
  });
  
  // Розрахунок нової тривалості стадії (пройдений час + скорочений час, що залишився)
  const newDuration = (timeElapsed + reducedTimeRemaining) / 60000;
  
  // Оновлення тривалості поточної стадії
  growthStages[currentStageIndex].durationMinutes = newDuration;
  growthStages[currentStageIndex].usedFertilizer = true;
  
  // Розрахунок нового часу закінчення поточної стадії
  const newEndTime = stageStartTime + newDuration * 60000;
  
  // Загальне зміщення для наступних стадій (в мілісекундах)
  const totalShift = originalEndTime - newEndTime;
  
  console.log(`applyFertilizer: Нова тривалість стадії ${currentStageIndex + 1}:`, {
    newDurationMinutes: newDuration,
    originalEndTime: new Date(originalEndTime).toISOString(),
    newEndTime: new Date(newEndTime).toISOString(),
    totalShiftMinutes: totalShift / 60000
  });
  
  // Оновлення початку всіх наступних стадій
  for (let i = currentStageIndex + 1; i < growthStages.length; i++) {
    const newStartTime = new Date(growthStages[i].startTime.getTime() - totalShift);
    console.log(`applyFertilizer: Зміщення стадії ${i + 1}:`, {
      oldStartTime: growthStages[i].startTime.toISOString(),
      newStartTime: newStartTime.toISOString()
    });
    growthStages[i].startTime = newStartTime;
  }
  
  return growthStages;
};

/**
 * Знаходить поточну стадію росту для грядки
 * @param plot Грядка
 * @returns Індекс поточної стадії або -1, якщо не знайдено
 */
export const getCurrentStageIndex = (plot: IPlot): number => {
  if (!plot.growthStages || plot.status !== 'growing') {
    return -1;
  }
  
  const now = new Date();
  let currentStageIndex = -1;
  
  for (let i = 0; i < plot.growthStages.length; i++) {
    const stage = plot.growthStages[i];
    const stageEndTime = new Date(stage.startTime.getTime() + stage.durationMinutes * 60000);
    
    if (now >= stage.startTime && now < stageEndTime) {
      currentStageIndex = i;
      break;
    }
  }
  
  return currentStageIndex;
};

/**
 * Перевіряє і оновлює статус рослини
 * @param userId ID гравця
 * @param plotIndex Індекс грядки
 * @returns Оновлений статус рослини
 */
export const updatePlantStatus = async (userId: string, plotIndex: number) => {
  console.log(`updatePlantStatus: Перевірка статусу рослини на грядці ${plotIndex} для користувача ${userId}`);
  
  // Знаходимо гравця
  const player = await Player.findOne({ user_id: userId });
  if (!player) {
    throw new Error('Гравця не знайдено');
  }
  
  // Перевіряємо чи існує грядка
  if (!player.plots[plotIndex]) {
    throw new Error('Грядка не знайдена');
  }
  
  const plot = player.plots[plotIndex];
  
  // Якщо рослина не росте, нічого не робимо
  if (plot.status !== 'growing') {
    return plot;
  }
  
  // Розраховуємо поточний стан рослини
  const plantState = await calculatePlantState(plot);
  
  // Якщо статус змінився (рослина дозріла або загинула)
  if (plantState.status !== 'growing' && plantState.status !== 'error') {
    plot.status = plantState.status as 'empty' | 'ready' | 'dead';
    
    // Зберігаємо зміни
    await player.save();
    
    console.log(`updatePlantStatus: Статус рослини оновлено на ${plantState.status}`);
  }
  
  return {
    ...plot,
    ...plantState
  };
};

/**
 * Поливає рослину на грядці
 * @param userId ID гравця
 * @param plotIndex Індекс грядки
 * @returns Оновлені дані грядки
 */
export const waterPlant = async (userId: string, plotIndex: number) => {
  console.log(`waterPlant: Спроба поливу рослини на грядці ${plotIndex} для користувача ${userId}`);
  
  // Знаходимо гравця
  const player = await Player.findOne({ user_id: userId });
  if (!player) {
    throw new Error('Гравця не знайдено');
  }
  
  // Перевіряємо чи існує грядка
  if (!player.plots[plotIndex] || player.plots[plotIndex].status !== 'growing') {
    throw new Error('Грядка порожня або рослина не росте');
  }
  
  const plot = player.plots[plotIndex];
  
  // Перевіряємо наявність шкідників
  if (plot.hasPests) {
    throw new Error('Неможливо полити рослину, поки на ній є шкідники. Спочатку використайте пестициди');
  }
  
  // Перевіряємо наявність стадій росту
  if (!plot.growthStages || plot.growthStages.length === 0) {
    throw new Error('Стадії росту відсутні');
  }
  
  // Отримуємо індекс поточної стадії
  const currentStageIndex = getCurrentStageIndex(plot);
  if (currentStageIndex === -1) {
    throw new Error('Неможливо визначити поточну стадію росту');
  }
  
  const currentStage = plot.growthStages[currentStageIndex];
  
  // Перевіряємо чи потрібен полив на цій стадії
  if (!currentStage.needsWater) {
    throw new Error('Рослина не потребує поливу на цій стадії');
  }
  
  // Перевіряємо чи рослина вже полита
  if (currentStage.wasWatered) {
    throw new Error('Рослина вже полита на цій стадії');
  }
  
  // Поливаємо рослину
  currentStage.wasWatered = true;
  currentStage.wateringTime = new Date();
  
  // Зберігаємо зміни
  await player.save();
  
  console.log(`waterPlant: Рослина успішно полита на грядці ${plotIndex}, стадія ${currentStageIndex + 1}`);
  
  // Оновлюємо статус рослини
  return await updatePlantStatus(userId, plotIndex);
};

/**
 * Очищує грядку з мертвою рослиною
 * @param userId ID гравця
 * @param plotIndex Індекс грядки
 * @returns Оновлена грядка
 */
export const clearDeadPlant = async (userId: string, plotIndex: number) => {
  console.log(`clearDeadPlant: Спроба очищення грядки ${plotIndex} для користувача ${userId}`);
  
  // Знаходимо гравця
  const player = await Player.findOne({ user_id: userId });
  if (!player) {
    throw new Error('Гравця не знайдено');
  }
  
  // Перевіряємо чи існує грядка
  if (!player.plots[plotIndex]) {
    throw new Error('Грядка не знайдена');
  }
  
  const plot = player.plots[plotIndex];
  
  // Перевіряємо чи рослина мертва
  if (plot.status !== 'dead') {
    throw new Error('На цій грядці немає мертвої рослини');
  }
  
  // Очищуємо грядку
  player.plots[plotIndex] = {
    index: plotIndex,
    status: 'empty',
    hasPests: false
  };
  
  // Зберігаємо зміни
  await player.save();
  
  console.log(`clearDeadPlant: Грядка ${plotIndex} успішно очищена`);
  
  return player.plots[plotIndex];
};

/**
 * Використовує пестицид для знищення шкідників
 * @param userId ID гравця
 * @param plotIndex Індекс грядки
 * @returns Оновлені дані грядки
 */
export const usePesticide = async (userId: string, plotIndex: number) => {
  console.log(`usePesticide: Спроба використання пестициду на грядці ${plotIndex} для користувача ${userId}`);
  
  // Знаходимо гравця
  const player = await Player.findOne({ user_id: userId });
  if (!player) {
    throw new Error('Гравця не знайдено');
  }
  
  // Перевіряємо чи існує грядка
  if (!player.plots[plotIndex] || player.plots[plotIndex].status !== 'growing') {
    throw new Error('Неможливо використати пестицид для цієї грядки');
  }
  
  const plot = player.plots[plotIndex];
  
  // Перевіряємо наявність шкідників
  if (!plot.hasPests) {
    throw new Error('На цій грядці немає шкідників');
  }
  
  // Перевіряємо наявність стадій росту
  if (!plot.growthStages || plot.growthStages.length === 0) {
    throw new Error('Стадії росту відсутні');
  }
  
  // Усунення шкідників
  plot.hasPests = false;
  plot.pestAppearedAt = undefined;
  
  // Відновлення нормальної швидкості росту (повертаємо тривалість стадій до нормальної)
  const now = new Date();
  
  // Знаходимо стадію, до якої належить поточний момент часу
  let currentStageIndex = -1;
  for (let i = 0; i < plot.growthStages.length; i++) {
    const stage = plot.growthStages[i];
    const stageEndTime = new Date(stage.startTime.getTime() + stage.durationMinutes * 60000);
    
    if (now >= stage.startTime && now < stageEndTime) {
      currentStageIndex = i;
      break;
    }
  }
  
  // Якщо знайдена поточна стадія
  if (currentStageIndex !== -1) {
    console.log(`usePesticide: Знайдена поточна стадія: ${currentStageIndex + 1}`);
    
    const currentStage = plot.growthStages[currentStageIndex];
    
    // Обчислюємо час закінчення поточної стадії (залишаємо без змін)
    const stageStartTime = currentStage.startTime.getTime();
    const stageEndTime = stageStartTime + currentStage.durationMinutes * 60000;
    
    console.log(`usePesticide: Відновлення швидкості росту:`, {
      currentStage: currentStageIndex + 1,
      durationMinutes: currentStage.durationMinutes,
      startTime: currentStage.startTime.toISOString(),
      endTime: new Date(stageEndTime).toISOString()
    });
    
    // Оновлюємо всі наступні стадії, зменшуючи їх тривалість
    let nextStageStartTime = stageEndTime;
    
    for (let i = currentStageIndex + 1; i < plot.growthStages.length; i++) {
      // Зменшуємо тривалість наступних стадій
      plot.growthStages[i].durationMinutes /= 2;
      
      // Оновлюємо час початку стадії
      plot.growthStages[i].startTime = new Date(nextStageStartTime);
      
      // Обчислюємо час початку наступної стадії
      nextStageStartTime += plot.growthStages[i].durationMinutes * 60000;
      
      console.log(`usePesticide: Оновлення стадії ${i + 1}:`, {
        newDuration: plot.growthStages[i].durationMinutes,
        newStartTime: plot.growthStages[i].startTime.toISOString()
      });
    }
  } else {
    console.log(`usePesticide: Не знайдена поточна стадія росту, перевіряємо чи рослина вже готова до збору`);
    
    // Перевіряємо, чи всі стадії вже завершились (рослина готова до збору)
    const lastStage = plot.growthStages[plot.growthStages.length - 1];
    const lastStageEndTime = new Date(lastStage.startTime.getTime() + lastStage.durationMinutes * 60000);
    
    if (now >= lastStageEndTime) {
      console.log(`usePesticide: Рослина вже завершила всі стадії росту`);
    } else {
      console.log(`usePesticide: Незвичайна ситуація - рослина не в жодній стадії. Перезапускаємо поточну стадію`);
      
      // Знаходимо останню минулу стадію
      for (let i = plot.growthStages.length - 1; i >= 0; i--) {
        const stage = plot.growthStages[i];
        const stageEndTime = new Date(stage.startTime.getTime() + stage.durationMinutes * 60000);
        
        if (now >= stageEndTime) {
          currentStageIndex = i;
          console.log(`usePesticide: Знайдена остання завершена стадія: ${i + 1}`);
          
          // Якщо це не остання стадія, готуємо наступні стадії
          if (i < plot.growthStages.length - 1) {
            // Час початку наступної стадії - поточний час
            let nextStageStartTime = now.getTime();
            
            for (let j = i + 1; j < plot.growthStages.length; j++) {
              // Зменшуємо тривалість наступних стадій
              plot.growthStages[j].durationMinutes /= 3;
              
              // Оновлюємо час початку стадії
              plot.growthStages[j].startTime = new Date(nextStageStartTime);
              
              // Обчислюємо час початку наступної стадії
              nextStageStartTime += plot.growthStages[j].durationMinutes * 60000;
              
              console.log(`usePesticide: Оновлення стадії ${j + 1}:`, {
                newDuration: plot.growthStages[j].durationMinutes,
                newStartTime: plot.growthStages[j].startTime.toISOString()
              });
            }
          }
          
          break;
        }
      }
    }
  }
  
  // Зберігаємо зміни
  await player.save();
  
  console.log(`usePesticide: Шкідники успішно усунені на грядці ${plotIndex}`);
  
  // Оновлюємо статус рослини
  return await updatePlantStatus(userId, plotIndex);
};

/**
 * Перевіряє стан всіх рослин із шкідниками
 * Використовується для оновлення стану рослин, заражених шкідниками,
 * що досягли зрілості або загинули
 */
export const checkPestsDamage = async () => {
  console.log('checkPestsDamage: Перевірка рослин із шкідниками');
  
  try {
    // Отримати всіх гравців
    const players = await Player.find();
    let updatedCount = 0;
    
    for (const player of players) {
      let isPlayerUpdated = false;
      
      // Перевірка кожної грядки гравця
      for (let i = 0; i < player.plots.length; i++) {
        const plot = player.plots[i];
        
        // Перевіряємо тільки рослини, що ростуть і заражені шкідниками
        if (plot.status === 'growing' && plot.hasPests) {
          const plantState = await calculatePlantState(plot);
          
          // Якщо статус змінився (рослина дозріла або загинула)
          if (plantState.status !== 'growing') {
            player.plots[i].status = plantState.status as 'empty' | 'ready' | 'dead';
            isPlayerUpdated = true;
            updatedCount++;
            
            console.log(`checkPestsDamage: Рослина на грядці ${i} гравця ${player.user_id} ${plantState.status === 'dead' ? 'загинула' : 'дозріла'}`);
          }
        }
      }
      
      // Зберігаємо зміни, якщо були оновлення
      if (isPlayerUpdated) {
        await player.save();
      }
    }
    
    console.log(`checkPestsDamage: Завершено перевірку, оновлено ${updatedCount} рослин`);
    return { updatedCount };
  } catch (error) {
    console.error('Помилка перевірки шкідників:', error);
    return { error: 'Помилка перевірки шкідників' };
  }
};

/**
 * Видаляє рослину з грядки (очищає грядку)
 * @param userId ID гравця
 * @param plotIndex Індекс грядки
 * @returns Оновлені дані грядки
 */
export const removePlant = async (userId: string, plotIndex: number) => {
  console.log(`removePlant: Спроба видалення рослини з грядки ${plotIndex} для користувача ${userId}`);
  
  // Знаходимо гравця
  const player = await Player.findOne({ user_id: userId });
  if (!player) {
    throw new Error('Гравця не знайдено');
  }
  
  // Перевіряємо чи існує грядка
  if (!player.plots[plotIndex]) {
    throw new Error('Грядка не знайдена');
  }
  
  const plot = player.plots[plotIndex];
  
  // Перевіряємо чи на грядці є рослина (не порожня)
  if (plot.status === 'empty') {
    throw new Error('Грядка вже порожня');
  }
  
  // Очищаємо всі дані грядки
  player.plots[plotIndex] = {
    index: plotIndex,
    status: 'empty',
    hasPests: false,
    plantType: undefined,
    plantedAt: undefined,
    pestAppearedAt: undefined,
    growthStages: undefined
  };
  
  // Зберігаємо зміни
  await player.save();
  
  console.log(`removePlant: Рослина успішно видалена з грядки ${plotIndex}`);
  
  return player.plots[plotIndex];
}; 
// Конфігурація ферми - позиції грядок і рослин

// Позиції для 9 грядок у сітці 3x3 у відсотках для повноекранного режиму
export const PLOT_POSITIONS = [
  // Верхній ряд
  { x: 13, y: 34, width: 18, height: 6 },   // Грядка 0 (верх-ліво)
  { x: 40, y: 34, width: 18, height: 6 },   // Грядка 1 (верх-центр)
  { x: 68, y: 34, width: 18, height: 6 },   // Грядка 2 (верх-право)
  
  // Середній ряд
  { x: 10, y: 48, width: 18, height: 6 },   // Грядка 3 (середина-ліво)
  { x: 41, y: 48, width: 18, height: 6 },   // Грядка 4 (середина-центр)
  { x: 71, y: 48, width: 18, height: 6 },   // Грядка 5 (середина-право)
  
  // Нижній ряд
  { x: 7, y: 65, width: 18, height: 6 },    // Грядка 6 (низ-ліво)
  { x: 41, y: 65, width: 18, height: 6 },   // Грядка 7 (низ-центр)
  { x: 74, y: 65, width: 18, height: 6 },   // Грядка 8 (низ-право)
];

// Індивідуальні позиції для кожного типу рослини відносно грядки (у відсотках)
export const PLANT_POSITIONS = {
  // 🥒 Огірок 
  cucumber: [
    { x: 23, y: 98, scale: 1.3, zIndex: 3 },  // Ліва рослина
    { x: 50, y: 62, scale: 1.4, zIndex: 1 },  // Центральна рослина
    { x: 83, y: 98, scale: 1.3, zIndex: 2 },  // Права рослина
  ],
  
  // 🍅 Помідор   
  tomato: [
    { x: 18, y: 95, scale: 1.3, zIndex: 3 },  // Ліва рослина
    { x: 50, y: 57, scale: 1.4, zIndex: 1 },  // Центральна рослина
    { x: 82, y: 95, scale: 1.3, zIndex: 2 },  // Права рослина
  ],
  
  // 🥕 Морква
  carrot: [
    { x: 22, y: 95, scale: 1.3, zIndex: 3 },  // Ліва рослина
    { x: 50, y: 60, scale: 1.4, zIndex: 1 },  // Центральна рослина
    { x: 78, y: 95, scale: 1.3, zIndex: 2 },  // Права рослина
  ],
  
  // 🌽 Кукурудза
  corn: [
    { x: 22, y: 95, scale: 1.3, zIndex: 3 },  // Ліва рослина
    { x: 50, y: 60, scale: 1.4, zIndex: 1 },  // Центральна рослина
    { x: 78, y: 95, scale: 1.3, zIndex: 2 },  // Права рослина
  ],
};

// Спрайти для рослин
export const PLANT_SPRITES = {
  cucumber: {
    stage1: '/foto/cucumber/cucumber_stage1-0.png',
    stage2: '/foto/cucumber/cucumber_stage2-0.png',
    stage3: '/foto/cucumber/cucumber_stage3-0.png',
    stage4: '/foto/cucumber/cucumber_stage4-0.png',
    stage4Ready: '/foto/cucumber/cucumber_stage4-1.png', // Для готових до збору
    dead: '/foto/cucumber/cucumber_stage_dead0.png'
  },
  tomato: {
    stage1: '/foto/tomato/tomato_stage1-0.png',
    stage2: '/foto/tomato/tomato_stage2-0.png',
    stage3: '/foto/tomato/tomato_stage3-0.png',
    stage4: '/foto/tomato/tomato_stage4-0.png',
    stage4Ready: '/foto/tomato/tomato_stage4-1.png', // Для готових до збору
    dead: '/foto/tomato/tomato_stage_dead0.png'
  },
  carrot: {
    stage1: '/foto/carrot/carrot_stage1-0.png',
    stage2: '/foto/carrot/carrot_stage2-0.png',
    stage3: '/foto/carrot/carrot_stage3-0.png',
    stage4: '/foto/carrot/carrot_stage4-0.png',
    stage4Ready: '/foto/carrot/carrot_stage4-1.png', // Для готових до збору
    dead: '/foto/carrot/carrot_stage_dead0.png'
  },
  corn: {
    stage1: '/foto/corn/corn_stage1-0.png',
    stage2: '/foto/corn/corn_stage2-0.png',
    stage3: '/foto/corn/corn_stage3-0.png',
    stage4: '/foto/corn/corn_stage4-0.png',
    stage4Ready: '/foto/corn/corn_stage4-1.png', // Для готових до збору
    dead: '/foto/corn/corn_stage_dead0.png'
  },
};

// Типи рослин
export type PlantType = 'cucumber' | 'tomato' | 'carrot' | 'corn';

// Розміри фонового зображення
export const BACKGROUND_DIMENSIONS = {
  width: 1024,
  height: 1536,
  aspectRatio: 1024 / 1536, // ≈ 0.667
}; 
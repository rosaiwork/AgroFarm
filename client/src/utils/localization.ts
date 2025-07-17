export type Language = 'uk' | 'en';

export interface Translations {
  // Загальні
  language: string;
  settings: string;
  close: string;
  loading: string;
  error: string;
  success: string;
  
  // Навігація
  farm: string;
  market: string;
  finance: string;
  home: string;
  
  // Фінанси
  balance: string;
  deposit: string;
  withdraw: string;
  referral: string;
  inventory: string;
  
  // Склад
  seeds: string;
  water: string;
  fertilizer: string;
  pesticide: string;
  vegetables: string;
  
  // Овочі
  cucumber: string;
  tomato: string;
  carrot: string;
  corn: string;
  
  // Ферма
  plant: string;
  waterPlant: string;
  fertilize: string;
  pesticides: string;
  harvest: string;
  empty: string;
  growing: string;
  ready: string;
  dead: string;
  stage: string;
  progress: string;
  needsWater: string;
  hasPests: string;
  selectPlant: string;
  cancel: string;
  removePlant: string;
  removeConfirm: string;
  removeWarning: string;
  yes: string;
  no: string;
  growthTime: string;
  watering: string;
  hours: string;
  selectPlantForPlanting: string;
  confirmRemovePlantText: string;
  
  // Ринок
  buy: string;
  sell: string;
  price: string;
  quantity: string;
  inStock: string;
  expandInventory: string;
  notEnoughMoney: string;
  notEnoughSpace: string;
  coins: string;
  warehouse: string;
  buyResources: string;
  vegetableTrading: string;
  
  // Графіки цін
  priceChart: string;
  lowestPrice: string;
  highestPrice: string;
  overview: string;
  stats: string;
  priceHistory: string;
  
  // Повідомлення
  plantWatered: string;
  fertilizerApplied: string;
  pesticideApplied: string;
  harvestCollected: string;
  plotCleared: string;
  plantRemoved: string;
  
  // Фінанси - нові тексти
  connectWallet: string;
  notifications: string;
  news: string;
  pests: string;
  harvestReady: string;
  
  // TON Connect
  walletConnected: string;
  walletDisconnected: string;
  depositModal: string;
  withdrawModal: string;
  walletAddress: string;
  tonBalance: string;
  gameBalance: string;
  enterAmount: string;
  processing: string;
  confirmDeposit: string;
  
  // NFT Trading
  nftTrading: string;
  comingSoon: string;
  autoPlanting: string;
  autoIrrigation: string;
  pestControl: string;
  acceleration: string;
  autoHarvest: string;
  waterExtraction: string;
  fertilizerExtraction: string;
  unlimitedStorage: string;
  
  // NFT Описи
  autoPlantingDesc: string;
  autoIrrigationDesc: string;
  pestControlDesc: string;
  accelerationDesc: string;
  autoHarvestDesc: string;
  waterExtractionDesc: string;
  fertilizerExtractionDesc: string;
  unlimitedStorageDesc: string;
  
  // Загальні тексти
  emptyPlotMessage: string;
  needsWaterAlt: string;
  pestsAlt: string;
  newsHeader: string;
  totalPlayers: string;
  enterNewsText: string;
  expandInventoryError: string;
  newsCreationError: string;
  newsDeleteError: string;
  newsPublishError: string;
  
  // Додаткові переклади
  positions: string;
  for: string;
  limitOrder: string;
  marketOrder: string;
  takeProfitOrder: string;
  
  // Ринок - недостаючі переклади
  expand: string;
  expandDescription: string;
  storageStatus: string;
  inStorage: string;
  warehouseExpanded: string;
  statistics: string;
  
  // Ферма - додаткові тексти
  growthStage: string;
  harvestCollectedAnimated: string;
  needsWaterStatus: string;
  pestsStatus: string;
  unknownPlant: string;
  plantDiedFromPests: string;
  plantDied: string;
  readyToHarvest: string;
}

const translations: Record<Language, Translations> = {
  uk: {
    // Загальні
    language: 'Мова',
    settings: 'Налаштування',
    close: 'Закрити',
    loading: 'Завантаження...',
    error: 'Помилка',
    success: 'Успішно',
    
    // Навігація
    farm: 'Ферма',
    market: 'Ринок',
    finance: 'Фінанси',
    home: 'Головна',
    
    // Фінанси
    balance: 'Баланс',
    deposit: 'Поповнення',
    withdraw: 'Вивести',
    referral: 'Реферал',
    inventory: 'Склад',
    
    // Склад
    seeds: 'Насіння',
    water: 'Вода',
    fertilizer: 'Добрива',
    pesticide: 'Пестициди',
    vegetables: 'Овочі',
    
    // Овочі
    cucumber: 'Огірок',
    tomato: 'Помідор',
    carrot: 'Морква',
    corn: 'Кукурудза',
    
    // Ферма
    plant: 'Посадити',
    waterPlant: 'Полити',
    fertilize: 'Добриво',
    pesticides: 'Пестициди',
    harvest: 'Зібрати',
    empty: 'Порожня',
    growing: 'Росте',
    ready: 'Готова',
    dead: 'Загинула',
    stage: 'Стадія',
    progress: 'Прогрес',
    needsWater: 'Потребує поливу',
    hasPests: 'Шкідники',
    selectPlant: 'Вибрати рослину',
    cancel: 'Скасувати',
    removePlant: 'Видалити рослину',
    removeConfirm: 'Видалити рослину?',
    removeWarning: 'Це призведе до втрати всіх даних про цю рослину.',
    yes: 'Так',
    no: 'Ні',
    growthTime: 'Час росту',
    watering: 'Полив',
    hours: 'Годин',
    selectPlantForPlanting: 'Вибрати рослину для посадки',
    confirmRemovePlantText: 'Видалити рослину?',
    
    // Ринок
    buy: 'Купити',
    sell: 'Продати',
    price: 'Ціна',
    quantity: 'Кількість',
    inStock: 'На складі',
    expandInventory: 'Розширити склад',
    notEnoughMoney: 'Недостатньо монет',
    notEnoughSpace: 'Недостатньо місця на складі',
    coins: 'Монети',
    warehouse: 'Склад',
    buyResources: 'Купити ресурси',
    vegetableTrading: 'Овочевий ринок',
    
    // Графіки цін
    priceChart: 'Графік цін',
    lowestPrice: 'Найнижча ціна',
    highestPrice: 'Найвища ціна',
    overview: 'Огляд',
    stats: 'Статистика',
    priceHistory: 'Історія цін',
    
    // Повідомлення
    plantWatered: 'Рослина полита',
    fertilizerApplied: 'Добриво застосовано',
    pesticideApplied: 'Пестицид застосовано',
    harvestCollected: 'Врожай зібрано',
    plotCleared: 'Грядка очищена',
    plantRemoved: 'Рослина видалена',
    
    // Фінанси - нові тексти
    connectWallet: 'Підключити гаманець',
    notifications: 'Сповіщення',
    news: 'Новини',
    pests: 'Шкідники',
    harvestReady: 'Готовність до збору',
    
    // TON Connect
    walletConnected: 'Гаманець підключено',
    walletDisconnected: 'Гаманець відключено',
    depositModal: 'Поповнення рахунку',
    withdrawModal: 'Виведення коштів',
    walletAddress: 'Адреса гаманця',
    tonBalance: 'Баланс TON',
    gameBalance: 'Баланс в грі',
    enterAmount: 'Введіть суму',
    processing: 'Обробка...',
    confirmDeposit: 'Підтвердити',
    
    // NFT Trading
    nftTrading: 'Торгівля NFT',
    comingSoon: 'Скоро доступно',
    autoPlanting: 'Автосаджання',
    autoIrrigation: 'Автополив',
    pestControl: 'Захист від шкідників',
    acceleration: 'Прискорення росту',
    autoHarvest: 'Автозбір',
    waterExtraction: 'Видобування води',
    fertilizerExtraction: 'Виробництво добрив',
    unlimitedStorage: 'Безлімітний склад',
    
    // NFT Описи
    autoPlantingDesc: 'Ця NFT дозволяє автоматизувати процес саджання овочів. Можна встановити тип рослини і кількість задіяних грядок',
    autoIrrigationDesc: 'Ця NFT дозволяє автоматизувати процес поливу овочів. Зрошуються всі рослини що потребують поливу на стадії. Необхідно мати достатній запас води на складі',
    pestControlDesc: 'Ця NFT дозволяє автоматизувати процес боротьби з шкідниками. Запобігає появі шкідників на овочах. Необхідно мати достатній запас пестицидів на складі',
    accelerationDesc: 'Ця NFT створює сприятливі умови для росту овочів. Мікроклімат і автоматичне внесення натуральних добрив прискорюють ріст рослини вдвічі',
    autoHarvestDesc: 'Ця NFT дозволяє автоматизувати процес збору стиглих овочів. Автоматично переносить достиглі овочі на склад. Необхідно мати вільне місце на складі',
    waterExtractionDesc: 'Ця NFT дозволяє отримувати власну воду для поливу овочів. Надлишок отриманої води ви можете продати на ринку',
    fertilizerExtractionDesc: 'Ця NFT дозволяє виробляти власні натуральні добрива. Надлишок отриманих добрив можна продати на ринку',
    unlimitedStorageDesc: 'Ця NFT дозволяє розширити власний склад для зберігання безлімітної кількості овочів і інвертаря',
    
    // Загальні тексти
    emptyPlotMessage: 'Порожня грядка - виберіть режим "Посадити"',
    needsWaterAlt: 'Потребує поливу',
    pestsAlt: 'Шкідники',
    newsHeader: 'НОВИНИ',
    totalPlayers: 'Всього гравців',
    enterNewsText: 'Введіть текст новини',
    expandInventoryError: 'Помилка розширення складу',
    newsCreationError: 'Помилка при створенні новини',
    newsDeleteError: 'Помилка при видаленні новини',
    newsPublishError: 'Помилка при публікації новини',
    
    // Додаткові переклади
    positions: 'позицій',
    for: 'за',
    limitOrder: 'Лімітний ордер',
    marketOrder: 'Ринковий ордер',
    takeProfitOrder: 'Тейк-профіт',
    
    // Ринок - недостаючі переклади
    expand: 'Розширити',
    expandDescription: '10 позицій за 10 KNL',
    storageStatus: 'Склад',
    inStorage: 'На складі',
    warehouseExpanded: 'Склад успішно розширено',
    statistics: 'Статистика',
    
    // Ферма - додаткові тексти
    growthStage: 'Стадія росту',
    harvestCollectedAnimated: 'зібрано!',
    needsWaterStatus: 'Потрібен полив',
    pestsStatus: 'ШКІДНИКИ!',
    unknownPlant: 'Невідома рослина',
    plantDiedFromPests: 'Рослина загинула від шкідників. Натисніть, щоб очистити грядку.',
    plantDied: 'Рослина загинула. Натисніть, щоб очистити грядку.',
    readyToHarvest: 'Готовий до збору!'
  },
  
  en: {
    // Загальні
    language: 'Language',
    settings: 'Settings',
    close: 'Close',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    
    // Навігація
    farm: 'Farm',
    market: 'Market',
    finance: 'Finance',
    home: 'Home',
    
    // Фінанси
    balance: 'Balance',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    referral: 'Referral',
    inventory: 'Inventory',
    
    // Склад
    seeds: 'Seeds',
    water: 'Water',
    fertilizer: 'Fertilizer',
    pesticide: 'Pesticide',
    vegetables: 'Vegetables',
    
    // Овочі
    cucumber: 'Cucumber',
    tomato: 'Tomato',
    carrot: 'Carrot',
    corn: 'Corn',
    
    // Ферма
    plant: 'Plant',
    waterPlant: 'Water',
    fertilize: 'Fertilizer',
    pesticides: 'Pesticides',
    harvest: 'Harvest',
    empty: 'Empty',
    growing: 'Growing',
    ready: 'Ready',
    dead: 'Dead',
    stage: 'Stage',
    progress: 'Progress',
    needsWater: 'Needs Water',
    hasPests: 'Has Pests',
    selectPlant: 'Select Plant',
    cancel: 'Cancel',
    removePlant: 'Remove Plant',
    removeConfirm: 'Remove Plant?',
    removeWarning: 'This will delete all data related to this plant.',
    yes: 'Yes',
    no: 'No',
    growthTime: 'Growth Time',
    watering: 'Watering',
    hours: 'Hours',
    selectPlantForPlanting: 'Select Plant for Planting',
    confirmRemovePlantText: 'Remove Plant?',
    
    // Ринок
    buy: 'Buy',
    sell: 'Sell',
    price: 'Price',
    quantity: 'Quantity',
    inStock: 'In Stock',
    expandInventory: 'Expand Inventory',
    notEnoughMoney: 'Not Enough Money',
    notEnoughSpace: 'Not Enough Space',
    coins: 'Coins',
    warehouse: 'Warehouse',
    buyResources: 'Buy Resources',
    vegetableTrading: 'Vegetable Trading',
    
    // Графіки цін
    priceChart: 'Price Chart',
    lowestPrice: 'Lowest Price',
    highestPrice: 'Highest Price',
    overview: 'Overview',
    stats: 'Stats',
    priceHistory: 'Price History',
    
    // Повідомлення
    plantWatered: 'Plant watered',
    fertilizerApplied: 'Fertilizer applied',
    pesticideApplied: 'Pesticide applied',
    harvestCollected: 'Harvest collected',
    plotCleared: 'Plot cleared',
    plantRemoved: 'Plant removed',
    
    // Фінанси - нові тексти
    connectWallet: 'Connect Wallet',
    notifications: 'Notifications',
    news: 'News',
    pests: 'Pests',
    harvestReady: 'Harvest Ready',
    
    // TON Connect
    walletConnected: 'Wallet Connected',
    walletDisconnected: 'Wallet Disconnected',
    depositModal: 'Deposit Funds',
    withdrawModal: 'Withdraw Funds',
    walletAddress: 'Wallet Address',
    tonBalance: 'TON Balance',
    gameBalance: 'Game Balance',
    enterAmount: 'Enter Amount',
    processing: 'Processing...',
    confirmDeposit: 'Confirm',
    
    // NFT Trading
    nftTrading: 'NFT Trading',
    comingSoon: 'Coming Soon',
    autoPlanting: 'Auto Planting',
    autoIrrigation: 'Auto Irrigation',
    pestControl: 'Pest Control',
    acceleration: 'Growth Acceleration',
    autoHarvest: 'Auto Harvest',
    waterExtraction: 'Water Extraction',
    fertilizerExtraction: 'Fertilizer Production',
    unlimitedStorage: 'Unlimited Storage',
    
    // NFT Описи
    autoPlantingDesc: 'This NFT allows automation of vegetable planting process. You can set plant type and number of plots involved',
    autoIrrigationDesc: 'This NFT allows automation of vegetable watering process. All plants that need watering at stage will be irrigated. Must have sufficient water supply in storage',
    pestControlDesc: 'This NFT allows automation of pest control process. Prevents pest appearance on vegetables. Must have sufficient pesticide supply in storage',
    accelerationDesc: 'This NFT creates favorable conditions for vegetable growth. Microclimate and automatic natural fertilizer application accelerates plant growth by half',
    autoHarvestDesc: 'This NFT allows automation of ripe vegetable collection. Automatically transfers ripe vegetables to storage. Must have free space in storage',
    waterExtractionDesc: 'This NFT allows obtaining your own water for vegetable irrigation. Excess obtained water can be sold on the market',
    fertilizerExtractionDesc: 'This NFT allows producing your own natural fertilizers. Excess obtained fertilizers can be sold on the market',
    unlimitedStorageDesc: 'This NFT allows expanding your own storage for unlimited quantity of vegetables and inventory',
    
    // Загальні тексти
    emptyPlotMessage: 'Empty plot - select "Plant" mode',
    needsWaterAlt: 'Needs watering',
    pestsAlt: 'Pests',
    newsHeader: 'NEWS',
    totalPlayers: 'Total players',
    enterNewsText: 'Enter news text',
    expandInventoryError: 'Inventory expansion error',
    newsCreationError: 'News creation error',
    newsDeleteError: 'News deletion error',
    newsPublishError: 'News publishing error',
    
    // Додаткові переклади
    positions: 'positions',
    for: 'for',
    limitOrder: 'Limit Order',
    marketOrder: 'Market Order',
    takeProfitOrder: 'Take Profit',
    
    // Ринок - недостаючі переклади
    expand: 'Expand',
    expandDescription: '10 positions for 10 KNL',
    storageStatus: 'Storage',
    inStorage: 'In storage',
    warehouseExpanded: 'Storage successfully expanded',
    statistics: 'Statistics',
    
    // Ферма - додаткові тексти
    growthStage: 'Growth stage',
    harvestCollectedAnimated: 'harvested!',
    needsWaterStatus: 'Needs watering',
    pestsStatus: 'PESTS!',
    unknownPlant: 'Unknown plant',
    plantDiedFromPests: 'Plant died from pests. Click to clear the plot.',
    plantDied: 'Plant died. Click to clear the plot.',
    readyToHarvest: 'Ready to harvest!'
  }
};

// Контекст для збереження поточної мови
let currentLanguage: Language = 'uk';

export const setLanguage = (language: Language) => {
  currentLanguage = language;
  localStorage.setItem('game-language', language);
};

export const getLanguage = (): Language => {
  const saved = localStorage.getItem('game-language') as Language;
  return saved || currentLanguage;
};

export const t = (key: keyof Translations): string => {
  const language = getLanguage();
  return translations[language][key] || translations.uk[key] || key;
};

// Ініціалізація мови при завантаженні
export const initializeLanguage = () => {
  const saved = getLanguage();
  setLanguage(saved);
};

export default translations; 
import mongoose, { Schema, Document } from 'mongoose';

// Інтерфейс для стадії росту рослини
export interface IGrowthStage {
  stage: number;
  needsWater: boolean;
  wasWatered: boolean;
  wateringTime: Date | null;
  startTime: Date;
  durationMinutes: number;
  usedFertilizer: boolean;
}

// Інтерфейс для грядки
export interface IPlot {
  index: number;
  plantType?: string;
  plantedAt?: Date;
  status: 'empty' | 'growing' | 'ready' | 'dead';
  hasPests: boolean;
  pestAppearedAt?: Date;
  growthStages?: IGrowthStage[];
}

// Інтерфейс для інвентарю гравця
export interface IInventory {
  seeds: number;
  water: number;
  fertilizer: number;
  pesticide: number;
  cucumber: number;
  tomato: number;
  carrot: number;
  corn: number;
  [key: string]: number;
}

// Інтерфейс для налаштувань гравця
interface ISettings {
  language: 'uk' | 'en';
  notifications: {
    pests: boolean;
    news: boolean;
    watering: boolean;
  };
}

// Інтерфейс для моделі гравця
export interface IPlayer extends Document {
  user_id: string;
  coins: number;
  plots: IPlot[];
  inventory: IInventory;
  totalHarvest: number;
  settings: ISettings;
  inventoryCapacity: number;
  inventoryCount?: number; // Кількість предметів в інвентарі
}

// Схема стадій росту
const GrowthStageSchema: Schema = new Schema({
  stage: { type: Number, required: true },
  needsWater: { type: Boolean, required: true },
  wasWatered: { type: Boolean, default: false },
  wateringTime: { type: Date, default: null },
  startTime: { type: Date, required: true },
  durationMinutes: { type: Number, required: true },
  usedFertilizer: { type: Boolean, default: false }
});

// Схема грядки
const PlotSchema: Schema = new Schema({
  index: { type: Number, required: true },
  plantType: { type: String, ref: 'PlantType' },
  plantedAt: { type: Date },
  status: { type: String, enum: ['empty', 'growing', 'ready', 'dead'], default: 'empty' },
  hasPests: { type: Boolean, default: false },
  pestAppearedAt: { type: Date },
  growthStages: [GrowthStageSchema]
});

// Схема інвентарю
const InventorySchema: Schema = new Schema({
  seeds: { type: Number, default: 10 },
  water: { type: Number, default: 20 },
  fertilizer: { type: Number, default: 5 },
  pesticide: { type: Number, default: 5 },
  cucumber: { type: Number, default: 0 },
  tomato: { type: Number, default: 0 },
  carrot: { type: Number, default: 0 },
  corn: { type: Number, default: 0 }
});

// Схема налаштувань
const SettingsSchema: Schema = new Schema({
  language: { type: String, enum: ['uk', 'en'], default: 'uk' },
  notifications: {
    pests: { type: Boolean, default: true },
    news: { type: Boolean, default: true },
    watering: { type: Boolean, default: true }
  }
});

// Схема гравця
const PlayerSchema: Schema = new Schema({
  user_id: { type: String, required: true, unique: true },
  coins: { type: Number, default: 500, set: (v: number) => Math.round(v) },
  plots: { type: [PlotSchema], default: () => Array(9).fill(null).map((_, i) => ({ index: i, status: 'empty', hasPests: false })) },
  inventory: { type: InventorySchema, default: () => ({}) },
  totalHarvest: { type: Number, default: 0 },
  settings: { type: SettingsSchema, default: () => ({}) },
  inventoryCapacity: { type: Number, default: 20 },
  inventoryCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IPlayer>('Player', PlayerSchema); 
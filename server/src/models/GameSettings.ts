import mongoose, { Schema, Document } from 'mongoose';

export interface IGameSettings extends Document {
  baseGrowthTimeMinutes: number;
  pestTimerSeconds: number;
  marketPrices: {
    cucumber: number;
    tomato: number;
    carrot: number;
    corn: number;
    water: number;
    seeds: number;
    fertilizer: number;
    pesticide: number;
  };
  pestTimerEnabled: boolean;
  randomNewsTimerSeconds: number;
  randomNewsTimerEnabled: boolean;
}

const GameSettingsSchema: Schema = new Schema({
  baseGrowthTimeMinutes: { type: Number, default: 480 }, // 8 годин
  pestTimerSeconds: { type: Number, default: 3600 }, // 1 година
  marketPrices: {
    cucumber: { type: Number, default: 50 },
    tomato: { type: Number, default: 50 },
    carrot: { type: Number, default: 50 },
    corn: { type: Number, default: 50 },
    water: { type: Number, default: 10 },
    seeds: { type: Number, default: 20 },
    fertilizer: { type: Number, default: 30 },
    pesticide: { type: Number, default: 30 }
  },
  pestTimerEnabled: { type: Boolean, default: true },
  randomNewsTimerSeconds: { type: Number, default: 7200 }, // 2 години
  randomNewsTimerEnabled: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IGameSettings>('GameSettings', GameSettingsSchema); 
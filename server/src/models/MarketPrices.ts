import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketPrices extends Document {
  prices: {
    cucumber: number;
    tomato: number;
    carrot: number;
    corn: number;
    water: number;
    fertilizer: number;
    pesticide: number;
    seeds: number;
  };
  updatedAt: Date;
}

const MarketPricesSchema: Schema = new Schema({
  prices: {
    cucumber: { type: Number, required: true, default: 10 },
    tomato: { type: Number, required: true, default: 12 },
    carrot: { type: Number, required: true, default: 8 },
    corn: { type: Number, required: true, default: 15 },
    water: { type: Number, required: true, default: 2 },
    fertilizer: { type: Number, required: true, default: 5 },
    pesticide: { type: Number, required: true, default: 7 },
    seeds: { type: Number, required: true, default: 3 }
  },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<IMarketPrices>('MarketPrices', MarketPricesSchema); 
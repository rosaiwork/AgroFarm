import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketPrice {
  value: number;
  timestamp: Date;
}

export interface IMarketItem extends Document {
  itemId: string; // cucumber, tomato, carrot, corn, water, seeds, fertilizer, pesticide
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  priceHistory: IMarketPrice[];
}

const MarketPriceSchema: Schema = new Schema({
  value: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

const MarketItemSchema: Schema = new Schema({
  itemId: { type: String, required: true, unique: true },
  currentPrice: { type: Number, required: true },
  minPrice: { type: Number, required: true },
  maxPrice: { type: Number, required: true },
  priceHistory: { type: [MarketPriceSchema], default: [] }
}, { timestamps: true });

export default mongoose.model<IMarketItem>('MarketItem', MarketItemSchema); 
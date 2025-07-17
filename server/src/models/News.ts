import mongoose, { Schema, Document } from 'mongoose';

export interface INews extends Document {
  title: string;
  content: string;
  priceChange: number; // Відсоток зміни ціни (позитивний або негативний)
  affectedItems: string[]; // Список товарів, на які впливає новина
  isPublished: boolean;
  publishedAt?: Date;
}

const NewsSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  priceChange: { type: Number, required: true }, // Наприклад, -5 означає зниження на 5%
  affectedItems: { type: [String], required: true }, // ['cucumber', 'tomato', etc.]
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model<INews>('News', NewsSchema); 
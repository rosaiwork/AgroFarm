import mongoose, { Schema, Document } from 'mongoose';

export interface IPlantType extends Document {
  _id: string;
  displayName: string;
  growthCoefficient: number;
  wateringStages: number[];
}

const PlantTypeSchema: Schema = new Schema({
  _id: { type: String, required: true }, // cucumber, tomato, carrot, corn
  displayName: { type: String, required: true }, // Огірок, Помідор, Морква, Кукурудза
  growthCoefficient: { type: Number, required: true }, // 1.0, 1.4, 1.6, 1.2
  wateringStages: { type: [Number], required: true } // [1, 2, 3, 4], [1, 2], [1], [1, 2, 3]
});

export default mongoose.model<IPlantType>('PlantType', PlantTypeSchema); 
import mongoose, { Document, Schema } from 'mongoose';

export interface IPlot extends Document {
  playerId: mongoose.Types.ObjectId;
  index: number;
  plantType?: string;
  plantedAt?: Date;
  status: 'empty' | 'growing' | 'ready' | 'dead';
  hasPests: boolean;
  pestAppearedAt?: Date;
  growthStages?: any[];
  stageIndex?: number;
  progress?: number;
}

const plotSchema = new Schema<IPlot>({
  playerId: {
    type: Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  plantType: {
    type: String,
    enum: ['cucumber', 'tomato', 'carrot', 'corn']
  },
  plantedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['empty', 'growing', 'ready', 'dead'],
    default: 'empty'
  },
  hasPests: {
    type: Boolean,
    default: false
  },
  pestAppearedAt: {
    type: Date
  },
  growthStages: [{
    stage: Number,
    needsWater: Boolean,
    wasWatered: Boolean,
    startTime: Date,
    durationMinutes: Number,
    usedFertilizer: Boolean
  }],
  stageIndex: {
    type: Number
  },
  progress: {
    type: Number
  }
});

// Індекси
plotSchema.index({ playerId: 1, index: 1 });
plotSchema.index({ status: 1 });
plotSchema.index({ hasPests: 1 });

export default mongoose.model<IPlot>('Plot', plotSchema); 
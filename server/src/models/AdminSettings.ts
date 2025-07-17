import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminSettings extends Document {
  settingKey: string;
  settingValue: any;
  openaiApiKey?: string;
  updatedAt: Date;
}

const adminSettingsSchema = new Schema<IAdminSettings>({
  settingKey: {
    type: String,
    required: true,
    unique: true
  },
  settingValue: {
    type: Schema.Types.Mixed,
    required: true
  },
  openaiApiKey: {
    type: String,
    required: false
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Індекс для швидкого пошуку за ключем
adminSettingsSchema.index({ settingKey: 1 });

export default mongoose.model<IAdminSettings>('AdminSettings', adminSettingsSchema); 
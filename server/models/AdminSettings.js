const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema({
  settingKey: {
    type: String,
    required: true,
    unique: true
  },
  settingValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Індекс для швидкого пошуку за ключем
adminSettingsSchema.index({ settingKey: 1 });

module.exports = mongoose.model('AdminSettings', adminSettingsSchema); 
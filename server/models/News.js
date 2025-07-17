const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  priceChange: {
    type: Number,
    required: true, // відсоток зміни ціни (може бути негативним)
    min: -100,
    max: 100
  },
  affectedVegetables: [{
    type: String,
    enum: ['cucumber', 'tomato', 'carrot', 'corn'],
    required: true
  }],
  isApplied: {
    type: Boolean,
    default: false
  },
  appliedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Індекс для пошуку застосованих новин
newsSchema.index({ isApplied: 1, createdAt: -1 });

module.exports = mongoose.model('News', newsSchema); 
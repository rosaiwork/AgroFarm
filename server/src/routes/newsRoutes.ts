import express from 'express';
import News from '../models/News';

const router = express.Router();

// Отримати всі опубліковані новини
router.get('/', async (req, res) => {
  try {
    const news = await News.find({ isPublished: true })
      .sort({ publishedAt: -1 })
      .limit(10);
    res.json(news);
  } catch (error) {
    console.error('Помилка отримання новин:', error);
    res.status(500).json({ message: 'Помилка отримання новин' });
  }
});

// Отримати одну випадкову новину
router.get('/random', async (req, res) => {
  try {
    const count = await News.countDocuments();
    const random = Math.floor(Math.random() * count);
    const randomNews = await News.findOne().skip(random);
    res.json(randomNews);
  } catch (error) {
    console.error('Помилка отримання випадкової новини:', error);
    res.status(500).json({ message: 'Помилка отримання випадкової новини' });
  }
});

export default router; 
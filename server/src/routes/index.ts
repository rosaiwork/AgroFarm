import express from 'express';
import adminRoutes from './adminRoutes';
import playerRoutes from './playerRoutes';
import plotRoutes from './plotRoutes';
import marketRoutes from './marketRoutes';
import newsRoutes from './newsRoutes';
import aiRoutes from './aiRoutes';

const router = express.Router();

// Маршрути для гравців
router.use('/player', playerRoutes);

// Маршрути для грядок
router.use('/plots', plotRoutes);

// Адміністративні маршрути
router.use('/admin', adminRoutes);

// Маршрути ринку та новин
router.use('/market', marketRoutes);
router.use('/news', newsRoutes);

// Маршрути AI
router.use('/ai', aiRoutes);

export default router; 
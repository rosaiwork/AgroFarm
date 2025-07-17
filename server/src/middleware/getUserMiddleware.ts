import { Request, Response, NextFunction } from 'express';

// Функція для отримання ID користувача з запиту
export const getUserIdFromRequest = (req: Request): string => {
  const userId = req.headers['user-id'];
  
  if (!userId || typeof userId !== 'string') {
    throw new Error('Не авторизовано: відсутній ID користувача');
  }
  
  return userId;
};

// Middleware для перевірки наявності ID користувача
export const getUserMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    getUserIdFromRequest(req);
    next();
  } catch (error: any) {
    res.status(401).json({ message: error.message || 'Не авторизовано' });
  }
}; 
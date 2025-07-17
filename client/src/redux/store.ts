import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Базовий reducer для початкового налаштування
const initialState = {
  loading: false,
  initialized: true,
};

const appReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

// Редьюсери будуть імпортовані пізніше
// import gameReducer from './slices/gameSlice';
// import marketReducer from './slices/marketSlice';
// import playerReducer from './slices/playerSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    // game: gameReducer,
    // market: marketReducer,
    // player: playerReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Хуки для використання в компонентах
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 
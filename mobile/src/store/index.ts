import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import authReducer from './slices/authSlice';
import householdReducer from './slices/householdSlice';
import expenseReducer from './slices/expenseSlice';
import shoppingReducer from './slices/shoppingSlice';
import { api } from './services/api';
import { notificationMiddleware } from './middleware/notificationMiddleware';

// Web-compatible storage adapter
const createWebStorage = () => {
  return {
    getItem: async (key: string): Promise<string | null> => {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('Error getting item from storage:', error);
        return null;
      }
    },
    setItem: async (key: string, value: string): Promise<void> => {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Error storing data:', error);
      }
    },
    removeItem: async (key: string): Promise<void> => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing item from storage:', error);
      }
    },
  };
};

// Use localStorage for web, AsyncStorage for native
const storage = Platform.OS === 'web' ? createWebStorage() : AsyncStorage;

// Persist configuration
const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['auth', 'household', 'expense', 'shopping'], // Persist auth, household, expense, and shopping state
};

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  household: householdReducer,
  expense: expenseReducer,
  shopping: shoppingReducer,
  [api.reducerPath]: api.reducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(api.middleware, notificationMiddleware),
});

// Setup listeners for RTK Query
setupListeners(store.dispatch);

// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

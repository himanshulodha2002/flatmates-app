import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ShoppingState {
  activeShoppingListId: string | null;
  selectedCategory: string | null;
  showPurchased: boolean;
  pollingInterval: number; // milliseconds, for real-time updates
}

const initialState: ShoppingState = {
  activeShoppingListId: null,
  selectedCategory: null,
  showPurchased: true,
  pollingInterval: 3000, // Poll every 3 seconds for real-time updates
};

const shoppingSlice = createSlice({
  name: 'shopping',
  initialState,
  reducers: {
    setActiveShoppingList: (state, action: PayloadAction<string | null>) => {
      state.activeShoppingListId = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },
    setShowPurchased: (state, action: PayloadAction<boolean>) => {
      state.showPurchased = action.payload;
    },
    setPollingInterval: (state, action: PayloadAction<number>) => {
      state.pollingInterval = action.payload;
    },
    clearShoppingFilters: (state) => {
      state.selectedCategory = null;
      state.showPurchased = true;
    },
    clearShoppingData: (state) => {
      state.activeShoppingListId = null;
      state.selectedCategory = null;
      state.showPurchased = true;
    },
  },
});

export const {
  setActiveShoppingList,
  setSelectedCategory,
  setShowPurchased,
  setPollingInterval,
  clearShoppingFilters,
  clearShoppingData,
} = shoppingSlice.actions;

// Selectors
export const selectActiveShoppingListId = (state: { shopping: ShoppingState }) =>
  state.shopping.activeShoppingListId;
export const selectSelectedCategory = (state: { shopping: ShoppingState }) =>
  state.shopping.selectedCategory;
export const selectShowPurchased = (state: { shopping: ShoppingState }) =>
  state.shopping.showPurchased;
export const selectPollingInterval = (state: { shopping: ShoppingState }) =>
  state.shopping.pollingInterval;

export default shoppingSlice.reducer;

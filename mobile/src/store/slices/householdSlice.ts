import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HouseholdState, Household, HouseholdWithMembers } from '@/types';

const initialState: HouseholdState = {
  activeHouseholdId: null,
  households: [],
  currentHousehold: null,
};

const householdSlice = createSlice({
  name: 'household',
  initialState,
  reducers: {
    setActiveHousehold: (state, action: PayloadAction<string | null>) => {
      state.activeHouseholdId = action.payload;
    },
    setHouseholds: (state, action: PayloadAction<Household[]>) => {
      state.households = action.payload;
    },
    setCurrentHousehold: (state, action: PayloadAction<HouseholdWithMembers | null>) => {
      state.currentHousehold = action.payload;
    },
    clearHouseholdData: (state) => {
      state.activeHouseholdId = null;
      state.households = [];
      state.currentHousehold = null;
    },
  },
});

export const { setActiveHousehold, setHouseholds, setCurrentHousehold, clearHouseholdData } =
  householdSlice.actions;

// Selectors
export const selectActiveHouseholdId = (state: { household: HouseholdState }) =>
  state.household.activeHouseholdId;
export const selectHouseholds = (state: { household: HouseholdState }) =>
  state.household.households;
export const selectCurrentHousehold = (state: { household: HouseholdState }) =>
  state.household.currentHousehold;

export default householdSlice.reducer;

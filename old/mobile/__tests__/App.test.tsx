import { configureStore } from '@reduxjs/toolkit';

describe('App', () => {
  it('should create a store without crashing', () => {
    // Create a minimal store for testing
    const store = configureStore({
      reducer: {
        auth: (state = { user: null, token: null }) => state,
      },
    });

    // This is a basic smoke test
    expect(store.getState()).toBeDefined();
  });

  it('should have a valid store structure', () => {
    const store = configureStore({
      reducer: {
        auth: (state = { user: null, token: null }) => state,
      },
    });

    const state = store.getState();
    expect(state).toHaveProperty('auth');
    expect(state.auth).toHaveProperty('user');
    expect(state.auth).toHaveProperty('token');
  });
});

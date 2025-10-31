import { configureStore } from '@reduxjs/toolkit';

// Mock auth slice for testing
const mockAuthReducer = (
  state = { user: null, token: null, isAuthenticated: false },
  action: any
) => {
  switch (action.type) {
    case 'auth/login':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
      };
    case 'auth/logout':
      return {
        user: null,
        token: null,
        isAuthenticated: false,
      };
    default:
      return state;
  }
};

describe('Auth Slice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: mockAuthReducer,
      },
    });
  });

  it('should have initial state', () => {
    const state = store.getState() as any;
    expect(state.auth).toEqual({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });

  it('should handle login action', () => {
    const loginPayload = {
      user: { id: 1, email: 'test@example.com' },
      token: 'fake-token-123',
    };

    store.dispatch({ type: 'auth/login', payload: loginPayload });

    const state = store.getState() as any;
    expect(state.auth.isAuthenticated).toBe(true);
    expect(state.auth.user).toEqual(loginPayload.user);
    expect(state.auth.token).toBe(loginPayload.token);
  });

  it('should handle logout action', () => {
    // First login
    store.dispatch({
      type: 'auth/login',
      payload: {
        user: { id: 1, email: 'test@example.com' },
        token: 'fake-token',
      },
    });

    // Then logout
    store.dispatch({ type: 'auth/logout' });

    const state = store.getState() as any;
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state.auth.user).toBeNull();
    expect(state.auth.token).toBeNull();
  });
});

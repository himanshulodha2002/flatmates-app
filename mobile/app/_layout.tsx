import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { PaperProvider } from 'react-native-paper';

import { store, persistor } from '../src/store';
import { theme } from '../src/theme/theme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <RootLayoutNav />
      </PersistGate>
    </Provider>
  );
}

function RootLayoutNav() {
  const { useRouter, useSegments } = require('expo-router');
  const router = useRouter();
  const segments = useSegments();
  const { useSelector } = require('react-redux');
  const { selectIsAuthenticated } = require('../src/store/slices/authSlice');
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && inAuthGroup) {
      // Redirect to login if not authenticated and trying to access protected routes
      router.replace('/login');
    } else if (isAuthenticated && !inAuthGroup) {
      // Redirect to tabs if authenticated and on login screen
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments]);

  return (
    <PaperProvider theme={theme}>
      <ThemeProvider value={DarkTheme}>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="create-household"
            options={{
              title: 'Create Household',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="join-household"
            options={{
              title: 'Join Household',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="household-switcher"
            options={{
              title: 'Switch Household',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="members"
            options={{
              title: 'Household Members',
            }}
          />
        </Stack>
      </ThemeProvider>
    </PaperProvider>
  );
}

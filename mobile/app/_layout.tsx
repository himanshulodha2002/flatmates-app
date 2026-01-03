import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { store, persistor } from '../src/store';
import { theme } from '../src/theme/theme';
import { useNotifications } from '../src/hooks/useNotifications';
import { selectIsAuthenticated, setCredentials } from '../src/store/slices/authSlice';
import { setActiveHousehold, setCurrentHousehold } from '../src/store/slices/householdSlice';

// Web-compatible storage helper
const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  } else {
    return await AsyncStorage.getItem(key);
  }
};

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
  const router = useRouter();
  const segments = useSegments();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [offlineModeChecked, setOfflineModeChecked] = useState(false);

  // Initialize push notifications
  const { permissionStatus, requestPermissions } = useNotifications();

  // Check if onboarding is completed
  useEffect(() => {
    const checkOnboarding = async () => {
      const completed = await getStorageItem('onboarding_completed');
      setOnboardingCompleted(completed === 'true');
    };
    checkOnboarding();
  }, []);

  // Check and restore offline mode on app start
  useEffect(() => {
    const restoreOfflineMode = async () => {
      try {
        const offlineMode = await import('../src/utils/offlineMode');
        const offlineEnabled = await offlineMode.isOfflineModeEnabled();

        if (offlineEnabled && !isAuthenticated) {
          console.log('Restoring offline mode...');
          const user = await offlineMode.getOfflineUser();
          const household = await offlineMode.getOfflineHousehold();

          if (user && household) {
            // Restore user and household to Redux
            dispatch(setCredentials({ user, token: 'offline' }));
            dispatch(setActiveHousehold(household.id));
            dispatch(setCurrentHousehold(household));
            console.log('Offline mode restored');
          }
        }
      } catch (error) {
        console.error('Error restoring offline mode:', error);
      } finally {
        setOfflineModeChecked(true);
      }
    };

    restoreOfflineMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (onboardingCompleted === null || !offlineModeChecked) return; // Wait for checks

    const inAuthGroup = segments[0] === '(tabs)';
    const onOnboardingScreen = segments[0] === 'onboarding';
    const onLoginScreen = segments[0] === 'login';
    const onCreateHouseholdScreen = segments[0] === 'create-household';
    const onJoinHouseholdScreen = segments[0] === 'join-household';
    const onHouseholdSwitcherScreen = segments[0] === 'household-switcher';
    const onMembersScreen = segments[0] === 'members';

    // First time users should see onboarding
    if (!onboardingCompleted && !onOnboardingScreen) {
      router.replace('/onboarding');
      return;
    }

    // After onboarding is completed, handle authentication routing
    if (onboardingCompleted) {
      // If not authenticated and trying to access protected routes, go to login
      if (!isAuthenticated && inAuthGroup) {
        router.replace('/login');
        return;
      }

      // If authenticated and still on login or onboarding, go to tabs
      if (isAuthenticated && (onLoginScreen || onOnboardingScreen)) {
        router.replace('/(tabs)');
        return;
      }

      // Allow access to household-related screens when authenticated
      // No need to redirect if on these screens
      if (
        isAuthenticated &&
        (onCreateHouseholdScreen ||
          onJoinHouseholdScreen ||
          onHouseholdSwitcherScreen ||
          onMembersScreen)
      ) {
        return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, segments, onboardingCompleted, offlineModeChecked]);

  // Request notification permissions when authenticated
  useEffect(() => {
    if (isAuthenticated && permissionStatus === 'undetermined') {
      requestPermissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, permissionStatus]);

  return (
    <PaperProvider theme={theme}>
      <ThemeProvider value={DarkTheme}>
        <Stack>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
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

# Flatmates Mobile App

A React Native mobile application for flatmates to manage shared todos, shopping lists, and expenses. Built with Expo, TypeScript, Redux Toolkit, and Material Design 3 dark theme.

## Features

- 📱 Cross-platform (Android & iOS)
- 🎨 Material Design 3 Dark Theme
- 🗂️ File-based routing with Expo Router
- 🔄 Redux Toolkit for state management
- 💾 Redux Persist with AsyncStorage for offline-first architecture
- 🔐 Authentication ready with RTK Query
- 📡 API integration with axios and RTK Query

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn**
- **Expo CLI** (will be installed automatically)
- **Android Studio** (for Android development) - [Download](https://developer.android.com/studio)
- **Expo Go App** (optional, for testing on physical devices)

## Installation

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development

### Start the development server:
```bash
npm start
# or
npx expo start
```

This will open the Expo DevTools in your browser. From here, you can:
- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator (macOS only)
- Scan the QR code with Expo Go app on your physical device

### Run on Android:
```bash
npm run android
# or
npx expo start --android
```

### Run on iOS (macOS only):
```bash
npm run ios
# or
npx expo start --ios
```

### Run on Web:
```bash
npm run web
# or
npx expo start --web
```

## Project Structure

```
mobile/
├── app/                          # Expo Router file-based routing
│   ├── (tabs)/                   # Tab navigation group
│   │   ├── _layout.tsx           # Tab navigation layout
│   │   ├── index.tsx             # Home screen
│   │   ├── todos.tsx             # Todos screen
│   │   ├── shopping.tsx          # Shopping screen
│   │   ├── expenses.tsx          # Expenses screen
│   │   └── profile.tsx           # Profile screen
│   └── _layout.tsx               # Root layout with providers
├── src/
│   ├── components/               # Reusable React components
│   │   └── README.md
│   ├── store/                    # Redux store configuration
│   │   ├── index.ts              # Store setup with persistence
│   │   ├── slices/
│   │   │   └── authSlice.ts      # Authentication slice
│   │   └── services/
│   │       └── api.ts            # RTK Query API service
│   ├── theme/
│   │   └── theme.ts              # Material Design 3 dark theme
│   ├── types/
│   │   └── index.ts              # TypeScript type definitions
│   └── utils/
│       └── storage.ts            # AsyncStorage utilities
├── assets/                       # Static assets (images, fonts)
├── app.json                      # Expo configuration
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device (macOS only)
- `npm run web` - Run in web browser

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Linting and Type Checking

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# TypeScript type checking
npm run type-check

# Format code with Prettier
npm run format
```

## Building for Production

### EAS Build Setup

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure EAS project**
   ```bash
   eas build:configure
   ```

### Build for Android

```bash
# Development build (APK)
eas build --platform android --profile development

# Preview build (APK for testing)
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production
```

### Build for iOS

```bash
# Development build
eas build --platform ios --profile development

# Preview build (simulator)
eas build --platform ios --profile preview

# Production build
eas build --platform ios --profile production
```

### Submit to App Stores

```bash
# Submit to Google Play Store
eas submit --platform android

# Submit to Apple App Store
eas submit --platform ios
```

For more build options, refer to [EAS Build Documentation](https://docs.expo.dev/build/introduction/).

## 🔐 Google OAuth Configuration

The app uses Google Sign-In for authentication. Follow these steps to configure it:

### 1. Prerequisites

You need to have a Google Cloud Project with OAuth 2.0 credentials configured. If you haven't done this yet, see the backend README for detailed instructions on setting up Google Cloud Console.

### 2. Get Web Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID for **Web application**
4. Copy the **Client ID** (it should end with `.apps.googleusercontent.com`)

**Important:** You need the **Web Client ID**, not the Android or iOS client ID. The `@react-native-google-signin/google-signin` library uses the web client ID for React Native apps.

### 3. Configure Environment Variables

Create or update `.env.development` file in the mobile directory:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

For physical device testing, replace `localhost` with your computer's local IP address:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api/v1
```

### 4. Authentication Flow

1. User taps "Sign in with Google" button on the login screen
2. Google Sign-In opens and user authenticates
3. App receives Google ID token
4. App sends ID token to backend at `/api/v1/auth/google/mobile`
5. Backend verifies token with Google and creates/updates user
6. Backend returns JWT access token
7. App stores token and user data in Redux (persisted to AsyncStorage)
8. User is redirected to the main app

### 5. Protected Routes

The app automatically handles authentication:
- Unauthenticated users are redirected to `/login`
- Authenticated users can access all tab screens
- JWT token is included in all API requests via Authorization header
- Token persists across app restarts

## Connecting to Backend API

The app is configured to connect to a backend API. By default, it uses:
```
http://localhost:8000/api/v1
```

To change the API URL:

1. Create a `.env` file in the mobile directory:
   ```
   EXPO_PUBLIC_API_URL=https://your-api-url.com/api/v1
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
   ```

2. The API service (`src/store/services/api.ts`) will automatically use this URL.

**Note:** For testing on a physical device, replace `localhost` with your computer's local IP address (e.g., `http://192.168.1.100:8000/api/v1`).

## Configuration

### TypeScript Path Aliases

The project uses path aliases for cleaner imports:
```typescript
import { theme } from '@/theme/theme';
import { User } from '@/types';
```

These are configured in `tsconfig.json`.

### Dark Theme

The app uses Material Design 3 dark theme exclusively. Theme configuration can be found in `src/theme/theme.ts`.

### Redux Store

The Redux store is configured with:
- **Redux Persist**: Persists auth state to AsyncStorage
- **RTK Query**: For API calls with automatic caching
- **Type Safety**: Full TypeScript support with RootState and AppDispatch types

## State Management

### Using Redux Hooks

```typescript
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';

// In your component
const user = useSelector((state: RootState) => state.auth.user);
const dispatch = useDispatch<AppDispatch>();
```

### Using RTK Query

```typescript
import { useHealthCheckQuery } from '@/store/services/api';

// In your component
const { data, error, isLoading } = useHealthCheckQuery();
```

## 🔄 CI/CD

### GitHub Actions Workflow

The mobile CI/CD pipeline (`..github/workflows/mobile-ci.yml`) runs automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` branch

**Test Job:**
- Sets up Node.js 18 with dependency caching
- Installs dependencies
- Runs ESLint for code quality
- Runs TypeScript type checking
- Runs Jest tests with coverage reporting
- Uploads coverage to Codecov

**Build Job:**
- Triggers on push to main branch
- Builds Android APK using EAS
- Uploads build artifacts

### Build Status

![Mobile CI/CD](https://github.com/himanshulodha2002/flatmates-app/workflows/Mobile%20CI%2FCD/badge.svg)

### Running CI Locally

You can run the same checks locally before pushing:

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Run tests
npm test
```

## Troubleshooting

### Metro bundler issues:
```bash
# Clear cache and restart
npx expo start -c
```

### Android build issues:
```bash
# Clean Android build
cd android
./gradlew clean
cd ..
```

### Dependency conflicts:
```bash
# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### Cannot connect to API from device:
- Make sure your device and computer are on the same network
- Use your computer's local IP address instead of `localhost`
- Check firewall settings

### TypeScript errors:
```bash
# Regenerate TypeScript types
npx expo customize tsconfig.json
```

## Technologies Used

- **React Native** - Mobile framework
- **Expo** - Development platform and tooling
- **TypeScript** - Type safety
- **Expo Router** - File-based navigation
- **Redux Toolkit** - State management
- **RTK Query** - Data fetching and caching
- **Redux Persist** - State persistence
- **React Native Paper** - Material Design 3 components
- **AsyncStorage** - Local storage
- **Axios** - HTTP client

## Development Tips

1. **Hot Reload**: Enabled by default. Save files to see changes instantly.
2. **Debug Menu**: Shake your device or press `Cmd+D` (iOS) / `Cmd+M` (Android) to open the debug menu.
3. **Remote Debugging**: Use Chrome DevTools or React Native Debugger for debugging.
4. **TypeScript**: The project uses strict TypeScript. Always define types for your components and functions.
5. **Dark Theme Only**: The app is designed exclusively for dark mode. Don't add light theme support.

## Contributing

When contributing to this project:
1. Follow the existing code structure and naming conventions
2. Use TypeScript for all new files
3. Use React Native Paper components when possible
4. Ensure all screens work in dark theme
5. Test on both Android and iOS (if possible)
6. Update this README if you add new features or change the structure

## License

This project is part of the Flatmates App. All rights reserved.

## Support

For issues and questions:
- Check the [Expo documentation](https://docs.expo.dev/)
- Check the [React Native Paper documentation](https://callstack.github.io/react-native-paper/)
- Review the project's GitHub issues

## Authentication Screens

The app includes the following authentication screens:

### Login Screen (`/login`)
- Google Sign-In button with Material Design 3 styling
- App title and description
- Error handling for failed authentication
- Loading state during sign-in process

### Profile Screen (`/(tabs)/profile`)
- User avatar (from Google profile picture)
- User name and email
- Account information (status, member since)
- Logout button with confirmation dialog

## Next Steps

- [x] Implement authentication screens
- [ ] Add real-time WebSocket support
- [ ] Implement todo list management
- [ ] Add shopping list features
- [ ] Build expense tracking and splitting
- [ ] Add push notifications
- [ ] Implement offline mode with sync

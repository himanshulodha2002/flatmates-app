// Dynamic app configuration based on environment
module.exports = () => {
  const environment = process.env.EXPO_PUBLIC_ENVIRONMENT || 'development';
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  return {
    expo: {
      name: 'Flatmates',
      slug: 'flatmates-app',
      version: '1.0.0',
      orientation: 'portrait',
      icon: './assets/images/icon.png',
      scheme: 'flatmates',
      userInterfaceStyle: 'dark',
      newArchEnabled: true,
      splash: {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#121212',
      },
      ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.flatmates.app',
      },
      android: {
        package: 'com.flatmates.app',
        adaptiveIcon: {
          foregroundImage: './assets/images/adaptive-icon.png',
          backgroundColor: '#121212',
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
      },
      web: {
        bundler: 'metro',
        output: 'static',
        favicon: './assets/images/favicon.png',
      },
      plugins: ['expo-router'],
      experiments: {
        typedRoutes: true,
      },
      extra: {
        apiUrl,
        environment,
        eas: {
          projectId: process.env.EAS_PROJECT_ID || '', // Set EAS_PROJECT_ID environment variable
        },
      },
    },
  };
};

import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View, Platform } from 'react-native';
import { Button, Surface, Text } from 'react-native-paper';

// Web-compatible storage helper
const setStorageItem = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error storing data:', error);
    }
  } else {
    await AsyncStorage.setItem(key, value);
  }
};

const { width } = Dimensions.get('window');

interface OnboardingStep {
  title: string;
  description: string;
  icon: string;
  color: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: 'Welcome to Flatmates',
    description:
      'Manage your shared living expenses, shopping lists, and household tasks all in one place.',
    icon: 'home-account',
    color: '#BB86FC',
  },
  {
    title: 'Track Expenses Together',
    description: 'Split bills fairly, track payments, and see who owes what at a glance.',
    icon: 'currency-usd',
    color: '#03DAC6',
  },
  {
    title: 'Shared Shopping Lists',
    description:
      'Create collaborative shopping lists, mark items as purchased, and never forget what to buy.',
    icon: 'cart',
    color: '#CF6679',
  },
  {
    title: 'Manage Tasks & Todos',
    description: 'Assign household chores, set priorities, and keep everyone on the same page.',
    icon: 'format-list-checkbox',
    color: '#BB86FC',
  },
  {
    title: 'AI-Powered Features',
    description:
      'Smart expense categorization, receipt scanning, and task suggestions to make life easier.',
    icon: 'robot',
    color: '#03DAC6',
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({
        x: (currentStep + 1) * width,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = async () => {
    // Mark onboarding as completed
    await setStorageItem('onboarding_completed', 'true');
    router.replace('/login');
  };

  const step = onboardingSteps[currentStep];

  return (
    <Surface style={styles.container}>
      {/* Skip button */}
      {currentStep < onboardingSteps.length - 1 && (
        <Button
          mode="text"
          onPress={handleSkip}
          style={styles.skipButton}
          labelStyle={styles.skipText}
        >
          Skip
        </Button>
      )}

      {/* Content */}
      <View style={styles.content}>
        <MaterialCommunityIcons
          name={step.icon as any}
          size={120}
          color={step.color}
          style={styles.icon}
        />

        <Text variant="headlineLarge" style={styles.title}>
          {step.title}
        </Text>

        <Text variant="bodyLarge" style={styles.description}>
          {step.description}
        </Text>
      </View>

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {onboardingSteps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentStep && styles.dotActive,
              { backgroundColor: index === currentStep ? step.color : '#666' },
            ]}
          />
        ))}
      </View>

      {/* Navigation buttons */}
      <View style={styles.buttons}>
        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.nextButton}
          labelStyle={styles.buttonLabel}
          contentStyle={styles.buttonContent}
        >
          {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
        </Button>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  skipButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  skipText: {
    color: '#B0B0B0',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  icon: {
    marginBottom: 40,
  },
  title: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  description: {
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  dotActive: {
    width: 30,
    height: 10,
    borderRadius: 5,
  },
  buttons: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  nextButton: {
    borderRadius: 25,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

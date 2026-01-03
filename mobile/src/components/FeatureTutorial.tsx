import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { Text, Button, Surface, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TutorialStep {
  title: string;
  description: string;
  icon?: string;
  action?: string;
}

interface FeatureTutorialProps {
  featureKey: string;
  steps: TutorialStep[];
  visible: boolean;
  onDismiss: () => void;
}

/**
 * Interactive tutorial component for introducing users to specific features
 */
export function FeatureTutorial({ featureKey, steps, visible, onDismiss }: FeatureTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    // Mark this tutorial as completed
    await AsyncStorage.setItem(`tutorial_${featureKey}`, 'completed');
    setCurrentStep(0);
    onDismiss();
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(`tutorial_${featureKey}`, 'skipped');
    setCurrentStep(0);
    onDismiss();
  };

  const step = steps[currentStep];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleSkip}>
      <View style={styles.overlay}>
        <Surface style={styles.container}>
          {/* Close button */}
          <IconButton icon="close" size={24} onPress={handleSkip} style={styles.closeButton} />

          {/* Icon */}
          {step.icon && (
            <MaterialCommunityIcons
              name={step.icon as any}
              size={64}
              color="#BB86FC"
              style={styles.icon}
            />
          )}

          {/* Content */}
          <Text variant="headlineSmall" style={styles.title}>
            {step.title}
          </Text>

          <Text variant="bodyMedium" style={styles.description}>
            {step.description}
          </Text>

          {step.action && (
            <Surface style={styles.actionBox}>
              <Text variant="bodySmall" style={styles.actionText}>
                {step.action}
              </Text>
            </Surface>
          )}

          {/* Progress dots */}
          <View style={styles.pagination}>
            {steps.map((_, index) => (
              <View key={index} style={[styles.dot, index === currentStep && styles.dotActive]} />
            ))}
          </View>

          {/* Navigation */}
          <View style={styles.buttons}>
            <Button mode="text" onPress={handleSkip} style={styles.skipButton}>
              Skip
            </Button>
            <Button mode="contained" onPress={handleNext} style={styles.nextButton}>
              {currentStep === steps.length - 1 ? 'Got it!' : 'Next'}
            </Button>
          </View>
        </Surface>
      </View>
    </Modal>
  );
}

/**
 * Check if a tutorial has been completed
 */
export async function isTutorialCompleted(featureKey: string): Promise<boolean> {
  const status = await AsyncStorage.getItem(`tutorial_${featureKey}`);
  return status === 'completed' || status === 'skipped';
}

/**
 * Reset tutorial completion status (useful for testing)
 */
export async function resetTutorial(featureKey: string): Promise<void> {
  await AsyncStorage.removeItem(`tutorial_${featureKey}`);
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: 'bold',
  },
  description: {
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  actionBox: {
    backgroundColor: '#121212',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#BB86FC',
  },
  actionText: {
    color: '#03DAC6',
    fontWeight: '500',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    height: 8,
    backgroundColor: '#BB86FC',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
    marginLeft: 8,
  },
});

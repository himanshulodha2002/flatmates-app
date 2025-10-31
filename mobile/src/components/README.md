# Components

This directory contains reusable React components for the Flatmates app.

## Structure

Components should be organized by feature or functionality:

- **common/**: Shared UI components (buttons, inputs, cards, etc.)
- **layout/**: Layout components (headers, footers, containers, etc.)
- **features/**: Feature-specific components

## Guidelines

- Use functional components with hooks
- Follow TypeScript best practices
- Use React Native Paper components when possible
- Style components with the Material Design 3 dark theme
- Write reusable, testable components
- Add proper TypeScript types for props

## Example

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';

interface MyComponentProps {
  title: string;
  onPress: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onPress }) => {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">{title}</Text>
      <Button mode="contained" onPress={onPress}>
        Click me
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
```

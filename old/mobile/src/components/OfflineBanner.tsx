import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Banner } from 'react-native-paper';
import { isOfflineModeEnabled } from '../utils/offlineMode';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const checkOfflineMode = async () => {
      const offline = await isOfflineModeEnabled();
      setIsOffline(offline);
    };
    checkOfflineMode();
  }, []);

  if (!isOffline) return null;

  return (
    <Banner
      visible={visible}
      actions={[
        {
          label: 'Dismiss',
          onPress: () => setVisible(false),
        },
      ]}
      icon="wifi-off"
      style={styles.banner}
    >
      You're in offline mode. Data is stored locally and won't sync until you connect to a backend.
    </Banner>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFC107',
  },
});

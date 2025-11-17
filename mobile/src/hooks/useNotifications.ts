import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { NotificationData } from '@/types/notification';

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Set up notification channels for Android
    if (Platform.OS === 'android') {
      setupNotificationChannels();
    }

    // Register for push notifications
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
      }
    });

    // Listen for notifications while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // Handle notification tap - navigate to relevant screen based on notification data
      const data = response.notification.request.content.data;
      handleNotificationResponse(data);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const setupNotificationChannels = async () => {
    // Create notification channels for Android 8.0+
    await Notifications.setNotificationChannelAsync('expenses', {
      name: 'Expenses',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#BB86FC',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('shopping', {
      name: 'Shopping Lists',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#03DAC6',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('todos', {
      name: 'Tasks & Todos',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#CF6679',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('household', {
      name: 'Household Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#BB86FC',
      sound: 'default',
    });
  };

  const registerForPushNotificationsAsync = async (): Promise<string | undefined> => {
    let token;

    if (Platform.OS === 'android') {
      // For Android 13+, request permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      setPermissionStatus(finalStatus as 'granted' | 'denied');

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
    }

    if (Device.isDevice) {
      try {
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
          })
        ).data;
      } catch (error) {
        console.error('Error getting push token:', error);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  };

  const handleNotificationResponse = (data: any) => {
    // Handle navigation based on notification type
    // This will be called when user taps on a notification
    console.log('Notification tapped:', data);

    // TODO: Add navigation logic based on notification type
    // Example: router.push(`/expenses/${data.expenseId}`)
  };

  const scheduleLocalNotification = async (notificationData: NotificationData) => {
    const channelId = getChannelIdForType(notificationData.type);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationData.title,
        body: notificationData.body,
        data: notificationData.data || {},
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Show immediately
    });
  };

  const getChannelIdForType = (type: string): string => {
    if (type.startsWith('expense')) return 'expenses';
    if (type.startsWith('shopping')) return 'shopping';
    if (type.startsWith('todo')) return 'todos';
    return 'household';
  };

  const requestPermissions = async (): Promise<boolean> => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status as 'granted' | 'denied');
    return status === 'granted';
  };

  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const getBadgeCount = async (): Promise<number> => {
    return await Notifications.getBadgeCountAsync();
  };

  const setBadgeCount = async (count: number) => {
    await Notifications.setBadgeCountAsync(count);
  };

  return {
    expoPushToken,
    notification,
    permissionStatus,
    scheduleLocalNotification,
    requestPermissions,
    cancelAllNotifications,
    getBadgeCount,
    setBadgeCount,
  };
}

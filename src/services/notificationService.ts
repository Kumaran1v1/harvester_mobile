import {
  getMessaging,
  requestPermission,
  getToken,
  onTokenRefresh,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  AuthorizationStatus,
  RemoteMessage,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import apiClient from '../api/client';
import { storage } from './storage';

export type NotificationOpenHandler = (remoteMessage: RemoteMessage) => void;
export type TokenRefreshHandler = (token: string) => void;

/**
 * Request notification permissions on Android (API 33+) and iOS
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        console.log(`[FCM] Permission: ${isGranted ? 'granted' : 'denied'}`);
        return isGranted;
      }
      console.log('[FCM] Permission: granted (Android < 33)');
      return true;
    }

    const messaging = getMessaging();
    const authStatus = await requestPermission(messaging);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;
    console.log(`[FCM] Permission: ${enabled ? 'granted' : 'denied'}`);
    return enabled;
  } catch (error) {
    console.error('[FCM] Error requesting permission:', error);
    return false;
  }
}

/**
 * Retrieve the current FCM token for this device
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('[FCM] Permission denied, cannot get FCM token');
      return null;
    }

    const messaging = getMessaging();
    const token = await getToken(messaging);
    console.log('[FCM] Device Token:\n' + token);
    return token;
  } catch (error) {
    console.error('[FCM] Error fetching device token:', error);
    return null;
  }
}

/**
 * Register device installation ID and FCM token with harvester_web_be
 */
export async function syncDeviceWithBackend(token: string): Promise<boolean> {
  try {
    const authToken = await storage.getToken();
    if (!authToken) {
      console.log('[FCM] User not logged in yet. Device sync will occur after login.');
      return false;
    }

    const deviceId = await storage.getDeviceId();
    await apiClient.post('/device/register', {
      deviceId,
      fcmToken: token,
      platform: Platform.OS,
    });
    console.log(`[FCM] Device (${deviceId}) successfully registered with backend.`);
    return true;
  } catch (error: any) {
    console.warn('[FCM] Could not sync device with backend:', error?.response?.data?.message || error?.message);
    return false;
  }
}

/**
 * Subscribe to token refresh events.
 * Firebase can issue a new token when the app is restored, uninstalled/reinstalled,
 * or when the token is invalidated.
 */
export function setupTokenRefreshListener(onRefresh?: TokenRefreshHandler) {
  const messaging = getMessaging();
  return onTokenRefresh(messaging, async token => {
    console.log('[FCM] Token refreshed:\n' + token);
    await syncDeviceWithBackend(token);
    if (onRefresh) {
      onRefresh(token);
    }
  });
}

/**
 * Listen for incoming messages while the app is actively in the FOREGROUND.
 */
export function setupForegroundNotificationListener(
  onMessageReceived?: (message: RemoteMessage) => void
) {
  const messaging = getMessaging();
  return onMessage(messaging, async remoteMessage => {
    console.log('[FCM] Foreground message:\n', JSON.stringify(remoteMessage, null, 2));
    if (onMessageReceived) {
      onMessageReceived(remoteMessage);
    }
  });
}

/**
 * Listen for notification click events when the app is running in BACKGROUND.
 */
export function setupNotificationOpenedListener(onOpened?: NotificationOpenHandler) {
  const messaging = getMessaging();
  return onNotificationOpenedApp(messaging, remoteMessage => {
    console.log('[FCM] Notification opened (from background):\n', JSON.stringify(remoteMessage, null, 2));
    if (onOpened) {
      onOpened(remoteMessage);
    }
  });
}

/**
 * Check if the app was opened from a QUIT/KILLED state via a notification click.
 */
export async function checkInitialNotification(onOpened?: NotificationOpenHandler) {
  try {
    const messaging = getMessaging();
    const remoteMessage = await getInitialNotification(messaging);
    if (remoteMessage) {
      console.log('[FCM] Notification opened (from quit state):\n', JSON.stringify(remoteMessage, null, 2));
      if (onOpened) {
        onOpened(remoteMessage);
      }
    }
    return remoteMessage;
  } catch (error) {
    console.error('[FCM] Error checking initial notification:', error);
    return null;
  }
}

/**
 * Route notification tap to the appropriate screen
 */
export function handleNotificationTapNavigation(navigation: any, remoteMessage: RemoteMessage) {
  const type = remoteMessage?.data?.type;
  const targetScreen = remoteMessage?.data?.screen;

  if (targetScreen === 'OperatorsTab' || type === 'ATTENDANCE_REMINDER') {
    navigation.navigate('Main', { screen: 'OperatorsTab' });
  } else {
    navigation.navigate('Main', { screen: 'DashboardTab' });
  }
}

/**
 * Master initialization function to register all FCM listeners
 */
export async function initializeFCM(callbacks?: {
  onToken?: (token: string) => void;
  onTokenRefresh?: TokenRefreshHandler;
  onForegroundMessage?: (message: RemoteMessage) => void;
  onNotificationOpened?: NotificationOpenHandler;
}) {
  // 1. Get initial token
  const token = await getFCMToken();
  if (token) {
    await syncDeviceWithBackend(token);
    if (callbacks?.onToken) {
      callbacks.onToken(token);
    }
  }

  // 2. Setup token refresh
  const unsubTokenRefresh = setupTokenRefreshListener(callbacks?.onTokenRefresh);

  // 3. Setup foreground handler
  const unsubForeground = setupForegroundNotificationListener(callbacks?.onForegroundMessage);

  // 4. Setup notification click when in background
  const unsubNotificationOpened = setupNotificationOpenedListener(callbacks?.onNotificationOpened);

  // 5. Check if launched from quit state
  await checkInitialNotification(callbacks?.onNotificationOpened);

  return () => {
    unsubTokenRefresh();
    unsubForeground();
    unsubNotificationOpened();
  };
}

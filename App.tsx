import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initializeFCM, handleNotificationTapNavigation } from './src/services/notificationService';
import { navigationRef } from './src/navigation/navigationRef';

export default function App() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    initializeFCM({
      onToken: _token => {},
      onTokenRefresh: _newToken => {},
      onForegroundMessage: remoteMessage => {
        console.log('[FCM] Foreground alert:', remoteMessage.notification?.title);
      },
      onNotificationOpened: remoteMessage => {
        handleNotificationTapNavigation(navigationRef, remoteMessage);
      },
    }).then(unsub => {
      cleanup = unsub;
    });

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

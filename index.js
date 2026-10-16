/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

const messaging = getMessaging();

// Register background message handler (must be outside component tree)
setBackgroundMessageHandler(messaging, async remoteMessage => {
  console.log('[FCM] Message handled in background/quit state:\n', JSON.stringify(remoteMessage, null, 2));
});

AppRegistry.registerComponent(appName, () => App);


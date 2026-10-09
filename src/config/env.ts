import { Platform } from 'react-native';

// Local Development Backend (Android Emulator: 10.0.2.2 points to host machine)
const DEV_LOCAL_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

// For Physical Mobile device connected over Wi-Fi, change to your machine's LAN IP:
// const DEV_LAN_URL = 'http://192.168.1.X:5000/api';

export const BASE_URL = DEV_LOCAL_URL;


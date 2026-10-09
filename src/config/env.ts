import { Platform } from 'react-native';

// -------------------------------------------------------------
// 1. Live Production Backend (Render)
// -------------------------------------------------------------
const LIVE_API_URL = 'https://harvester-web-be.onrender.com/api';

// -------------------------------------------------------------
// 2. Local Development Backend (for local testing if needed)
// -------------------------------------------------------------
const DEV_LOCAL_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
const DEV_LAN_URL = 'http://172.30.50.251:5000/api';

// -------------------------------------------------------------
// 3. Active Base URL (Currently Active: Live Render Production Server)
// -------------------------------------------------------------
export const DEFAULT_SERVER_URL = LIVE_API_URL;
export const BASE_URL = LIVE_API_URL;

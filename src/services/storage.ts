import * as Keychain from 'react-native-keychain';

const TOKEN_SERVICE = 'com.harvester.auth.token';
const USER_SERVICE = 'com.harvester.auth.user';

export const storage = {
  // Save JWT Token
  async saveToken(token: string): Promise<void> {
    await Keychain.setGenericPassword('auth_token', token, {
      service: TOKEN_SERVICE,
    });
  },

  // Retrieve JWT Token
  async getToken(): Promise<string | null> {
    const credentials = await Keychain.getGenericPassword({
      service: TOKEN_SERVICE,
    });
    return credentials ? credentials.password : null;
  },

  // Save User Profile JSON
  async saveUser(user: any): Promise<void> {
    await Keychain.setGenericPassword('user_data', JSON.stringify(user), {
      service: USER_SERVICE,
    });
  },

  // Retrieve User Profile JSON
  async getUser(): Promise<any | null> {
    const credentials = await Keychain.getGenericPassword({
      service: USER_SERVICE,
    });
    if (!credentials) return null;
    try {
      return JSON.parse(credentials.password);
    } catch {
      return null;
    }
  },

  // Clear Session on Logout
  async clear(): Promise<void> {
    await Keychain.resetGenericPassword({ service: TOKEN_SERVICE });
    await Keychain.resetGenericPassword({ service: USER_SERVICE });
  },

  // Save Custom Server URL
  async saveServerUrl(url: string): Promise<void> {
    await Keychain.setGenericPassword('server_url', url, {
      service: 'com.harvester.server.url',
    });
  },

  // Retrieve Custom Server URL
  async getServerUrl(): Promise<string | null> {
    const creds = await Keychain.getGenericPassword({
      service: 'com.harvester.server.url',
    });
    return creds ? creds.password : null;
  },

  // Get or Generate unique device installation ID
  async getDeviceId(): Promise<string> {
    const creds = await Keychain.getGenericPassword({
      service: 'com.harvester.device.id',
    });
    if (creds && creds.password) {
      return creds.password;
    }
    const newId = 'inst_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    await Keychain.setGenericPassword('device_id', newId, {
      service: 'com.harvester.device.id',
    });
    return newId;
  },
};


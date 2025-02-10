import { Platform } from 'react-native';
import { Settings } from 'react-native-fbsdk-next';

export const initializeFacebookSDK = () => {
  // Initialize the Facebook SDK
  Settings.initializeSDK();
  
  // Additional configuration if needed
  Settings.setAppID('1651835995724349');
  
  if (Platform.OS === 'android') {
    Settings.setClientToken('ed90fc22baea5186c74c61fd291b5ece');
  }
};
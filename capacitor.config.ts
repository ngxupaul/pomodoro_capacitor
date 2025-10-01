import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.pomodoro',
  appName: 'Pomodoro Timer',
  webDir: 'build',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav',
    },
  },
  ios: {
    scheme: 'Pomodoro Timer'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;

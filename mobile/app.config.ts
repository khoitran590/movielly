import type { ExpoConfig, ConfigContext } from 'expo/config';

const sentryPlugins: NonNullable<ExpoConfig['plugins']> = process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
  ? [['@sentry/react-native/expo', { organization: process.env.SENTRY_ORG, project: process.env.SENTRY_PROJECT }]]
  : [];

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Movielly',
  slug: 'movielly',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  scheme: 'movielly',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'app.movielly.mobile',
    associatedDomains: process.env.EXPO_PUBLIC_SITE_DOMAIN ? [`applinks:${process.env.EXPO_PUBLIC_SITE_DOMAIN}`] : [],
    infoPlist: { NSPhotoLibraryUsageDescription: 'Movielly uses your photo library when you choose a profile picture.' },
  },
  android: {
    package: 'app.movielly.mobile',
    adaptiveIcon: { backgroundColor: '#0b0a09' },
    intentFilters: process.env.EXPO_PUBLIC_SITE_DOMAIN ? [{ action: 'VIEW', autoVerify: true, data: [{ scheme: 'https', host: process.env.EXPO_PUBLIC_SITE_DOMAIN, pathPrefix: '/list' }], category: ['BROWSABLE', 'DEFAULT'] }] : [],
  },
  plugins: [
    'expo-router',
    ['expo-secure-store', { configureAndroidBackup: true, faceIDPermission: 'Allow Movielly to securely restore your session.' }],
    ['expo-image-picker', { photosPermission: 'Movielly uses your photo library when you choose a profile picture.', cameraPermission: false }],
    ...sentryPlugins,
  ],
  experiments: { typedRoutes: true },
  extra: { eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || undefined } },
});

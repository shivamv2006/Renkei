/**
 * Renkei — Central Branding & Identity Configuration
 *
 * "stay in sync • connect & coordinate"
 */

export const BRANDING = {
  // Primary App Identity (Capital R as requested)
  appName: 'Renkei',
  tagline: 'stay in sync • connect & coordinate',
  shortDescription: 'Modern, high-performance real-time messaging with voice lounge, video calls, and screen sharing.',
  websiteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://renkei.app',
  supportEmail: 'support@renkei.app',

  // Visual Theme Tokens (Renkei Signature Palettes)
  colors: {
    primary: {
      name: 'Ice Sapphire',
      hex: '#38bdf8',
      darkHex: '#2563eb',
      twClass: 'sky-400',
    },
    secondary: {
      name: 'Royal Blue',
      hex: '#2563eb',
      darkHex: '#1d4ed8',
      twClass: 'blue-600',
    },
    background: {
      light: '#f8fafc',
      dark: '#090d16',        // Renkei Deep Navy
      surfaceLight: '#ffffff',
      surfaceDark: '#0e1322', // Renkei Dark Navy Surface
    },
  },

  // Android & Mobile Release Configuration
  android: {
    displayName: 'Renkei',
    packageId: 'com.renkei.app',
    version: '2.0.0',
    versionCode: 2,
  },

  // Metadata for SEO & PWA
  meta: {
    title: 'Renkei — stay in sync • connect & coordinate',
    description: 'Connect instantly with private encrypted-transport 1-on-1 chats, group channels, Discord-style voice lounge, and real-time screen sharing.',
    keywords: ['Renkei', 'messaging', 'chat', 'webrtc', 'voice lounge', 'stay in sync', 'connect and coordinate'],
  },
} as const;

export type BrandingConfig = typeof BRANDING;

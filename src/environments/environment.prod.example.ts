// Copy this file to environment.prod.ts and fill in your own Firebase project values.
// environment.prod.ts is gitignored and must not be committed.
// In CI, this file is generated from GitHub Secrets (see .github/workflows/deploy.yaml).
export const environment = {
  production: true,
  defaultChannelId: 'YOUR_DEFAULT_CHANNEL_ID',
  firebase: {
    projectId: 'YOUR_PROJECT_ID',
    appId: 'YOUR_APP_ID',
    databaseURL: 'YOUR_DATABASE_URL',
    storageBucket: 'YOUR_STORAGE_BUCKET',
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_AUTH_DOMAIN',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  },
};

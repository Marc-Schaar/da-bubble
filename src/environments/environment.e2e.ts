// Used only for `ng serve --configuration=e2e` / `ng build --configuration=e2e`.
// Points the app at the local Firebase Emulator Suite (see firebase.json) instead of
// a real Firebase project. Not gitignored on purpose — contains no real credentials,
// the "demo-*" project id prefix is reserved by Firebase for emulator-only use.
export const environment = {
  production: false,
  useEmulators: true,
  defaultChannelId: 'allgemein',
  firebase: {
    projectId: 'demo-dabubble',
    appId: 'demo-app-id',
    databaseURL: '',
    storageBucket: '',
    apiKey: 'demo-api-key',
    authDomain: 'localhost',
    messagingSenderId: '000000000000',
  },
};

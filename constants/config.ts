/**
 * Metadata of the application
 */
export const config = {
  metadata: {
    title: '🆙AC - 🆙 Assistants Catalog',
    description: 'TBD', // todo
    url: 'https://tbd.com/', /// todo
    icon: '/logo-uap.png',
  },
  extension: {
    name: 'Universal Profiles',
    url: 'https://chrome.google.com/webstore/detail/universal-profiles/abpickdkkbnbcoepogfhkhennhfhehfn?hl=en',
  },
  walletTools: {
    // Exchange this value with your own project ID
    walletConnectProjectID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  },
};

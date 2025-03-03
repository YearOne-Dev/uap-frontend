const title = 'UP Assistants';
const description =
  'Elevate Your Digital Identity With Unstoppable Automation.';
const logo = '/logo.png';
const url = 'https://upassistants.com';
const xHandle = '@YearOneIO';

export const appMetadata = {
  title,
  description,
  logo,
  url,
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title,
    description,
    url: url,
    images: [
      {
        url: `${url}${logo}`,
        width: 1024,
        height: 1024,
        alt: title,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [`${url}${logo}`],
    creator: xHandle,
    site: url,
  },
};

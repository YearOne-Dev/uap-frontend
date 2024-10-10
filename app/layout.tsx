import { Metadata } from 'next';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { Providers } from './providers';
import './globals.css';
import { Flex } from '@chakra-ui/react';

const title = 'UAP';
const description = '';

export const metadata: Metadata = {
  title: title,
  description: description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Tomorrow:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
            }}
          >
            <NavBar />
            <Flex
              display="flex"
              flexDirection={'column'}
              w={'100%'}
              my={'30px'}
              px={{ base: '20px', md: '50px' }}
              gap={8}
              minH="calc(100vh - 230px)"
              alignItems={'flex-start'}
              justifyContent={'flex-start'}
              className="hashlists-layout"
            >
              {children}
            </Flex>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}

// theme.ts

import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const foundations = {
  colors: {
    lukso: {
      pink: '#FE005B',
    },
    uap: {
      grey: '#053241',
      orange: '#DB7C3D',
      yellow: '#FFF8DD',
      white: '#FFFFFF',
      font: '#2C5765',
    },
  },
  fontSizes: {
    tiny: '0.625rem',
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem', // h6
    lg: '1.25rem', // h5
    xl: '1.5rem', // h4
    '2xl': '1.75rem', // h3
    '3xl': '2rem', // h2
    '4xl': '4rem', // h1
  },
  lineHeight: {
    xs: '1rem',
    sm: '1.2rem',
    md: '1.375rem', // h6
    lg: '1.725rem', // h5
    xl: '2.05rem', // h4
    '2xl': '2.405rem', // h3
    '3xl': '2.75rem', // h2
    '4xl': '3.437rem', // h1
  },
  radii: {
    lg: '0.5rem',
    '4xl': '2rem',
  },
};

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const theme = extendTheme({
  ...config,
  ...foundations,
  fonts: {
    heading: `'Montserrat', sans-serif`,
    body: `'Montserrat', sans-serif`,
  },
  components: {
    Divider: {
      defaultProps: { size: 'md' },
      sizes: {
        lg: { borderWidth: '4px' },
        md: { borderWidth: '2px' },
        sm: { borderWidth: '1px' },
      },
    },
  },
  styles: {
    global: {
      body: {
        color: 'uap.font', // Default font color
        bg: 'white', // Set a default background color (optional)
      },
      html: {
        color: 'uap.font', // Ensure this also applies to the root HTML element
      },
    },
  },
});

export default theme;

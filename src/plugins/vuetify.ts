import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

// Paleta minimalista: negro elegante + blanco, con acentos en grises.
const trueShopLight = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    'surface-variant': '#F5F5F5',
    'on-surface-variant': '#1A1A1A',
    primary: '#0A0A0A',
    'on-primary': '#FFFFFF',
    secondary: '#6B6B6B',
    accent: '#1A1A1A',
    error: '#B00020',
    info: '#2B2B2B',
    success: '#1B5E20',
    warning: '#8D6E00',
  },
}

const trueShopDark = {
  dark: true,
  colors: {
    background: '#0A0A0A',
    surface: '#121212',
    'surface-variant': '#1E1E1E',
    'on-surface-variant': '#E0E0E0',
    primary: '#FFFFFF',
    'on-primary': '#0A0A0A',
    secondary: '#A8A8A8',
    accent: '#FFFFFF',
    error: '#CF6679',
    info: '#E0E0E0',
    success: '#81C784',
    warning: '#FFD54F',
  },
}

export default createVuetify({
  theme: {
    defaultTheme: 'trueShopLight',
    themes: {
      trueShopLight,
      trueShopDark,
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  defaults: {
    VBtn: {
      rounded: 0,
      flat: true,
      style: 'text-transform: none; letter-spacing: 0.5px;',
    },
    VCard: {
      rounded: 'lg',
      flat: true,
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },
  },
})

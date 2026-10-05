/** Tokens from the Shiftmatch design (Claude Design · section 08), mapped 1:1. */
export const colors = {
  primary: '#EC3013',
  primaryPressed: '#DD2B0F',
  primaryDeep: '#AE1800',
  primaryTint: '#FFF2EF',
  like: '#18864B',
  likePressed: '#0E6B3A',
  likeTint: '#E3F3E8',
  likeInk: '#0F5E33',
  pass: '#201E1D',
  passTint: '#EAE7E7',
  match: '#EC3013',
  onMatch: '#FFFFFF',
  warning: '#E0A100',
  warningTint: '#FFF0D1',
  warningInk: '#7A4A00',
  warningSolid: '#B86E00',
  bg: '#F3F2F2',
  surface: '#EAE9E9',
  card: '#F8F4F4',
  ink: '#201E1D',
  inkMuted: '#605D5D',
  inkSoft: '#444141',
  line: 'rgba(32,30,29,0.4)',
  lineStrong: '#201E1D',
  n200: '#EAE7E7',
  n300: '#D7D3D3',
  n400: '#BAB6B6',
  n500: '#9B9797',
  n600: '#7D7979',
  white: '#FFFFFF',
  scrim: 'rgba(45,43,43,0.5)',
};

export const categoryColor = {
  hospitality: '#C2306F',
  retail: '#6B4BD6',
  delivery: '#1F6FD1',
  cleaning: '#0B7D77',
  warehouse: '#475A6B',
};

export const fonts = {
  regular: 'Archivo_400Regular',
  semibold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
  heavy: 'Archivo_800ExtraBold',
};

const t = (fontFamily, fontSize, lineHeight, letterSpacing = 0) => ({
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
  color: colors.ink,
});

export const type = {
  display: t(fonts.heavy, 52, 50, -2),
  pay: t(fonts.heavy, 52, 50, -1.8),
  title1: t(fonts.heavy, 36, 38, -1.1),
  title2: t(fonts.heavy, 30, 32, -0.75),
  title3: t(fonts.heavy, 22, 26, -0.45),
  headline: t(fonts.bold, 17, 22),
  body: t(fonts.regular, 17, 25),
  callout: t(fonts.semibold, 15, 20),
  chip: t(fonts.bold, 14, 18),
  label: { ...t(fonts.heavy, 13, 16, 1.3), textTransform: 'uppercase' },
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};
/** Softened Modernist corners: chips 6 · controls 10 · cards 14 · sheets 18. */
export const radius = { sm: 6, md: 10, lg: 14, xl: 18, pill: 999 };

export const border = { hairline: 1, rule: 2, stamp: 5 };
export const touch = { min: 44, button: 56, action: 64 };

const shadow = (y, blur, opacity) => ({
  shadowColor: '#2D2B2B',
  shadowOffset: { width: 0, height: y },
  shadowRadius: blur / 2,
  shadowOpacity: opacity,
});
export const shadows = {
  sm: shadow(1, 2, 0.14),
  md: shadow(3, 10, 0.16),
  lg: shadow(12, 32, 0.22),
};

import { Text as RNText } from 'react-native';

import { colors, type as typeScale } from '@/theme';

/** Archivo text in one of the design's type styles. */
export function Text({ variant = 'body', color = colors.ink, style, ...rest }) {
  return <RNText {...rest} style={[typeScale[variant], { color }, style]} />;
}

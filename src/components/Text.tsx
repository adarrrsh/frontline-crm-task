import { Text as RNText, type TextProps } from 'react-native';

import { colors, type as typeScale } from '@/theme';

export type TextVariant = keyof typeof typeScale;

interface Props extends TextProps {
  variant?: TextVariant;
  color?: string;
}

/** Archivo text in one of the design's type styles. */
export function Text({ variant = 'body', color = colors.ink, style, ...rest }: Props) {
  return <RNText {...rest} style={[typeScale[variant], { color }, style]} />;
}

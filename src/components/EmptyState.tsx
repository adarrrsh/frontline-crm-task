import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

import { colors, fonts } from '@/theme';

import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type EmptyTone = 'accent' | 'ink' | 'warn' | 'like';
const TILE: Record<EmptyTone, string> = {
  accent: colors.primary,
  ink: colors.ink,
  warn: colors.warningSolid,
  like: colors.like,
};

/** The 44pt grid "illustration" with an offset outline square and the colored icon tile. */
export function GridArt({ icon, tone, cell = 44, style }: { icon: IconName; tone: EmptyTone; cell?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.art, style]}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="grid" width={cell} height={cell} patternUnits="userSpaceOnUse" x={-2} y={-2}>
            <Path d={`M0 1 H${cell} M1 0 V${cell}`} stroke={colors.n300} strokeWidth={2} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grid)" />
      </Svg>
      <View style={styles.outline} />
      <View style={[styles.tile, { backgroundColor: TILE[tone] }]}>
        <Icon name={icon} size={48} strokeWidth={2.25} color={colors.white} />
      </View>
    </View>
  );
}

interface Props {
  icon: IconName;
  tone?: EmptyTone;
  kicker?: string;
  title: string;
  body?: string;
  primary: { label: string; icon?: IconName; onPress: () => void };
  secondary?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
}

/** Every dead end offers a way forward. */
export function EmptyState({ icon, tone = 'accent', kicker, title, body, primary, secondary, style }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <GridArt icon={icon} tone={tone} style={{ flex: 1 }} />
      {kicker ? <Text variant="label" color={colors.primaryDeep} style={{ marginTop: 4 }}>{kicker}</Text> : null}
      <Text style={styles.title} accessibilityRole="header">{title}</Text>
      {body ? <Text variant="body" color={colors.inkSoft} style={{ lineHeight: 24 }}>{body}</Text> : null}
      <View style={styles.actions}>
        <Button label={primary.label} icon={primary.icon} onPress={primary.onPress} />
        {secondary ? <Button label={secondary.label} variant="secondary" onPress={secondary.onPress} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: 14 },
  art: { minHeight: 140, overflow: 'hidden', backgroundColor: colors.surface, borderTopWidth: 2, borderTopColor: colors.ink },
  outline: { position: 'absolute', left: 46, bottom: 46, width: 96, height: 96, borderWidth: 2, borderColor: colors.ink },
  tile: { position: 'absolute', left: 22, bottom: 22, width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.heavy, fontSize: 28, lineHeight: 30, letterSpacing: -0.5 },
  actions: { gap: 8, marginTop: 6 },
});

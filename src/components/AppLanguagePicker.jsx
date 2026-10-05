import { Pressable, StyleSheet, View } from 'react-native';

import { useT } from '@/hooks/useT';
import { UI_LANGUAGES } from '@/i18n';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, radius } from '@/theme';

import { Text } from './Text';

/**
 * Switches the app's language instantly. `compact` shows codes (EN · DE · …) for the welcome poster;
 * otherwise each language is named in itself.
 */
export function AppLanguagePicker({ compact, onAccent }) {
  const t = useT();
  const current = useAppStore((s) => s.uiLanguage);
  const setUiLanguage = useAppStore((s) => s.setUiLanguage);
  const ink = onAccent ? colors.white : colors.ink;
  const inverse = onAccent ? colors.primary : colors.bg;

  return (
    <View style={[styles.row, compact && styles.compactRow]} accessibilityRole="radiogroup" accessibilityLabel={t('welcome.language')}>
      {UI_LANGUAGES.map(({ code, name }) => {
        const on = code === current;
        return (
          <Pressable
            key={code}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={name}
            onPress={() => setUiLanguage(code)}
            hitSlop={compact ? 4 : 0}
            style={[
              compact ? styles.compact : styles.chip,
              { backgroundColor: on ? ink : 'transparent', borderColor: on ? ink : onAccent ? ink : colors.line },
            ]}
          >
            <Text style={compact ? styles.codeText : styles.chipText} color={on ? inverse : ink}>
              {compact ? code.toUpperCase() : name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  compactRow: { gap: 4 },
  chip: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 2,
    borderRadius: radius.md,
  },
  chipText: { fontFamily: fonts.heavy, fontSize: 15, lineHeight: 20 },
  compact: {
    minWidth: 36,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 1.5,
    borderRadius: radius.sm,
  },
  codeText: { fontFamily: fonts.heavy, fontSize: 13, lineHeight: 16, letterSpacing: 0.6 },
});

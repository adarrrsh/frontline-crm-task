import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useT } from '@/hooks/useT';
import { colors, fonts, radius } from '@/theme';

import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';

export function LocationPickerSheet({ visible, ...rest }) {
  return visible ? <PickerBody {...rest} /> : null;
}

function PickerBody({ choices, selectedId, radiusKm, onPick, onUseDevice, onClose }) {
  const t = useT();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(selectedId ?? choices[0]?.id);
  const q = query.trim().toLowerCase();
  const visible = q ? choices.filter((c) => `${c.name} ${c.county}`.toLowerCase().includes(q)) : choices;
  const chosen = choices.find((c) => c.id === selected);

  return (
    <BottomSheet
      visible
      title={t('picker.title')}
      onClose={onClose}
      footer={
        <Button
          label={chosen ? t('picker.showNear', { place: chosen.name }) : t('picker.pick')}
          disabled={!chosen}
          onPress={() => chosen && onPick(chosen)}
        />
      }
    >
      <View style={styles.search}>
        <Icon name="search" size={20} strokeWidth={2.5} color={colors.inkMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('picker.search')}
          placeholderTextColor={colors.inkMuted}
          style={styles.input}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel={t('picker.search')}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onUseDevice}
        style={({ pressed }) => [styles.device, pressed && { opacity: 0.6 }]}
      >
        <Icon name="nav" size={20} strokeWidth={2.5} color={colors.primaryDeep} />
        <Text style={styles.deviceText} color={colors.primaryDeep}>
          {t('picker.useCurrent')}
        </Text>
      </Pressable>
      <Text variant="label" color={colors.inkMuted} style={{ fontSize: 12, marginTop: 18, marginBottom: 4 }}>
        {t('picker.popular')}
      </Text>
      {visible.length === 0 ? (
        <Text variant="callout" color={colors.inkMuted} style={{ paddingVertical: 16 }}>
          {t('picker.noMatch', { query })}
        </Text>
      ) : (
        visible.map((c) => {
          const on = c.id === selected;
          return (
            <Pressable
              key={c.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setSelected(c.id)}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.n200 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{c.name}</Text>
                <Text
                  style={styles.meta}
                  color={colors.inkMuted}
                >{t('picker.meta', { count: c.jobCount, km: radiusKm, county: c.county })}</Text>
              </View>
              {c.distance ? <Text style={styles.dist}>{c.distance}</Text> : null}
              <View
                style={[
                  styles.check,
                  {
                    backgroundColor: on ? colors.primary : 'transparent',
                    borderColor: on ? colors.primary : colors.line,
                  },
                ]}
              >
                {on ? <Icon name="check" size={18} strokeWidth={3} color={colors.white} /> : null}
              </View>
            </Pressable>
          );
        })
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  search: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
    borderRadius: radius.md,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 17,
    color: colors.ink,
    height: '100%',
  },
  device: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
  },
  deviceText: { fontFamily: fonts.heavy, fontSize: 17, lineHeight: 22 },
  row: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  name: { fontFamily: fonts.heavy, fontSize: 18, lineHeight: 22 },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 18,
    marginTop: 2,
  },
  dist: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
  check: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: radius.sm,
  },
});

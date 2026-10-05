import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, fonts } from '@/theme';

import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { PresetChip } from './Chips';
import { Icon } from './Icon';
import { RadiusSlider } from './RadiusSlider';
import { Text } from './Text';

const PRESETS = [5, 10, 15, 25];

export function RadiusSheet({ visible, value, onApply, onClose, countWithin }) {
  return visible ? <RadiusSheetBody value={value} onApply={onApply} onClose={onClose} countWithin={countWithin} /> : null;
}

/** Mounted only while open, so the draft always starts from the current radius. */
function RadiusSheetBody({ value, onApply, onClose, countWithin }) {
  const [draft, setDraft] = useState(value);
  const count = countWithin(draft);
  const delta = count - countWithin(value);

  return (
    <BottomSheet
      visible
      title="Travel distance"
      onClose={onClose}
      footer={<Button label={count === 1 ? 'Show 1 job' : `Show ${count} jobs`} onPress={() => onApply(draft)} />}
    >
      <View style={{ gap: 18 }}>
        <Text style={styles.big}>{`Up to ${draft} km`}</Text>
        <RadiusSlider value={draft} onChange={setDraft} thumb={32} />
        <View style={styles.presets}>
          {PRESETS.map((km) => (
            <PresetChip key={km} label={`${km} km`} selected={draft === km} onPress={() => setDraft(km)} />
          ))}
        </View>
        <View style={styles.count}>
          <Icon name="briefcase" size={20} strokeWidth={2.5} />
          <Text style={styles.countText}>{`${count} ${count === 1 ? 'job' : 'jobs'} within ${draft} km`}</Text>
          {delta !== 0 ? (
            <Text style={styles.delta} color={delta > 0 ? colors.likeInk : colors.primaryDeep}>
              {delta > 0 ? `+${delta}` : `${delta}`}
            </Text>
          ) : null}
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  big: {
    fontFamily: fonts.heavy,
    fontSize: 44,
    lineHeight: 46,
    letterSpacing: -1.5,
  },
  presets: { flexDirection: 'row', gap: 6 },
  count: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 14,
    borderTopWidth: 2,
    borderTopColor: colors.line,
  },
  countText: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 20 },
  delta: { fontFamily: fonts.heavy, fontSize: 16, lineHeight: 20 },
});

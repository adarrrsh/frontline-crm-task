import { StyleSheet, View } from 'react-native';

import { useT } from '@/hooks/useT';
import { colors, fonts, radius } from '@/theme';

import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';

/** Mocked: shows the employer's preferred channel. No calls or messages are sent. */
export function ContactSheet({ employer, onClose }) {
  const t = useT();
  if (!employer) return null;
  return (
    <BottomSheet
      visible
      title={t('contact.title', { employer: employer.name })}
      onClose={onClose}
      footer={<Button label={t('common.done')} onPress={onClose} />}
    >
      <View style={{ gap: 14 }}>
        <Text variant="label" color={colors.inkMuted} style={{ fontSize: 12 }}>
          {t('contact.channel')}
        </Text>
        <View style={styles.row}>
          <View style={styles.tile}>
            <Icon name="phone" size={20} strokeWidth={2.5} color={colors.white} />
          </View>
          <Text style={styles.contact}>{employer.contact}</Text>
        </View>
        <Text variant="callout" color={colors.inkMuted} style={{ fontFamily: fonts.regular }}>
          {t('contact.note')}
        </Text>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.ink,
  },
  tile: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
  contact: { flex: 1, fontFamily: fonts.heavy, fontSize: 17, lineHeight: 22 },
});

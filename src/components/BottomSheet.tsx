import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, shadows } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/** Square-topped sheet with a 2px ink rule, grabber and close button. */
export function BottomSheet({ visible, title, onClose, children, footer }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Animated.View entering={FadeIn.duration(180)} style={styles.scrim}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
        </Animated.View>
        <Animated.View entering={SlideInDown.duration(260)} style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
          accessibilityViewIsModal>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Text variant="title3" style={{ flex: 1 }} accessibilityRole="header">{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose}
              style={({ pressed }) => [styles.close, pressed && { backgroundColor: colors.n300 }]}>
              <Icon name="x" size={22} strokeWidth={2.75} />
            </Pressable>
          </View>
          <View style={styles.body}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.bg, borderTopWidth: 2, borderTopColor: colors.ink, ...shadows.lg },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.n400, alignSelf: 'center', marginTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 16, paddingRight: 8 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  body: { paddingHorizontal: 16, paddingTop: 16 },
  footer: { paddingHorizontal: 16, paddingTop: 24 },
});

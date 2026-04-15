/**
 * Offline Banner Component
 *
 * Internet bağlantısı olmadığında ekranın üstünde görünen banner.
 * Kullanıcıya offline modda olduğunu bildirir.
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useOffline } from '@/contexts/OfflineContext';
import { spacing, typography } from '@constants/theme';

const OfflineBanner: React.FC = () => {
  const { isOffline, showOfflineBanner, networkStatus } = useOffline();
  const [slideAnim] = React.useState(new Animated.Value(-100));

  React.useEffect(() => {
    if (showOfflineBanner && isOffline) {
      // Slide down
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      // Slide up
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showOfflineBanner, isOffline, slideAnim]);

  if (!showOfflineBanner && !isOffline) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: isOffline ? '#FF6B6B' : '#51CF66',
        },
      ]}
    >
      <Icon
        name={isOffline ? 'wifi-off' : 'wifi-check'}
        size={20}
        color="#FFFFFF"
        style={styles.icon}
      />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{isOffline ? 'Offline Mod' : 'Tekrar Online'}</Text>
        <Text style={styles.description}>
          {isOffline
            ? 'İnternet bağlantısı yok • Yerel özellikler kullanılabilir'
            : 'İnternet bağlantısı kuruldu'}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  icon: {
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  description: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    opacity: 0.9,
  },
});

export default OfflineBanner;

import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, StatusBar, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBackground from '../../components/AppBackground';

export default function SplashScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 550, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 550, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const logoWidth = Math.min(width * 0.75, 650);
  const dotSize = Math.max(10, Math.min(width * 0.026, 22));

  return (
    <AppBackground variant="splash">
      <StatusBar hidden />
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/splenexa-logo.png')}
          resizeMode="contain"
          style={{ width: logoWidth, aspectRatio: 272.78 / 73.98 }}
          accessibilityLabel="Splenexa"
        />
      </View>
      <View style={[styles.loader, { bottom: Math.max(insets.bottom + 28, 44), gap: dotSize }]}>
        <View style={[styles.dot, { width: dotSize, height: dotSize }]} />
        <Animated.View
          style={[
            styles.activeDot,
            { width: dotSize, height: dotSize, transform: [{ scale: pulse }] },
          ]}
        />
        <View style={[styles.dot, { width: dotSize, height: dotSize }]} />
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loader: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    borderRadius: 999,
    backgroundColor: '#62E9D1',
  },
  activeDot: {
    borderRadius: 999,
    backgroundColor: '#05B0C0',
  },
});

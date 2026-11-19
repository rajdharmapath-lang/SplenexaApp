import { Pressable, StyleSheet, Text, View } from 'react-native';
import typography from '../theme/typography';
import AppBackground from './AppBackground';

export default function PlaceholderScreen({ title, onBack, variant = 'default' }) {
  return (
    <AppBackground variant={variant}>
      <View style={styles.container}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={onBack}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        ) : null}
        <Text style={styles.title}>{title}</Text>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backButton: {
    position: 'absolute',
    top: 24,
    left: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
  },
  backText: {
    color: '#100568',
    fontSize: 32,
    lineHeight: 36,
  },
  title: {
    color: '#100568',
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
  },
});

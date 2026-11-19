import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const backgroundPalettes = {
  default: ['#ADEBFA', '#D8F8FF', '#DDFBF6', '#A8F3DF'],
  login: ['#B8F0FA', '#DDFBFF', '#A0F2E5'],
  splash: ['#B3EAF9', '#D8F7FC', '#B9F2E3'],
  otp: ['#AEE5F8', '#D9F7FC', '#C7F4E7'],
  profileSetup: ['#B8EBF8', '#DCF8FA', '#B4F1E3'],
  home: ['#A9E5F8', '#D5F7FC', '#D5F7EB'],
  dailyQuestion: ['#B9E8F8', '#DFF9FC', '#B6F1E4'],
  videos: ['#B3E8FA', '#DDF8FC', '#B5F1E5'],
  videoTopic: ['#AEE4F8', '#D6F6FC', '#BDF1E4'],
  tests: ['#B3E5F8', '#D5F5FA', '#C7F5E9'],
  subjects: ['#AEE8F8', '#DDF9FC', '#C3F4E7'],
  qbank: ['#B8E9FA', '#E0F8FC', '#BDF1E3'],
  grandTest: ['#A9E2F8', '#D5F5FA', '#C7F4E8'],
  imageTest: ['#B2EAF8', '#D7F8F8', '#B8F2E5'],
  testQuestion: ['#B9EAF8', '#DFF9FC', '#C0F2E7'],
  grandResult: ['#AEE5F7', '#D8F6F8', '#B8F1DF'],
  subjectResult: ['#B2E8F7', '#DFF8F8', '#B9F2E2'],
  profile: ['#B2EAF7', '#DDF8FA', '#C1F3E4'],
  bookmarks: ['#B5E7F8', '#E0F8FA', '#BDF2E3'],
  bookmarkDetail: ['#ACE4F8', '#D8F7FA', '#C4F2E2'],
  attempts: ['#AEE7F8', '#D9F7FA', '#C5F4E4'],
  notifications: ['#B8EAF8', '#DDF8F9', '#B8F0DF'],
  pdf: ['#AFE3F8', '#DAF7F9', '#C2F3E5'],
  imageBank: ['#B5E8F8', '#D9F8FA', '#B9F2E4'],
  learning: ['#AFE8F7', '#DDF8F7', '#B7F1E1'],
  preview: ['#B4E8F8', '#DDF8FC', '#B7F2E4'],
  settings: ['#B8E8F8', '#E0F8FA', '#BFF2E4'],
  deleteAccount: ['#B4E6F8', '#DDF7F9', '#C2F2E2'],
  batchList: ['#AFE7F8', '#D9F7FA', '#B8F1E2'],
  batchDetail: ['#B7EAF8', '#DFF8FA', '#B8F0E2'],
  myBatches: ['#ACE3F7', '#D7F5FA', '#BDF1E1'],
  checkout: ['#B8E9F8', '#E0F9FA', '#B8F0E0'],
  paymentSuccess: ['#AEE8F5', '#D9F8F7', '#B1F0D8'],
  paymentFailed: ['#BDEAF7', '#E0F7F8', '#C5F0E3'],
  classPlayer: ['#B0E5F8', '#D9F7FB', '#B8F1E4'],
};

export default function AppBackground({ children, style, variant = 'default' }) {
  const colors = backgroundPalettes[variant] ?? backgroundPalettes.default;

  return (
    <LinearGradient
      colors={colors}
      locations={colors.length === 3 ? [0, 0.54, 1] : [0, 0.42, 0.72, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.background, style]}
    >
      <View pointerEvents="none" style={[styles.orb, styles.orbTop]} />
      <View pointerEvents="none" style={[styles.orb, styles.orbTopSmall]} />
      <View pointerEvents="none" style={[styles.orb, styles.orbBottomSmall]} />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0.34)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
        locations={[0, 0.58, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.wash, styles.topWash]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(79,228,186,0.20)', 'rgba(79,228,186,0.02)', 'rgba(79,228,186,0)']}
        locations={[0, 0.58, 1]}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={[styles.wash, styles.bottomWash]}
      />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  orbTop: {
    width: 330,
    height: 330,
    top: -155,
    left: -115,
    right: 'auto',
    backgroundColor: 'rgba(82,188,238,0.18)',
    borderWidth: 0,
  },
  orbTopSmall: {
    width: 118,
    height: 118,
    top: 160,
    right: -28,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.62)',
  },
  orbBottomSmall: {
    width: 120,
    height: 120,
    bottom: 82,
    left: -48,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.48)',
  },
  wash: {
    position: 'absolute',
    borderRadius: 999,
  },
  topWash: {
    width: 460,
    height: 350,
    top: -215,
    right: -175,
    transform: [{ rotate: '-18deg' }],
  },
  bottomWash: {
    width: 500,
    height: 320,
    bottom: -215,
    left: -195,
    transform: [{ rotate: '-16deg' }],
  },
});

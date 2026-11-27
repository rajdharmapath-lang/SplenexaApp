import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import typography from '../../theme/typography';
import BottomNav from '../../components/BottomNav';
import GlassCard, { glassCardEffects } from '../../components/GlassCard';
import AppBackground from '../../components/AppBackground';
import { fetchQuestionBank } from '../../services/questionBankService';

function formatDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
}

function formatDuration(minutes) {
  const totalMinutes = Number(minutes);
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return 'Not set';
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  if (!hours) return `${remainingMinutes} min`;
  if (!remainingMinutes) return `${hours} hr${hours === 1 ? '' : 's'}`;
  return `${hours} hr ${remainingMinutes} min`;
}

function formatMarks(value) {
  const marks = Number(value);
  return Number.isFinite(marks) ? String(marks) : '0';
}

function ClipboardIcon() {
  return (
    <View style={styles.clipboardIcon}>
      <View style={styles.clipboardClip} />
      <Text style={styles.clipboardCheck}>✓</Text>
    </View>
  );
}

function ScheduleIcon({ name }) {
  if (name === 'calendar') {
    return (
      <View style={styles.calendarIcon}>
        <View style={styles.calendarTop} />
        <View style={styles.calendarDivider} />
      </View>
    );
  }

  if (name === 'clock') {
    return (
      <View style={styles.clockIcon}>
        <View style={styles.clockHandVertical} />
        <View style={styles.clockHandHorizontal} />
      </View>
    );
  }

  if (name === 'award') {
    return (
      <View style={styles.awardIcon}>
        <View style={styles.awardMedal}>
          <Text style={styles.awardStar}>★</Text>
        </View>
        <View style={styles.awardRibbonLeft} />
        <View style={styles.awardRibbonRight} />
      </View>
    );
  }

  return (
    <View style={styles.timerIcon}>
      <View style={styles.timerTop} />
      <View style={styles.timerHand} />
    </View>
  );
}

function BottomNavigation({ onNavigate, onNotificationPress }) {
  return <BottomNav active="tests" onNavigate={onNavigate} onNotificationPress={onNotificationPress} />;
}

function TestScheduleCard({ test, onPress, testPrefix, availabilityTime }) {
  const title = test.title || `${testPrefix} ${test.id}`;
  const startTime = test.startDateTimeEnabled && test.startAt
    ? new Date(test.startAt).getTime()
    : null;
  const isUpcoming = Number.isFinite(startTime) && startTime > availabilityTime;
  const totalMarks = (Number(test.totalQuestions) || 0) * (Number(test.marksPerQuestion) || 0);
  const details = [
    `${Number(test.totalQuestions) || 0} questions`,
    `${formatMarks(totalMarks)} marks total`,
    `${formatDuration(test.durationEnabled ? test.durationMinutes : null)}`,
    `${formatMarks(test.marksPerQuestion)} mark${Number(test.marksPerQuestion) === 1 ? '' : 's'} per question`,
    test.negativeMarkingEnabled
      ? `−${formatMarks(test.negativeMarking)} negative mark${Number(test.negativeMarking) === 1 ? '' : 's'}`
      : null,
  ].filter(Boolean);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${title}. ${details.join(', ')}`}
      accessibilityState={{ disabled: isUpcoming }}
      disabled={isUpcoming}
      onPress={() => onPress?.(test)}
      style={[styles.testCardPressable, isUpcoming && styles.testCardDisabled]}
    >
      {({ pressed }) => (
        <GlassCard
          {...glassCardEffects}
          style={[styles.testCard, pressed && styles.cardPressed]}
          contentStyle={styles.testCardContent}
          radius={24}
        >
          <View style={styles.cardHeader}>
            <View style={styles.testIconTile}>
              <ClipboardIcon />
            </View>
            <Text numberOfLines={1} style={styles.testTitle}>
              {title}
            </Text>
            <LinearGradient
              colors={['#4C6FE8', '#4FE4BA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.arrowCircle}
            >
              <Text style={styles.arrow}>→</Text>
            </LinearGradient>
          </View>

          {test.startDateTimeEnabled && test.startAt ? (
            <>
              <View style={styles.separator} />
              <View style={styles.scheduleRow}>
                <ScheduleIcon name="calendar" />
                <Text style={styles.rowLabel}>Start:</Text>
                <Text numberOfLines={1} style={styles.rowValue}>{formatDateTime(test.startAt)}</Text>
              </View>
            </>
          ) : null}
          {test.endDateTimeEnabled && test.endAt ? (
            <>
              <View style={styles.separator} />
              <View style={styles.scheduleRow}>
                <ScheduleIcon name="clock" />
                <Text style={styles.rowLabel}>End:</Text>
                <Text numberOfLines={1} style={styles.rowValue}>{formatDateTime(test.endAt)}</Text>
              </View>
            </>
          ) : null}
          <View style={styles.separator} />
          <View style={styles.detailsRow}>
            <View style={styles.marksDetail}>
              <ScheduleIcon name="award" />
              <Text style={styles.detailText}>{formatMarks(totalMarks)} marks</Text>
            </View>
            <View style={styles.detailsDivider} />
            <View style={styles.durationDetail}>
              <ScheduleIcon name="timer" />
              <Text style={styles.detailText}>{formatDuration(test.durationEnabled ? test.durationMinutes : null)}</Text>
            </View>
          </View>
          <Text style={styles.scoringDetails} numberOfLines={2}>
            {[details[0], ...details.slice(3)].join(' · ')}
          </Text>
        </GlassCard>
      )}
    </Pressable>
  );
}

export default function GrandTestScreen({
  onBack,
  onNavigate,
  onNotificationPress,
  onOpenTest,
  title = 'Grand Test',
  testPrefix = 'Grand Test',
}) {
  const insets = useSafeAreaInsets();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [availabilityTime, setAvailabilityTime] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    fetchQuestionBank()
      .then((catalog) => {
        if (active) setTests(catalog.tests);
      })
      .catch((error) => {
        console.error('Unable to load Grand Tests from the database.', error);
        if (active) setLoadError(error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => setAvailabilityTime(Date.now()), 15000);
    return () => clearInterval(intervalId);
  }, []);

  const currentTests = tests.filter((test) => {
    if (!test.endDateTimeEnabled || !test.endAt) return true;
    const endTime = new Date(test.endAt).getTime();
    return !Number.isFinite(endTime) || endTime > availabilityTime;
  });

  return (
    <AppBackground variant="grandTest">
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Test Series"
            hitSlop={10}
            onPress={onBack}
            style={styles.backButton}
          >
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
          <View style={styles.headingGroup}>
            <Text style={styles.heading}>{title}</Text>
            <Text style={styles.subtitle}>Scheduled tests</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <Text style={styles.emptyMessage}>Loading tests…</Text>
        ) : loadError ? (
          <Text accessibilityRole="alert" style={styles.emptyMessage}>
            Tests could not be loaded: {loadError.message}
          </Text>
        ) : currentTests.length ? (
          <View style={styles.testList}>
            {currentTests.map((test) => (
              <TestScheduleCard
                key={test.id}
                test={test}
                testPrefix={testPrefix}
                availabilityTime={availabilityTime}
                onPress={onOpenTest}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.emptyMessage}>
            {tests.length ? 'No tests are currently available.' : 'No tests are available in the database.'}
          </Text>
        )}
      </ScrollView>

      <BottomNavigation onNavigate={onNavigate} onNotificationPress={onNotificationPress} />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    gap: 20,
  },
  pageHeader: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backArrow: {
    color: '#100568',
    fontSize: 54,
    lineHeight: 58,
    fontFamily: typography.fontFamily.regular,
  },
  headingGroup: {
    flex: 1,
    alignItems: 'center',
    marginLeft: -8,
  },
  heading: {
    color: '#100568',
    fontSize: 32,
    lineHeight: 38,
    textAlign: 'center',
    fontFamily: typography.fontFamily.bold,
  },
  subtitle: {
    marginTop: 2,
    color: '#5778A4',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: typography.fontFamily.medium,
  },
  headerSpacer: {
    width: 36,
  },
  testList: {
    gap: 12,
  },
  testCard: {
    flex: 1,
  },
  testCardPressable: {
    width: '100%',
  },
  testCardDisabled: {
    opacity: 0.6,
  },
  testCardContent: {
    minHeight: 144,
    padding: 22,
  },
  cardPressed: {
    opacity: 0.88,
  },
  cardHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testIconTile: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(74,213,226,0.18)',
  },
  clipboardIcon: {
    width: 27,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#100568',
    borderRadius: 5,
  },
  clipboardClip: {
    position: 'absolute',
    top: -6,
    width: 14,
    height: 9,
    borderWidth: 2.5,
    borderColor: '#100568',
    borderRadius: 4,
    backgroundColor: '#B8EEF0',
  },
  clipboardCheck: {
    color: '#100568',
    fontSize: 22,
    lineHeight: 26,
    fontFamily: typography.fontFamily.bold,
  },
  testTitle: {
    flex: 1,
    color: '#100568',
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
  },
  arrowCircle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  arrow: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    fontFamily: typography.fontFamily.medium,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  scheduleRow: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarIcon: {
    width: 30,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#100568',
    borderRadius: 4,
  },
  calendarTop: {
    position: 'absolute',
    top: -4,
    width: 20,
    height: 5,
    borderTopWidth: 2,
    borderColor: '#100568',
  },
  calendarDivider: {
    position: 'absolute',
    top: 5,
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#100568',
  },
  clockIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#100568',
    borderRadius: 11,
  },
  clockHandVertical: {
    position: 'absolute',
    top: 3,
    width: 2,
    height: 7,
    backgroundColor: '#100568',
  },
  clockHandHorizontal: {
    position: 'absolute',
    top: 9,
    left: 9,
    width: 6,
    height: 2,
    backgroundColor: '#100568',
  },
  awardIcon: {
    width: 30,
    height: 28,
    alignItems: 'center',
  },
  awardMedal: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#100568',
    borderRadius: 10,
  },
  awardStar: {
    color: '#100568',
    fontSize: 11,
    lineHeight: 14,
    fontFamily: typography.fontFamily.bold,
  },
  awardRibbonLeft: {
    position: 'absolute',
    left: 7,
    bottom: 0,
    width: 8,
    height: 10,
    borderWidth: 1.5,
    borderColor: '#100568',
    transform: [{ rotate: '18deg' }],
  },
  awardRibbonRight: {
    position: 'absolute',
    right: 7,
    bottom: 0,
    width: 8,
    height: 10,
    borderWidth: 1.5,
    borderColor: '#100568',
    transform: [{ rotate: '-18deg' }],
  },
  timerIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#100568',
    borderRadius: 11,
  },
  timerTop: {
    position: 'absolute',
    top: -5,
    width: 8,
    height: 4,
    borderWidth: 1.5,
    borderColor: '#100568',
    borderRadius: 2,
    backgroundColor: '#B0F3E0',
  },
  timerHand: {
    position: 'absolute',
    top: 4,
    width: 2,
    height: 7,
    backgroundColor: '#100568',
    transform: [{ rotate: '38deg' }],
  },
  rowLabel: {
    width: 44,
    color: '#5778A4',
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
  },
  rowValue: {
    flex: 1,
    color: '#100568',
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
  },
  detailsRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
  },
  marksDetail: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailsDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    backgroundColor: 'rgba(16,5,104,0.3)',
  },
  durationDetail: {
    flex: 1.35,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 10,
  },
  detailText: {
    color: '#100568',
    fontSize: 13,
    fontFamily: typography.fontFamily.semiBold,
  },
  scoringDetails: {
    marginTop: 6,
    marginLeft: 36,
    color: '#5778A4',
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
  },
  emptyMessage: {
    marginTop: 18,
    color: '#5778A4',
    fontSize: 15,
    fontFamily: typography.fontFamily.medium,
  },
  bottomNavContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  bottomNav: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
    backgroundColor: 'rgba(255,255,255,0.42)',
    shadowColor: '#009DC5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
  },
  navItem: {
    width: 48,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    color: '#12BDBB',
    fontSize: 34,
    lineHeight: 40,
    fontFamily: typography.fontFamily.regular,
  },
  testNavIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: '#16CDBA',
  },
  testNavQuestion: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 32,
    fontFamily: typography.fontFamily.bold,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 34,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#009DC5',
  },
  brandButtonOuter: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: '#C7F7F1',
  },
  brandButton: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
  },
  brandButtonCenter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: '#B0F3E0',
  },
});

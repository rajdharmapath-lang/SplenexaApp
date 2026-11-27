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
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import typography from '../../theme/typography';
import GlassCard, { glassCardEffects } from '../../components/GlassCard';
import BottomNav from '../../components/BottomNav';
import AppBackground from '../../components/AppBackground';
import { fetchQuestionBank } from '../../services/questionBankService';

const NAVY = '#0B0B5C';
const BLUE_TEXT = '#4A5F94';

export default function TestSeriesScreen({
  activeTab = 'testSeries',
  view = 'mcq',
  onBack,
  onNavigate,
  onNotificationPress,
  onOpenProduct,
  onOpenQuestionBankTest,
}) {
  const insets = useSafeAreaInsets();
  const isMcqHome = view === 'mcq';
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [questionBankTests, setQuestionBankTests] = useState([]);
  const [questionBankProducts, setQuestionBankProducts] = useState([]);
  const [questionBankSubjects, setQuestionBankSubjects] = useState([]);
  const [questionBankQuestions, setQuestionBankQuestions] = useState([]);
  const [questionBankError, setQuestionBankError] = useState(null);
  const [availabilityTime, setAvailabilityTime] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    fetchQuestionBank()
      .then((catalog) => {
        if (active) {
          setQuestionBankTests(catalog.tests);
          setQuestionBankProducts(catalog.products);
          setQuestionBankSubjects(catalog.subjects);
          setQuestionBankQuestions(catalog.questions);
        }
      })
      .catch((error) => {
        console.error('Unable to load the database catalog for the test screen.', error);
        if (active) setQuestionBankError(error);
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => setAvailabilityTime(Date.now()), 15000);
    return () => clearInterval(intervalId);
  }, []);

  function getTestAvailability(test) {
    const now = availabilityTime;
    if (test.startDateTimeEnabled && test.startAt && new Date(test.startAt).getTime() > now) {
      return 'Available ' + new Date(test.startAt).toLocaleString();
    }
    if (test.endDateTimeEnabled && test.endAt && new Date(test.endAt).getTime() <= now) {
      return 'This test has ended';
    }
    return '';
  }

  const currentTests = questionBankTests.filter((test) => {
    if (!test.endDateTimeEnabled || !test.endAt) return true;
    const endTime = new Date(test.endAt).getTime();
    return !Number.isFinite(endTime) || endTime > availabilityTime;
  });

  function getTestQuestionCount(test) {
    const subject = questionBankSubjects.find((item) => String(item.id) === String(test.subjectId));
    if (!subject) return 0;
    const questions = questionBankQuestions.filter((question) =>
      String(question.productId) === String(test.productId) &&
      String(question.subject) === String(subject.name) &&
      (test.topic ? String(question.topic || '') === String(test.topic) : !question.topic) &&
      String(question.status || 'Active').toLowerCase() === 'active',
    );
    if (!test.questionSelectionEnabled) return questions.length;
    const selectedIds = new Set((test.questionIds || []).map(String));
    return questions.filter((question) => selectedIds.has(String(question.id))).length;
  }

  return (
    <AppBackground variant="tests">
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 48,
            paddingBottom: insets.bottom + 120,
          },
        ]}
      >
        <View style={styles.heading}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to MCQ"
              onPress={onBack}
              hitSlop={10}
              style={styles.backButton}
            >
              <Feather name="chevron-left" size={30} color={NAVY} />
            </Pressable>
          ) : null}
          <Text style={styles.title}>{isMcqHome ? 'MCQ' : 'Test Series'}</Text>
          {onBack ? <View style={styles.backButtonSpacer} /> : null}
        </View>

        {catalogLoading ? null : questionBankError ? (
          <Text accessibilityRole="alert" style={styles.customTestsError}>
            Content could not be loaded: {questionBankError.message}
          </Text>
        ) : isMcqHome && questionBankProducts.length ? (
          questionBankProducts.map((product) => {
            const questionCount = questionBankQuestions.filter((question) =>
              String(question.productId) === String(product.id) &&
              String(question.status || 'Active').toLowerCase() === 'active',
            ).length;
            return (
              <Pressable
                key={product.id}
                accessibilityRole="button"
                accessibilityLabel={`${product.name}. ${product.description || 'Product'}`}
                onPress={() => onOpenProduct?.(product)}
                style={styles.cardGap}
              >
                {({ pressed }) => (
                  <GlassCard
                    {...glassCardEffects}
                    style={pressed && styles.cardPressed}
                    contentStyle={styles.row}
                  >
                    <View style={styles.iconTile}>
                      <MaterialCommunityIcons name="folder-outline" size={34} color={NAVY} />
                    </View>
                    <View style={styles.textWrap}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{product.name}</Text>
                      <Text style={styles.cardSub}>
                        {product.description || `${questionCount} active questions`}
                      </Text>
                    </View>
                    <LinearGradient
                      colors={['#4C6FE8', '#2FD9B0']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.arrow}
                    >
                      <Feather name="arrow-right" size={22} color="#FFFFFF" />
                    </LinearGradient>
                  </GlassCard>
                )}
              </Pressable>
            );
          })
        ) : isMcqHome ? (
          <Text style={styles.customTestsError}>No active products are available in the database.</Text>
        ) : currentTests.length > 0 ? (
          <View style={styles.customTestsSection}>
            <Text style={styles.customTestsHeading}>Available Tests</Text>
            {currentTests.map((test) => {
              const availability = getTestAvailability(test);
              const product = questionBankProducts.find((item) => String(item.id) === String(test.productId));
              const subtitle = [
                product?.name,
                `${getTestQuestionCount(test)} questions`,
                availability,
              ].filter(Boolean).join(' · ');
              return (
                <Pressable
                  key={test.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${test.title}. ${subtitle}`}
                  accessibilityState={{ disabled: Boolean(availability) }}
                  disabled={Boolean(availability)}
                  onPress={() => onOpenQuestionBankTest?.(test)}
                  style={[styles.cardGap, availability && styles.cardDisabled]}
                >
                  {({ pressed }) => (
                    <GlassCard
                      {...glassCardEffects}
                      style={pressed && styles.cardPressed}
                      contentStyle={styles.row}
                    >
                      <View style={styles.iconTile}>
                        <MaterialCommunityIcons name="clipboard-check-outline" size={34} color={NAVY} />
                      </View>
                      <View style={styles.textWrap}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{test.title}</Text>
                        <Text style={styles.cardSub}>{subtitle}</Text>
                      </View>
                      <LinearGradient
                        colors={['#4C6FE8', '#2FD9B0']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.arrow}
                      >
                        <Feather name="arrow-right" size={22} color="#FFFFFF" />
                      </LinearGradient>
                    </GlassCard>
                  )}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={styles.customTestsError}>
            {questionBankTests.length > 0
              ? 'No tests are currently available.'
              : 'No tests are available in the database.'}
          </Text>
        )}
      </ScrollView>

      <BottomNav
        active={activeTab}
        onNavigate={onNavigate}
        onNotificationPress={onNotificationPress}
      />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    flex: 1,
    color: NAVY,
    fontSize: 32,
    lineHeight: 40,
    textAlign: 'center',
    fontFamily: typography.fontFamily.bold,
    marginBottom: 22,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButtonSpacer: {
    width: 40,
    height: 44,
  },
  cardGap: {
    marginBottom: 14,
  },
  customTestsSection: {
    marginTop: 16,
  },
  customTestsHeading: {
    color: NAVY,
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    marginBottom: 12,
  },
  customTestsError: {
    color: '#A33B3B',
    fontFamily: typography.fontFamily.regular,
    marginTop: 12,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  row: {
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 22,
  },
  iconTile: {
    width: 62,
    height: 62,
    borderRadius: 16,
    backgroundColor: 'rgba(160,215,245,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  cardTitle: {
    color: NAVY,
    fontSize: 20,
    lineHeight: 26,
    fontFamily: typography.fontFamily.bold,
  },
  cardSub: {
    color: BLUE_TEXT,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 4,
    fontFamily: typography.fontFamily.regular,
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

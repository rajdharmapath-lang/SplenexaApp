import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import typography from '../../theme/typography';
import BottomNav from '../../components/BottomNav';
import GlassCard, { glassCardEffects } from '../../components/GlassCard';
import AppBackground from '../../components/AppBackground';
import QuestionScreen from './QuestionScreen';
import { fetchQuestionBank } from '../../services/questionBankService';

const SUBJECT_ICONS = {
  anatomy: require('../../assets/images/subjects/icons/anatomy.png'),
  anesthesia: require('../../assets/images/subjects/icons/anesthesia.png'),
  biochemistry: require('../../assets/images/subjects/icons/biochemistry.png'),
  dermatology: require('../../assets/images/subjects/icons/dermatology.png'),
  ent: require('../../assets/images/subjects/icons/ent.png'),
  'forensic-medicine': require('../../assets/images/subjects/icons/forensic-medicine.png'),
  'internal-medicine': require('../../assets/images/subjects/icons/internal-medicine.png'),
  microbiology: require('../../assets/images/subjects/icons/microbiology.png'),
  'obs-gyne': require('../../assets/images/subjects/icons/obs-gyne.png'),
  ophthalmology: require('../../assets/images/subjects/icons/ophthalmology.png'),
  orthopedics: require('../../assets/images/subjects/icons/orthopedics.png'),
  pathology: require('../../assets/images/subjects/icons/pathology.png'),
  pediatrics: require('../../assets/images/subjects/icons/pediatrics.png'),
  pharmacology: require('../../assets/images/subjects/icons/pharmacology.png'),
  physiology: require('../../assets/images/subjects/icons/physiology.png'),
  psm: require('../../assets/images/subjects/icons/psm.png'),
  psychiatry: require('../../assets/images/subjects/icons/psychiatry.png'),
  radiology: require('../../assets/images/subjects/icons/radiology.png'),
  surgery: require('../../assets/images/subjects/icons/surgery.png'),
};

function stripHtml(value) {
  return String(value || '')
    .replace(/<br\s*\/?>|<\/(?:p|div|li|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getImageUri(html) {
  const match = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i.exec(String(html || ''));
  return match?.[1] || null;
}

function toQuestion(question) {
  const questionHtml = question.questionHtml || '';
  const text = stripHtml(questionHtml) || stripHtml(question.text);
  const options = Array.isArray(question.options) ? question.options.map(stripHtml) : [];
  const answer = Number(question.answer);
  if (!text || options.length < 2 || !Number.isInteger(answer) || answer < 0 || answer >= options.length) {
    throw new Error(`Question ${question.id || ''} is incomplete and could not be opened.`);
  }
  const explanationHtml = question.explanationHtml || '';
  return {
    id: String(question.id),
    subjectName: question.subject,
    text,
    image: getImageUri(questionHtml) ? { uri: getImageUri(questionHtml) } : undefined,
    imageAspectRatio: 1.5,
    options,
    answer,
    explanation: stripHtml(explanationHtml),
    explanationImage: getImageUri(explanationHtml)
      ? { uri: getImageUri(explanationHtml) }
      : undefined,
  };
}

function SelectionCard({ title, subtitle, icon, count, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}${subtitle ? `. ${subtitle}` : ''}`}
      onPress={onPress}
      style={styles.cardPressable}
    >
      {({ pressed }) => (
        <GlassCard
          {...glassCardEffects}
          style={[styles.card, pressed && styles.cardPressed]}
          contentStyle={styles.cardContent}
          radius={24}
        >
          {icon ? (
            <Image source={icon} style={styles.itemIcon} accessibilityLabel={`${title} icon`} />
          ) : (
            <View style={styles.topicIcon}>
              <Feather name="folder" size={23} color="#10166B" />
            </View>
          )}
          <View style={styles.cardCopy}>
            <Text numberOfLines={2} style={styles.itemTitle}>{title}</Text>
            {subtitle ? <Text numberOfLines={2} style={styles.itemSubtitle}>{subtitle}</Text> : null}
          </View>
          {Number.isInteger(count) ? <Text style={styles.count}>{count}</Text> : null}
          <LinearGradient
            colors={['#4C6FE8', '#4FE4BA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.arrowCircle}
          >
            <Feather name="arrow-right" size={20} color="#FFFFFF" />
          </LinearGradient>
        </GlassCard>
      )}
    </Pressable>
  );
}

function EmptyState({ title, message, action, onAction }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {action ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.retryButton}>
          <Text style={styles.retryText}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function QBankScreen({
  title = 'Q Bank',
  onBack,
  onNavigate,
  onNotificationPress,
  bookmarkedKeys = [],
  onToggleBookmark,
}) {
  const insets = useSafeAreaInsets();
  const [catalog, setCatalog] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);

  async function loadCatalog() {
    setLoading(true);
    setLoadError(null);
    try {
      setCatalog(await fetchQuestionBank());
    } catch (error) {
      console.error('Unable to load Question Bank content.', error);
      setLoadError(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCatalog();
  }, []);

  const selectedProduct = catalog?.products.find((product) => String(product.id) === selectedProductId);
  const productSubjects = useMemo(
    () => catalog?.subjects.filter((subject) => String(subject.productId) === selectedProductId) ?? [],
    [catalog, selectedProductId],
  );
  const selectedSubject = productSubjects.find((subject) => String(subject.id) === selectedSubjectId);
  const subjectTopics = selectedSubject && Array.isArray(selectedSubject.topics)
    ? selectedSubject.topics
    : [];
  const hasTopicList = Boolean(selectedProduct?.supportsTopics && subjectTopics.length);

  function questionCount(subject, topic) {
    return catalog.questions.filter((question) =>
      String(question.productId) === String(selectedProduct.id) &&
      question.subject === subject.name &&
      (topic === null ? true : (question.topic || '') === topic) &&
      String(question.status || 'Active').toLowerCase() === 'active',
    ).length;
  }

  function openQuestionGroup(subject, topic) {
    try {
      const questions = catalog.questions
        .filter((question) =>
          String(question.productId) === String(selectedProduct.id) &&
          question.subject === subject.name &&
          (topic === null ? true : (question.topic || '') === topic) &&
          String(question.status || 'Active').toLowerCase() === 'active',
        )
        .map(toQuestion);
      if (!questions.length) {
        setLoadError(new Error('No active questions are available in this topic yet.'));
        return;
      }
      setLoadError(null);
      setSelectedTopic(topic);
      setActiveGroup({
        title: [selectedProduct.name, subject.name, topic].filter(Boolean).join(' · '),
        questions,
        reviewEnabled: Boolean(selectedProduct.isReviewEnabled),
      });
    } catch (error) {
      console.error('Unable to prepare Question Bank questions.', error);
      setLoadError(error);
    }
  }

  function goBack() {
    if (activeGroup) {
      setActiveGroup(null);
      return;
    }
    if (selectedSubjectId) {
      setSelectedSubjectId(null);
      setSelectedTopic(null);
      return;
    }
    if (selectedProductId) {
      setSelectedProductId(null);
      return;
    }
    onBack?.();
  }

  if (activeGroup) {
    const bookmarkKeyPrefix = `qBank:${activeGroup.title}:`;
    return (
      <QuestionScreen
        title={activeGroup.title}
        onBack={() => setActiveGroup(null)}
        questions={activeGroup.questions}
        reviewEnabled={activeGroup.reviewEnabled}
        bookmarkedKeys={bookmarkedKeys}
        bookmarkKeyPrefix={bookmarkKeyPrefix}
        onToggleBookmark={(question, isBookmarked) =>
          onToggleBookmark?.(question, isBookmarked, { screen: 'qBank', title: activeGroup.title })
        }
      />
    );
  }

  const screenTitle = selectedSubject?.name || selectedProduct?.name || title;
  const selectedTopicsVisible = Boolean(selectedSubject && hasTopicList);

  return (
    <AppBackground variant="qbank">
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
            accessibilityLabel={selectedProductId ? 'Go back' : 'Back to Test Series'}
            hitSlop={10}
            onPress={goBack}
            style={styles.backButton}
          >
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
          <Text numberOfLines={1} style={styles.heading}>{screenTitle}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <EmptyState title="Loading Question Bank" message="Connecting to the shared catalog…" />
        ) : loadError && !catalog ? (
          <EmptyState
            title="Question Bank unavailable"
            message={loadError.message}
            action="Try again"
            onAction={loadCatalog}
          />
        ) : !catalog?.products.length ? (
          <EmptyState title="No products available" message="Active Question Bank products will appear here." />
        ) : loadError ? (
          <EmptyState
            title="Questions unavailable"
            message={loadError.message}
            action="Try again"
            onAction={() => selectedSubject && openQuestionGroup(selectedSubject, selectedTopic)}
          />
        ) : (
          <View style={styles.subjectList}>
            {!selectedProduct ? catalog.products.map((product) => (
              <SelectionCard
                key={product.id}
                title={product.name}
                subtitle={product.description || 'Question Bank'}
                count={catalog.questions.filter((question) =>
                  String(question.productId) === String(product.id) &&
                  String(question.status || 'Active').toLowerCase() === 'active',
                ).length}
                onPress={() => setSelectedProductId(String(product.id))}
              />
            )) : !selectedSubject ? productSubjects.map((subject) => (
              <SelectionCard
                key={subject.id}
                title={subject.name}
                icon={SUBJECT_ICONS[subject.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')] || null}
                count={questionCount(subject, null)}
                onPress={() => {
                  setSelectedSubjectId(String(subject.id));
                  if (!(selectedProduct.supportsTopics && subject.topics?.length)) {
                    openQuestionGroup(subject, null);
                  }
                }}
              />
            )) : selectedTopicsVisible ? subjectTopics.map((topic) => (
              <SelectionCard
                key={topic}
                title={topic}
                count={questionCount(selectedSubject, topic)}
                onPress={() => openQuestionGroup(selectedSubject, topic)}
              />
            )) : (
              <SelectionCard
                title={`Practice ${selectedSubject.name}`}
                subtitle="Start practicing questions for this subject."
                count={questionCount(selectedSubject, null)}
                onPress={() => openQuestionGroup(selectedSubject, null)}
              />
            )}
            {selectedProduct && !productSubjects.length ? (
              <EmptyState title="No subjects available" message="Subjects added in Question Bank will appear here." />
            ) : null}
            {loadError ? (
              <Text accessibilityRole="alert" style={styles.inlineError}>{loadError.message}</Text>
            ) : null}
          </View>
        )}
      </ScrollView>

      <BottomNav active="tests" onNavigate={onNavigate} onNotificationPress={onNotificationPress} />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    gap: 16,
  },
  pageHeader: {
    minHeight: 78,
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
  heading: {
    flex: 1,
    color: '#100568',
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
    fontFamily: typography.fontFamily.bold,
  },
  headerSpacer: {
    width: 36,
  },
  subjectList: {
    gap: 12,
  },
  cardPressable: {
    width: '100%',
  },
  card: {
    flex: 1,
  },
  cardPressed: {
    opacity: 0.88,
  },
  cardContent: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 18,
  },
  itemIcon: {
    width: 48,
    height: 48,
    flexShrink: 0,
    borderRadius: 12,
  },
  topicIcon: {
    width: 48,
    height: 48,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(160,215,245,0.35)',
  },
  cardCopy: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    color: '#100568',
    fontSize: 16,
    lineHeight: 21,
    fontFamily: typography.fontFamily.bold,
  },
  itemSubtitle: {
    color: '#5778A4',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
  },
  count: {
    color: '#5778A4',
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
  },
  arrowCircle: {
    width: 38,
    height: 38,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  emptyState: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  emptyTitle: {
    color: '#100568',
    fontSize: 18,
    textAlign: 'center',
    fontFamily: typography.fontFamily.bold,
  },
  emptyMessage: {
    color: '#5778A4',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: typography.fontFamily.regular,
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#10166B',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
  },
  inlineError: {
    color: '#B42318',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: typography.fontFamily.medium,
  },
});

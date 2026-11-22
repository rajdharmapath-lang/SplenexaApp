import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBackground from '../../components/AppBackground';
import GlassCard, { glassCardEffects, theme } from '../../components/GlassCard';
import typography from '../../theme/typography';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function DailyQuestionScreen({ question, initialAnswer, onAnswer, onBack, error }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [selectedAnswer, setSelectedAnswer] = useState(initialAnswer ?? null);
  const questionImageAspectRatio = question?.imageAspectRatio ?? 1.5;
  const explanationImageAspectRatio =
    question?.explanationImageAspectRatio ?? questionImageAspectRatio;
  const imageWidth = Math.min(width - 84, 420 * questionImageAspectRatio);
  const explanationImageWidth = Math.min(width - 84, 420 * explanationImageAspectRatio);
  const hasCorrectAnswer = Number.isInteger(question?.answer);

  const selectAnswer = (index) => {
    setSelectedAnswer(index);
    onAnswer(index);
  };

  if (!question) {
    return (
      <AppBackground variant="dailyQuestion">
        <StatusBar barStyle="dark-content" />
        <View style={[styles.content, { flex: 1, paddingTop: insets.top + 16 }]}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to Home"
              hitSlop={10}
              onPress={onBack}
              style={styles.backButton}
            >
              <Feather name="chevron-left" size={30} color={theme.navy} />
            </Pressable>
            <Text style={styles.title}>Today’s Question</Text>
            <View style={styles.headerSpacer} />
          </View>
          <GlassCard {...glassCardEffects} radius={22} contentStyle={styles.subjectCard}>
            <Text style={styles.sectionHeading}>Question unavailable</Text>
            <Text style={styles.explanationText}>
              {error || 'No active questions are available in the database yet.'}
            </Text>
          </GlassCard>
        </View>
      </AppBackground>
    );
  }

  return (
    <AppBackground variant="dailyQuestion">
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 28 },
        ]}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Home"
            hitSlop={10}
            onPress={onBack}
            style={styles.backButton}
          >
            <Feather name="chevron-left" size={30} color={theme.navy} />
          </Pressable>
          <Text style={styles.title}>Today’s Question</Text>
          <View style={styles.headerSpacer} />
        </View>

        <GlassCard {...glassCardEffects} radius={22} contentStyle={styles.subjectCard}>
          <Text style={styles.subject}>{question.subjectName}</Text>
          <Text style={styles.questionText}>{question.text}</Text>
          {question.image ? (
            <Image
              source={question.image}
              resizeMode="contain"
              style={[
                styles.questionImage,
                {
                  width: imageWidth,
                  height: imageWidth / questionImageAspectRatio,
                },
              ]}
              accessibilityLabel={`${question.subjectName} question image`}
            />
          ) : null}
        </GlassCard>

        <Text style={styles.sectionHeading}>Choose an answer</Text>
        <View style={styles.options}>
          {question.options.map((option, index) => {
            const isCorrect = selectedAnswer !== null && hasCorrectAnswer && index === question.answer;
            const isIncorrect = selectedAnswer === index && hasCorrectAnswer && index !== question.answer;
            const isSelected = selectedAnswer === index;

            return (
              <Pressable
                key={`${question.id}-${index}`}
                accessibilityRole="button"
                accessibilityLabel={`Option ${OPTION_LABELS[index]}: ${option}`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => selectAnswer(index)}
              >
                <GlassCard
                  {...glassCardEffects}
                  radius={20}
                  contentStyle={[
                    styles.optionCard,
                    isCorrect && styles.correctOptionCard,
                    isIncorrect && styles.incorrectOptionCard,
                  ]}
                >
                  <View
                    style={[
                      styles.optionLetter,
                      isCorrect && styles.correctOptionLetter,
                      isIncorrect && styles.incorrectOptionLetter,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionLetterText,
                        isCorrect && styles.correctOptionText,
                        isIncorrect && styles.incorrectOptionText,
                      ]}
                    >
                      {OPTION_LABELS[index]}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      isCorrect && styles.correctOptionText,
                      isIncorrect && styles.incorrectOptionText,
                    ]}
                  >
                    {option}
                  </Text>
                  {isCorrect ? <Feather name="check-circle" size={20} color="#067B67" /> : null}
                  {isIncorrect ? <Feather name="x-circle" size={20} color="#C53545" /> : null}
                </GlassCard>
              </Pressable>
            );
          })}
        </View>

        {selectedAnswer !== null ? (
          <GlassCard {...glassCardEffects} radius={24} contentStyle={styles.explanationCard}>
            <View style={styles.explanationHeading}>
              <Feather
                name={hasCorrectAnswer && selectedAnswer === question.answer ? 'check-circle' : 'info'}
                size={20}
                color={hasCorrectAnswer && selectedAnswer === question.answer ? '#067B67' : theme.teal}
              />
              <Text style={styles.sectionHeading}>
                {!hasCorrectAnswer
                  ? 'Answer and explanation'
                  : selectedAnswer === question.answer ? 'Correct!' : 'Answer and explanation'}
              </Text>
            </View>
            {!hasCorrectAnswer ? (
              <Text style={styles.correctAnswer}>No correct answer is marked for this question.</Text>
            ) : selectedAnswer !== question.answer ? (
              <Text style={styles.correctAnswer}>
                Correct answer: {OPTION_LABELS[question.answer]}. {question.options[question.answer]}
              </Text>
            ) : null}
            {question.explanation ? <Text style={styles.explanationText}>{question.explanation}</Text> : null}
            {question.explanationImage ? (
              <Image
                source={question.explanationImage}
                resizeMode="contain"
                style={[
                  styles.explanationImage,
                  {
                    width: explanationImageWidth,
                    height: explanationImageWidth / explanationImageAspectRatio,
                  },
                ]}
                accessibilityLabel="Question explanation image"
              />
            ) : null}
            {question.explanationTable ? (
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  {question.explanationTable.headers.map((header) => (
                    <Text key={header} style={[styles.tableCell, styles.tableHeaderText]}>
                      {header}
                    </Text>
                  ))}
                </View>
                {question.explanationTable.rows.map((row, rowIndex) => (
                  <View
                    key={`${row[0]}-${rowIndex}`}
                    style={[
                      styles.tableRow,
                      rowIndex === question.explanationTable.rows.length - 1 &&
                        styles.tableLastRow,
                    ]}
                  >
                    {row.map((cell, cellIndex) => (
                      <Text key={`${cell}-${cellIndex}`} style={styles.tableCell}>
                        {cell}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            ) : null}
          </GlassCard>
        ) : null}
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: 14,
    paddingHorizontal: 22,
  },
  header: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backButton: {
    width: 44,
    height: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: theme.navy,
    fontSize: 24,
    textAlign: 'center',
    fontFamily: typography.fontFamily.bold,
  },
  headerSpacer: {
    width: 44,
  },
  subjectCard: {
    padding: 20,
  },
  subject: {
    color: theme.teal,
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
  },
  questionText: {
    marginTop: 8,
    color: theme.navy,
    fontSize: 18,
    lineHeight: 27,
    fontFamily: typography.fontFamily.semiBold,
  },
  questionImage: {
    alignSelf: 'center',
    marginTop: 16,
  },
  sectionHeading: {
    color: theme.navy,
    fontSize: 17,
    fontFamily: typography.fontFamily.bold,
  },
  options: {
    gap: 9,
  },
  optionCard: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  correctOptionCard: {
    borderColor: 'rgba(6,123,103,0.45)',
    backgroundColor: 'rgba(6,123,103,0.08)',
  },
  incorrectOptionCard: {
    borderColor: 'rgba(197,53,69,0.45)',
    backgroundColor: 'rgba(197,53,69,0.07)',
  },
  optionLetter: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: 'rgba(1,33,105,0.08)',
  },
  correctOptionLetter: {
    backgroundColor: 'rgba(6,123,103,0.14)',
  },
  incorrectOptionLetter: {
    backgroundColor: 'rgba(197,53,69,0.13)',
  },
  optionLetterText: {
    color: theme.navy,
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
  },
  optionText: {
    flex: 1,
    color: '#33446F',
    fontSize: 15,
    lineHeight: 21,
    fontFamily: typography.fontFamily.regular,
  },
  correctOptionText: {
    color: '#067B67',
    fontFamily: typography.fontFamily.bold,
  },
  incorrectOptionText: {
    color: '#C53545',
    fontFamily: typography.fontFamily.bold,
  },
  explanationCard: {
    padding: 18,
  },
  explanationHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  correctAnswer: {
    marginTop: 10,
    color: '#067B67',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: typography.fontFamily.bold,
  },
  explanationText: {
    marginTop: 10,
    color: '#33446F',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: typography.fontFamily.regular,
  },
  explanationImage: {
    alignSelf: 'center',
    marginTop: 14,
  },
  table: {
    marginTop: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(1,33,105,0.12)',
    borderRadius: 14,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(1,33,105,0.10)',
  },
  tableHeader: {
    backgroundColor: 'rgba(1,33,105,0.06)',
  },
  tableLastRow: {
    borderBottomWidth: 0,
  },
  tableCell: {
    flex: 1,
    padding: 10,
    color: '#33446F',
    fontSize: 13,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
  },
  tableHeaderText: {
    color: theme.navy,
    fontFamily: typography.fontFamily.bold,
  },
});

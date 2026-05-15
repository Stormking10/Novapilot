import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  SafeAreaView, Dimensions, Animated 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import modules from '../data/learning_modules.json';

const { width } = Dimensions.get('window');

export default function QuizScreen({ route, navigation }: any) {
  const { moduleId } = route.params;
  const module = modules.find(m => m.id === moduleId);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  if (!module) return null;

  const question = module.questions[currentQuestionIndex];

  const handleOptionPress = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    
    if (index === question.answer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < module.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setQuizComplete(true);
    }
  };

  if (quizComplete) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0D1117', '#1A1D23']} style={styles.fullCenter}>
          <Ionicons name="trophy" size={80} color="#00D1FF" />
          <Text style={styles.completeTitle}>Module Complete!</Text>
          <Text style={styles.completeSubtitle}>
            You scored {score} out of {module.questions.length}
          </Text>
          <TouchableOpacity 
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneButtonText}>Back to Curriculum</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Knowledge Check</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressInner, 
            { width: `${((currentQuestionIndex + 1) / module.questions.length) * 100}%` }
          ]} 
        />
      </View>

      <View style={styles.quizContent}>
        <Text style={styles.questionCount}>
          Question {currentQuestionIndex + 1} of {module.questions.length}
        </Text>
        <Text style={styles.questionText}>{question.text}</Text>

        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => {
            let borderColor = '#30363D';
            let bgColor = '#161B22';
            
            if (isAnswered) {
              if (index === question.answer) {
                borderColor = '#3FB950';
                bgColor = 'rgba(63, 185, 80, 0.1)';
              } else if (index === selectedOption) {
                borderColor = '#F85149';
                bgColor = 'rgba(248, 81, 73, 0.1)';
              }
            } else if (index === selectedOption) {
              borderColor = '#00D1FF';
            }

            return (
              <TouchableOpacity 
                key={index}
                style={[styles.optionCard, { borderColor, backgroundColor: bgColor }]}
                onPress={() => handleOptionPress(index)}
                disabled={isAnswered}
              >
                <Text style={styles.optionText}>{option}</Text>
                {isAnswered && index === question.answer && (
                  <Ionicons name="checkmark-circle" size={20} color="#3FB950" />
                )}
                {isAnswered && index === selectedOption && index !== question.answer && (
                  <Ionicons name="close-circle" size={20} color="#F85149" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.nextButton, !isAnswered && styles.nextButtonDisabled]}
          disabled={!isAnswered}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentQuestionIndex === module.questions.length - 1 ? "Finish" : "Next Question"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  fullCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#1A1D23',
    width: '100%',
  },
  progressInner: {
    height: '100%',
    backgroundColor: '#00D1FF',
  },
  quizContent: {
    flex: 1,
    padding: 24,
  },
  questionCount: {
    color: '#00D1FF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  questionText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 30,
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 12,
    borderWidth: 2,
  },
  optionText: {
    color: '#E6EDF3',
    fontSize: 16,
    flex: 1,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  nextButton: {
    backgroundColor: '#00D1FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#1A1D23',
  },
  nextButtonText: {
    color: '#0D1117',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completeTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 24,
  },
  completeSubtitle: {
    color: '#8B949E',
    fontSize: 16,
    marginTop: 8,
    marginBottom: 40,
  },
  doneButton: {
    backgroundColor: '#00D1FF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  doneButtonText: {
    color: '#0D1117',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    id: '1',
    icon: 'shield-checkmark',
    title: 'Secure Code Detection',
    description:
      'Automatically scan your code for security vulnerabilities. Supports Python, JavaScript, Go, Java, and C#.',
    color: '#00D4FF',
  },
  {
    id: '2',
    icon: 'sparkles',
    title: 'AI-Powered Solutions',
    description:
      'Get intelligent recommendations from our AI assistant. Learn how to fix vulnerabilities securely.',
    color: '#FF6B9D',
  },
  {
    id: '3',
    icon: 'book',
    title: 'OWASP Learning',
    description:
      'Learn about the top 10 OWASP vulnerabilities through interactive modules and quizzes.',
    color: '#00D98E',
  },
  {
    id: '4',
    icon: 'bug',
    title: 'Dependency Security',
    description:
      'Check your dependencies for known CVEs. Keep your supply chain secure.',
    color: '#FFD700',
  },
  {
    id: '5',
    icon: 'checkmark-circle',
    title: 'Ready to Begin?',
    description:
      'Start by scanning your first code snippet or exploring the learning modules to strengthen your security knowledge.',
    color: '#00D4FF',
    isLast: true,
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const completeOnboarding = () => {
    global.hasSeenOnboarding = true;
    navigation.replace('MainApp');
  };

  const slide = ONBOARDING_SLIDES[currentIndex];
  const progress = ((currentIndex + 1) / ONBOARDING_SLIDES.length) * 100;

  return (
    <LinearGradient
      colors={['#0a0e27', '#1a1f3a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      {/* Skip Button */}
      {currentIndex < ONBOARDING_SLIDES.length - 1 && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={completeOnboarding}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${slide.color}20` }]}>
          <Ionicons name={slide.icon as any} size={80} color={slide.color} />
        </View>

        {/* Slide Number */}
        <Text style={styles.slideNumber}>
          {currentIndex + 1} of {ONBOARDING_SLIDES.length}
        </Text>

        {/* Title */}
        <Text style={styles.title}>{slide.title}</Text>

        {/* Description */}
        <Text style={styles.description}>{slide.description}</Text>

        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          {ONBOARDING_SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentIndex ? slide.color : '#4A5568',
                  width: index === currentIndex ? 32 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        {currentIndex > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handlePrevious}
          >
            <Ionicons name="arrow-back" size={20} color="#A0AEC0" />
            <Text style={styles.buttonSecondaryText}>Previous</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonPrimary,
            { flex: currentIndex > 0 ? 1 : 0, marginLeft: currentIndex > 0 ? 12 : 0 },
          ]}
          onPress={handleNext}
        >
          <Text style={styles.buttonPrimaryText}>
            {currentIndex === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color="#FFFFFF"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 40,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: '#2D3748',
    width: '100%',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00D4FF',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    color: '#A0AEC0',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  slideNumber: {
    color: '#718096',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#A0AEC0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s ease',
  },
  buttonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: '#00D4FF',
  },
  buttonSecondary: {
    backgroundColor: '#2D3748',
    borderWidth: 1,
    borderColor: '#4A5568',
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: '#A0AEC0',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

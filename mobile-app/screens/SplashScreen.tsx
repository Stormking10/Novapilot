import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }: any) {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if user has seen onboarding
      const hasSeenOnboarding = global.hasSeenOnboarding || false;
      
      if (hasSeenOnboarding) {
        navigation.replace('MainApp');
      } else {
        navigation.replace('Onboarding');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <LinearGradient
      colors={['#0a0e27', '#1a1f3a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={80} color="#00D4FF" />
          </View>
        </View>

        {/* App Name */}
        <Text style={styles.appName}>OWASPilot</Text>
        <Text style={styles.tagline}>AI-Powered Security Guide</Text>

        {/* Loading Indicator */}
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#00D4FF" />
          <Text style={styles.loaderText}>Initializing Security Assistant...</Text>
        </View>

        {/* Version */}
        <Text style={styles.version}>v0.1.0</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00D4FF',
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: '#A0AEC0',
    marginBottom: 60,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  loaderContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loaderText: {
    color: '#A0AEC0',
    fontSize: 12,
    marginTop: 16,
    fontWeight: '500',
  },
  version: {
    color: '#4A5568',
    fontSize: 11,
    position: 'absolute',
    bottom: 40,
  },
});

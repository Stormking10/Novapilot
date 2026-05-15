import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import modules from '../data/learning_modules.json';

export default function LearnScreen({ navigation }: any) {
  const totalMastery = modules.reduce((acc, m) => acc + m.mastery, 0) / modules.length;

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#1A1D23', '#0D1117']}
        style={styles.header}
      >
        <View style={styles.statsRow}>
          <View>
            <Text style={styles.title}>Learning Path</Text>
            <Text style={styles.subtitle}>OWASP Top 10 Mastery</Text>
          </View>
          <View style={styles.masteryCircle}>
            <Text style={styles.masteryText}>{Math.round(totalMastery * 100)}%</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.listContainer}>
        {modules.map((item) => (
          <View key={item.id} style={styles.moduleCard}>
            <View style={styles.moduleHeader}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={item.mastery === 1 ? "checkmark-circle" : "book-outline"} 
                  size={24} 
                  color={item.mastery === 1 ? "#00D1FF" : "#666"} 
                />
              </View>
              <View style={styles.moduleInfo}>
                <Text style={styles.moduleTitle}>{item.title}</Text>
                <Text style={styles.moduleDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            </View>

            <View style={styles.progressRow}>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${item.mastery * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(item.mastery * 100)}%</Text>
            </View>

            <TouchableOpacity 
              style={styles.quizButton}
              onPress={() => navigation.navigate('Quiz', { moduleId: item.id })}
            >
              <Text style={styles.quizButtonText}>
                {item.mastery === 1 ? "Retake Quiz" : "Take Quiz"}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#00D1FF" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>More modules coming soon</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  header: {
    padding: 24,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1D23',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#00D1FF',
    marginTop: 4,
  },
  masteryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#00D1FF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 209, 255, 0.1)',
  },
  masteryText: {
    color: '#00D1FF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
  },
  moduleCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#0D1117',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  moduleDesc: {
    fontSize: 12,
    color: '#8B949E',
    lineHeight: 18,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#0D1117',
    borderRadius: 3,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00D1FF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#8B949E',
    width: 35,
  },
  quizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#30363D',
  },
  quizButtonText: {
    color: '#00D1FF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    color: '#484F58',
    fontSize: 14,
    fontStyle: 'italic',
  },
});


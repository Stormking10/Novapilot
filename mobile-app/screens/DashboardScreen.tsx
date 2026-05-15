import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, RefreshControl, 
  TouchableOpacity, ActivityIndicator, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getHistory, ScanResult } from '../api/scan';
import modules from '../data/learning_modules.json';
import profile from '../data/user_profile.json';

const { width } = Dimensions.get('window');

const RISK_COLOR = (s: number) => s >= 70 ? '#FF4D4D' : s >= 40 ? '#D29922' : '#3FB950';

export default function DashboardScreen({ navigation }: any) {
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data.scans || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const unsubscribe = navigation.addListener('focus', fetchHistory);
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const totalIssues = history.reduce((acc, scan) => acc + scan.vulnerabilities.length, 0);
  const criticalIssues = history.reduce((acc, scan) => 
    acc + scan.vulnerabilities.filter(v => v.severity === 'CRITICAL' || v.severity === 'HIGH').length, 0
  );
  
  // Learning Mastery Calculations
  const completedModules = modules.filter(m => m.mastery === 1).length;
  const avgMastery = modules.reduce((acc, m) => acc + m.mastery, 0) / modules.length;
  const avgRisk = history.length
    ? Math.round(history.reduce((a, s) => a + s.risk_score, 0) / history.length)
    : 0;
  
  const getRank = () => {
    if (avgMastery >= 0.9) return { title: 'Elite Auditor', color: '#00D1FF' };
    if (avgMastery >= 0.6) return { title: 'Security Hunter', color: '#3FB950' };
    if (avgMastery >= 0.3) return { title: 'Guardian', color: '#D29922' };
    return { title: 'Novice', color: '#8B949E' };
  };
  
  const rank = getRank();

  if (loading && !refreshing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00D1FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D1FF" />}
      >
        {/* Posture Card */}
        <LinearGradient
          colors={['#1A1D23', '#0D1117']}
          style={styles.postureCard}
        >
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color="#00D1FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{profile.displayName}</Text>
              <Text style={styles.profileMeta}>{profile.role} - {profile.team}</Text>
            </View>
          </View>
          <View style={styles.postureHeader}>
            <View>
              <Text style={styles.postureTitle}>Security Posture</Text>
              <View style={[styles.rankBadge, { borderColor: rank.color }]}>
                <Text style={[styles.rankText, { color: rank.color }]}>{rank.title}</Text>
              </View>
            </View>
            <View style={[styles.scoreCircle, { borderColor: RISK_COLOR(avgRisk) }]}>
              <Text style={styles.scoreText}>{avgRisk}</Text>
              <Text style={styles.scoreLabel}>RISK</Text>
            </View>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalIssues}</Text>
              <Text style={styles.statLabel}>Open Issues</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#F85149' }]}>{criticalIssues}</Text>
              <Text style={styles.statLabel}>Critical/High</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{completedModules}</Text>
              <Text style={styles.statLabel}>Mastered</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Learning Growth Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Learning Growth</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Learn')}>
            <Text style={styles.seeAll}>Resume Training</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.learningCard}
          onPress={() => navigation.navigate('Learn')}
        >
          <View style={styles.learningInfo}>
            <View style={styles.learningIcon}>
              <Ionicons name="school" size={24} color="#00D1FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.learningTitle}>OWASP Knowledge</Text>
              <Text style={styles.learningSub}>You've mastered {completedModules}/10 topics</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#30363D" />
          </View>
          <View style={styles.learningProgress}>
            <View style={[styles.learningBar, { width: `${avgMastery * 100}%` }]} />
          </View>
        </TouchableOpacity>

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>

        {history.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="shield-checkmark-outline" size={48} color="#30363D" />
            <Text style={styles.emptyText}>No recent scans</Text>
          </View>
        ) : (
          history.slice(0, 5).map((scan) => (
            <TouchableOpacity 
              key={scan.id ?? scan.scan_id} 
              style={styles.activityCard}
              onPress={() => navigation.navigate('Results', { result: scan })}
            >
              <View style={styles.activityIcon}>
                <Ionicons 
                  name={scan.language === 'python' ? 'logo-python' : 'code-slash-outline'} 
                  size={20} 
                  color="#00D1FF" 
                />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle} numberOfLines={1}>{scan.summary}</Text>
                <Text style={styles.activityDate}>
                  {scan.created_at ? new Date(scan.created_at).toLocaleDateString() : 'Recent'} - {scan.vulnerabilities.length} findings
                </Text>
              </View>
              <View style={styles.scoreIndicator}>
                 <Text style={[styles.scoreMini, { color: RISK_COLOR(scan.risk_score) }]}>{scan.risk_score}</Text>
                 <Ionicons name="chevron-forward" size={14} color="#30363D" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* FAB for Scanner */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('Scanner')}
      >
        <LinearGradient
          colors={['#00D1FF', '#007AFF']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={32} color="#0D1117" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loading: {
    flex: 1,
    backgroundColor: '#0D1117',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postureCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  postureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0D1117',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  profileName: {
    color: '#E6EDF3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileMeta: {
    color: '#8B949E',
    fontSize: 12,
    marginTop: 2,
  },
  postureTitle: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rankBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  scoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scoreLabel: {
    fontSize: 8,
    color: '#8B949E',
    marginTop: -2,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#8B949E',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E6EDF3',
  },
  seeAll: {
    fontSize: 14,
    color: '#00D1FF',
  },
  learningCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  learningInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  learningIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#0D1117',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  learningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  learningSub: {
    fontSize: 13,
    color: '#8B949E',
    marginTop: 2,
  },
  learningProgress: {
    height: 4,
    backgroundColor: '#0D1117',
    borderRadius: 2,
    overflow: 'hidden',
  },
  learningBar: {
    height: '100%',
    backgroundColor: '#00D1FF',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0D1117',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E6EDF3',
  },
  activityDate: {
    fontSize: 12,
    color: '#8B949E',
    marginTop: 2,
  },
  scoreIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreMini: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#484F58',
    marginTop: 12,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    elevation: 8,
    shadowColor: '#00D1FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

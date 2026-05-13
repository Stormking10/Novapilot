import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { getHistory, ScanResult } from '../api/scan';
import { SeverityBadge } from '../components/SeverityBadge';

const RISK_COLOR = (s: number) => s >= 70 ? '#FF4D4D' : s >= 40 ? '#D29922' : '#3FB950';

export default function DashboardScreen({ navigation }: any) {
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then(h => setHistory(h.scans))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allVulns = history.flatMap(s => s.vulnerabilities);
  const openIssues = allVulns.length;
  const critHigh = allVulns.filter(v => v.severity === 'CRITICAL' || v.severity === 'HIGH').length;
  const avgRisk = history.length
    ? Math.round(history.reduce((a, s) => a + s.risk_score, 0) / history.length)
    : 0;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Good morning, dev</Text>

      <View style={styles.metricsGrid}>
        {[
          { label: 'Total scans', value: history.length, color: '#C9D1D9' },
          { label: 'Open issues', value: openIssues, color: '#FF4D4D' },
          { label: 'Critical/High', value: critHigh, color: '#FF7B72' },
          { label: 'Avg risk', value: avgRisk, color: RISK_COLOR(avgRisk) },
        ].map(m => (
          <View key={m.label} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{m.label}</Text>
            <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Recent scans</Text>
      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
      {history.slice(0, 5).map(scan => (
        <TouchableOpacity
          key={scan.scan_id}
          style={styles.historyRow}
          onPress={() => navigation.navigate('Results', { result: scan })}
        >
          <View style={styles.historyInfo}>
            <Text style={styles.historyName} numberOfLines={1}>{scan.summary}</Text>
            <Text style={styles.historyMeta}>{scan.vulnerabilities.length} findings</Text>
          </View>
          <Text style={[styles.historyScore, { color: RISK_COLOR(scan.risk_score) }]}>
            {scan.risk_score}/100
          </Text>
        </TouchableOpacity>
      ))}

      {history.length === 0 && !loading && (
        <Text style={styles.empty}>No scans yet — go to Scanner to get started.</Text>
      )}

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => navigation.navigate('Scan')}
      >
        <Text style={styles.primaryBtnText}>New scan →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1117' },
  content: { padding: 20, gap: 12 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#E6EDF3', marginBottom: 4 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: {
    width: '48%', backgroundColor: '#161B22',
    borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#30363D',
  },
  metricLabel: { fontSize: 12, color: '#8B949E', marginBottom: 4, fontWeight: '500' },
  metricValue: { fontSize: 26, fontWeight: 'bold', color: '#E6EDF3' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#8B949E', letterSpacing: 0.5, marginTop: 12, textTransform: 'uppercase' },
  historyRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1A1D23',
  },
  historyInfo: { flex: 1 },
  historyName: { fontSize: 14, fontWeight: '600', color: '#E6EDF3' },
  historyMeta: { fontSize: 12, color: '#484F58', marginTop: 3 },
  historyScore: { fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace' },
  empty: { color: '#484F58', fontSize: 13, textAlign: 'center', marginTop: 30 },
  primaryBtn: {
    backgroundColor: '#00D1FF', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 20,
    shadowColor: '#00D1FF', shadowOpacity: 0.4, shadowRadius: 10,
    elevation: 5,
  },
  primaryBtnText: { color: '#000', fontWeight: 'bold', fontSize: 15 },
});

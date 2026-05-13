import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ScanResult, Vulnerability } from '../api/scan';
import { SeverityBadge } from '../components/SeverityBadge';

const RISK_COLOR = (s: number) => s >= 70 ? '#FF4D4D' : s >= 40 ? '#D29922' : '#3FB950';
const RISK_BG    = (s: number) => s >= 70 ? '#3D1B1B' : s >= 40 ? '#382A10' : '#1A2E1A';

function VulnRow({ v }: { v: Vulnerability }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity style={styles.vulnRow} onPress={() => setOpen(o => !o)} activeOpacity={0.7}>
      <View style={styles.vulnHeader}>
        <SeverityBadge severity={v.severity} />
        <Text style={styles.vulnTitle} numberOfLines={open ? undefined : 1}>{v.title}</Text>
        <Text style={styles.vulnMeta}>L{v.line}</Text>
      </View>
      {v.owasp && <Text style={styles.vulnOwasp}>{v.owasp}</Text>}
      {open && (
        <View style={styles.vulnBody}>
          <Text style={styles.vulnExplain}>{v.explanation}</Text>
          {v.fix ? (
            <View style={styles.fixBlock}>
              <Text style={styles.fixCode}>{v.fix}</Text>
            </View>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ResultsScreen({ route }: any) {
  const result: ScanResult | undefined = route.params?.result;

  if (!result) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>No scan results yet.</Text>
        <Text style={styles.emptyHint}>Run a scan from the Scanner tab.</Text>
      </View>
    );
  }

  const { vulnerabilities, risk_score, summary } = result;
  const critHigh = vulnerabilities.filter(v => v.severity === 'CRITICAL' || v.severity === 'HIGH').length;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={[styles.banner, { backgroundColor: RISK_BG(risk_score) }]}>
        <Text style={[styles.bannerTitle, { color: RISK_COLOR(risk_score) }]}>
          {vulnerabilities.length === 0
            ? 'No vulnerabilities found'
            : `${vulnerabilities.length} vulnerabilit${vulnerabilities.length === 1 ? 'y' : 'ies'} found`}
        </Text>
        <Text style={[styles.bannerSub, { color: RISK_COLOR(risk_score) }]}>
          Risk score: {risk_score}/100 · {summary}
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLbl}>Total</Text>
          <Text style={styles.metricVal}>{vulnerabilities.length}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLbl}>Critical / High</Text>
          <Text style={[styles.metricVal, { color: '#FF7B72' }]}>{critHigh}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLbl}>Risk score</Text>
          <Text style={[styles.metricVal, { color: RISK_COLOR(risk_score) }]}>{risk_score}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Findings</Text>
      {vulnerabilities.length === 0 && (
        <Text style={styles.noFindings}>Clean — no vulnerabilities detected.</Text>
      )}
      {vulnerabilities.map(v => <VulnRow key={v.id} v={v} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1117' },
  content: { padding: 16, gap: 12 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#E6EDF3' },
  emptyHint: { fontSize: 14, color: '#8B949E' },
  banner: { borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#30363D' },
  bannerTitle: { fontSize: 18, fontWeight: 'bold' },
  bannerSub: { fontSize: 13, marginTop: 4, lineHeight: 20 },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metric: {
    flex: 1, backgroundColor: '#161B22',
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#30363D',
  },
  metricLbl: { fontSize: 12, color: '#8B949E' },
  metricVal: { fontSize: 22, fontWeight: 'bold', marginTop: 4, color: '#E6EDF3' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#8B949E', letterSpacing: 0.5, marginTop: 10, textTransform: 'uppercase' },
  noFindings: { fontSize: 14, color: '#3FB950', textAlign: 'center', marginTop: 20, fontWeight: '600' },
  vulnRow: {
    borderBottomWidth: 1, borderBottomColor: '#1A1D23',
    paddingVertical: 14,
  },
  vulnHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vulnTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#E6EDF3' },
  vulnMeta: { fontSize: 12, color: '#484F58', fontFamily: 'monospace' },
  vulnOwasp: { fontSize: 12, color: '#8B949E', marginTop: 4 },
  vulnBody: { marginTop: 14, gap: 10 },
  vulnExplain: { fontSize: 14, color: '#C9D1D9', lineHeight: 22 },
  fixBlock: {
    backgroundColor: '#0D1117', borderRadius: 10,
    padding: 14, borderWidth: 1, borderColor: '#30363D',
  },
  fixCode: { fontSize: 12, fontFamily: 'monospace', color: '#7EE787', lineHeight: 20 },
});

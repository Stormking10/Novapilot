import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, Platform, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScanResult, Vulnerability, getHistory } from '../api/scan';
import { SeverityBadge } from '../components/SeverityBadge';
import { exportMarkdownReport, rewriteSecure, simulateAttack, AttackSimulation, RewriteResult } from '../api/advanced';

const { width } = Dimensions.get('window');

const RISK_COLOR = (s: number) => s >= 70 ? '#FF4D4D' : s >= 40 ? '#D29922' : '#3FB950';
const NEXT_STEPS = [
  'Fix critical and high findings first.',
  'Run the secure rewrite and compare the suggested changes.',
  'Export the Markdown report for review or submission.',
];

function VulnRow({ v, code, language, navigation }: { v: Vulnerability, code: string, language: string, navigation: any }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.vulnWrapper}>
      <TouchableOpacity 
        style={[styles.vulnRow, open && styles.vulnRowActive]} 
        onPress={() => setOpen(o => !o)} 
        activeOpacity={0.7}
      >
        <View style={styles.vulnHeader}>
          <SeverityBadge severity={v.severity} />
          <View style={{ flex: 1 }}>
            <Text style={styles.vulnTitle} numberOfLines={open ? undefined : 1}>{v.title}</Text>
            <View style={styles.vulnMetaRow}>
              <Text style={styles.vulnLine}>Line {v.line}</Text>
              {v.owasp && <Text style={styles.vulnOwasp}> • {v.owasp}</Text>}
            </View>
          </View>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color="#484F58" />
        </View>
      </TouchableOpacity>
      
      {open && (
        <View style={styles.vulnBody}>
          <Text style={styles.sectionLabel}>EXPLANATION</Text>
          <Text style={styles.vulnExplain}>{v.explanation}</Text>
          
          <TouchableOpacity 
            style={styles.chatLink}
            onPress={() => navigation.navigate('Chat', { code, vulnerability: v, language })}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#00D1FF" />
            <Text style={styles.chatLinkText}>Ask AI about this finding</Text>
          </TouchableOpacity>

          {v.fix ? (
            <>
              <Text style={styles.sectionLabel}>SECURE FIX</Text>
              <View style={styles.fixBlock}>
                <Text style={styles.fixCode}>{v.fix}</Text>
                <TouchableOpacity style={styles.copyBtn}>
                  <Ionicons name="copy-outline" size={16} color="#00D1FF" />
                  <Text style={styles.copyBtnText}>Copy Fix</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </View>
      )}
    </View>
  );
}

export default function ResultsScreen({ route, navigation }: any) {
  const initialCode = route?.params?.code || "";
  const initialLang = route?.params?.language || "python";
  const [result, setResult] = useState<ScanResult | null>(route?.params?.result || null);
  const [loading, setLoading] = useState(!route?.params?.result);
  const [activeCode, setActiveCode] = useState(initialCode);
  const [activeLang, setActiveLang] = useState(initialLang);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | Vulnerability['severity']>('ALL');
  const [query, setQuery] = useState('');
  const [working, setWorking] = useState<'rewrite' | 'attack' | 'report' | null>(null);
  const [rewrite, setRewrite] = useState<RewriteResult | null>(null);
  const [attack, setAttack] = useState<AttackSimulation | null>(null);
  const [report, setReport] = useState('');

  const fetchLatest = async () => {
    try {
      const history = await getHistory();
      if (history.scans && history.scans.length > 0) {
        const latest = history.scans[0];
        setResult(latest);
        // If we don't have code in params, use a fallback for chat context
        if (!activeCode) {
          setActiveCode("// Code from previous scan\n" + (latest.summary || ""));
          setActiveLang("python");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (route?.params?.result) {
      setResult(route.params.result);
      setActiveCode(route.params.code);
      setActiveLang(route.params.language);
      setLoading(false);
    } else {
      fetchLatest();
    }
    const unsub = navigation.addListener('focus', () => {
      if (!route?.params?.result) fetchLatest();
    });
    return unsub;
  }, [route?.params?.result]);

  if (loading) {
    return (
      <View style={styles.emptyWrap}>
        <ActivityIndicator size="large" color="#00D1FF" />
      </View>
    );
  }

  if (!result) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="document-text-outline" size={64} color="#30363D" />
        <Text style={styles.emptyText}>No analysis to show</Text>
        <Text style={styles.emptyHint}>Run a new scan to see detailed results.</Text>
      </View>
    );
  }

  const { vulnerabilities, risk_score, summary } = result;
  const critHigh = vulnerabilities.filter(v => v.severity === 'CRITICAL' || v.severity === 'HIGH').length;
  const filteredVulnerabilities = vulnerabilities.filter(v => {
    const matchesSeverity = severityFilter === 'ALL' || v.severity === severityFilter;
    const text = `${v.title} ${v.explanation} ${v.owasp ?? ''} ${v.cwe ?? ''}`.toLowerCase();
    return matchesSeverity && text.includes(query.toLowerCase());
  });
  const firstFinding = filteredVulnerabilities[0] ?? vulnerabilities[0];

  const handleRewrite = async () => {
    if (!activeCode || vulnerabilities.length === 0) return;
    setWorking('rewrite');
    try {
      setRewrite(await rewriteSecure(activeCode, vulnerabilities));
    } catch (e: any) {
      Alert.alert('Rewrite failed', e.message ?? 'Unknown error');
    } finally {
      setWorking(null);
    }
  };

  const handleAttack = async () => {
    if (!firstFinding) return;
    setWorking('attack');
    try {
      setAttack(await simulateAttack(firstFinding));
    } catch (e: any) {
      Alert.alert('Attack simulation failed', e.message ?? 'Unknown error');
    } finally {
      setWorking(null);
    }
  };

  const handleReport = async () => {
    setWorking('report');
    try {
      setReport(await exportMarkdownReport(result));
    } catch (e: any) {
      Alert.alert('Report export failed', e.message ?? 'Unknown error');
    } finally {
      setWorking(null);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={['#1A1D23', '#0D1117']}
        style={styles.summaryCard}
      >
        {result.scan_id === 'demo-scan' && (
          <View style={styles.demoBadge}>
            <Ionicons name="flash-outline" size={14} color="#00D1FF" />
            <Text style={styles.demoBadgeText}>Demo scan</Text>
          </View>
        )}
        <View style={styles.summaryHeader}>
          <View style={styles.riskCircle}>
            <Text style={[styles.riskValue, { color: RISK_COLOR(risk_score) }]}>{risk_score}</Text>
            <Text style={styles.riskLabel}>RISK</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.summaryTitle}>
              {vulnerabilities.length} {vulnerabilities.length === 1 ? 'Vulnerability' : 'Vulnerabilities'}
            </Text>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.miniStats}>
          <View style={styles.miniStat}>
            <Text style={styles.miniStatLabel}>CRITICAL / HIGH</Text>
            <Text style={[styles.miniStatValue, { color: '#FF7B72' }]}>{critHigh}</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={styles.miniStatLabel}>MEDIUM / LOW</Text>
            <Text style={styles.miniStatValue}>{vulnerabilities.length - critHigh}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.nextPanel}>
        <Text style={styles.nextTitle}>Recommended Next Steps</Text>
        {NEXT_STEPS.map((step, index) => (
          <View key={step} style={styles.nextRow}>
            <Text style={styles.nextNumber}>{index + 1}</Text>
            <Text style={styles.nextText}>{step}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>DETAILED FINDINGS</Text>
        <Text style={styles.findingsCount}>{filteredVulnerabilities.length}</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="Search findings"
        placeholderTextColor="#484F58"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const).map(item => (
          <TouchableOpacity
            key={item}
            style={[styles.filterBtn, severityFilter === item && styles.filterBtnActive]}
            onPress={() => setSeverityFilter(item)}
          >
            <Text style={[styles.filterText, severityFilter === item && styles.filterTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleRewrite} disabled={working !== null || vulnerabilities.length === 0}>
          <Ionicons name="construct-outline" size={16} color="#00D1FF" />
          <Text style={styles.actionText}>{working === 'rewrite' ? 'Rewriting...' : 'Rewrite'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleAttack} disabled={working !== null || vulnerabilities.length === 0}>
          <Ionicons name="bug-outline" size={16} color="#00D1FF" />
          <Text style={styles.actionText}>{working === 'attack' ? 'Simulating...' : 'Attack'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleReport} disabled={working !== null}>
          <Ionicons name="document-text-outline" size={16} color="#00D1FF" />
          <Text style={styles.actionText}>{working === 'report' ? 'Exporting...' : 'Report'}</Text>
        </TouchableOpacity>
      </View>

      {vulnerabilities.length === 0 && (
        <View style={styles.cleanContainer}>
          <Ionicons name="checkmark-circle" size={48} color="#3FB950" />
          <Text style={styles.cleanText}>Your code is secure!</Text>
          <Text style={styles.cleanSub}>No vulnerabilities were detected by our engine.</Text>
        </View>
      )}

      {filteredVulnerabilities.map(v => (
        <VulnRow 
          key={v.id} 
          v={v} 
          code={activeCode} 
          language={activeLang} 
          navigation={navigation} 
        />
      ))}

      {rewrite && (
        <View style={styles.outputPanel}>
          <Text style={styles.outputTitle}>Secure Rewrite</Text>
          <Text style={styles.outputMeta}>Score {rewrite.security_score_before} to {rewrite.security_score_after}</Text>
          {rewrite.changes.map((change, index) => (
            <Text key={`${change.type}-${index}`} style={styles.outputText}>{change.type}: {change.description}</Text>
          ))}
          <View style={styles.beforeAfterGrid}>
            <View style={styles.codeColumn}>
              <Text style={styles.codeLabel}>Original</Text>
              <Text style={[styles.codeBlock, styles.originalBlock]}>{activeCode || 'Original code unavailable for this historical scan.'}</Text>
            </View>
            <View style={styles.codeColumn}>
              <Text style={styles.codeLabel}>Secure Rewrite</Text>
              <Text style={styles.codeBlock}>{rewrite.rewritten_code}</Text>
            </View>
          </View>
        </View>
      )}

      {attack && (
        <View style={styles.outputPanel}>
          <Text style={styles.outputTitle}>{attack.attack_name}</Text>
          <Text style={styles.outputMeta}>Difficulty: {attack.difficulty}</Text>
          {attack.steps.map(step => (
            <Text key={step.number} style={styles.outputText}>{step.number}. {step.title}: {step.description}</Text>
          ))}
          <Text style={styles.outputText}>Impact: {attack.impact}</Text>
        </View>
      )}

      {!!report && (
        <View style={styles.outputPanel}>
          <Text style={styles.outputTitle}>Markdown Report</Text>
          <Text style={styles.codeBlock}>{report}</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.newScanBtn}
        onPress={() => navigation.navigate('Scanner')}
      >
        <Ionicons name="add-circle-outline" size={20} color="#00D1FF" />
        <Text style={styles.newScanText}>Scan New Snippet</Text>
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1117' },
  content: { padding: 20 },
  
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#E6EDF3' },
  emptyHint: { fontSize: 14, color: '#8B949E', textAlign: 'center' },

  summaryCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#30363D',
    marginBottom: 24,
  },
  demoBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#30363D',
    backgroundColor: '#0D1117',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  demoBadgeText: { color: '#00D1FF', fontSize: 11, fontWeight: 'bold' },
  summaryHeader: { flexDirection: 'row', alignItems: 'center' },
  riskCircle: {
    width: 64, height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#30363D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskValue: { fontSize: 22, fontWeight: '900' },
  riskLabel: { fontSize: 8, color: '#8B949E', fontWeight: 'bold' },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', color: '#E6EDF3' },
  summaryText: { fontSize: 13, color: '#8B949E', marginTop: 4, lineHeight: 18 },
  
  divider: { height: 1, backgroundColor: '#30363D', marginVertical: 20 },
  
  miniStats: { flexDirection: 'row', justifyContent: 'space-between' },
  miniStat: { flex: 1 },
  miniStatLabel: { fontSize: 10, color: '#8B949E', fontWeight: 'bold', marginBottom: 4 },
  miniStatValue: { fontSize: 18, fontWeight: 'bold', color: '#E6EDF3' },
  nextPanel: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 16,
    gap: 10,
    marginBottom: 22,
  },
  nextTitle: { color: '#E6EDF3', fontSize: 15, fontWeight: 'bold' },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nextNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#0D1117',
    backgroundColor: '#00D1FF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  nextText: { flex: 1, color: '#C9D1D9', fontSize: 13, lineHeight: 19 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#8B949E', letterSpacing: 1 },
  findingsCount: { 
    backgroundColor: '#30363D', color: '#E6EDF3', 
    fontSize: 10, fontWeight: 'bold', 
    paddingHorizontal: 6, paddingVertical: 2, 
    borderRadius: 4 
  },
  searchInput: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    color: '#E6EDF3',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  filterRow: { gap: 8, paddingBottom: 14 },
  filterBtn: {
    borderWidth: 1,
    borderColor: '#30363D',
    backgroundColor: '#161B22',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  filterBtnActive: { borderColor: '#00D1FF', backgroundColor: '#0D1117' },
  filterText: { color: '#8B949E', fontSize: 11, fontWeight: '700' },
  filterTextActive: { color: '#00D1FF' },
  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  actionBtn: {
    flex: 1,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#161B22',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  actionText: { color: '#00D1FF', fontSize: 12, fontWeight: '700' },

  vulnWrapper: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    marginBottom: 12,
    overflow: 'hidden',
  },
  vulnRow: { padding: 16 },
  vulnRowActive: { borderBottomWidth: 1, borderBottomColor: '#30363D' },
  vulnHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vulnTitle: { fontSize: 15, fontWeight: '700', color: '#E6EDF3', marginBottom: 2 },
  vulnMetaRow: { flexDirection: 'row', alignItems: 'center' },
  vulnLine: { fontSize: 12, color: '#8B949E', fontWeight: '600' },
  vulnOwasp: { fontSize: 12, color: '#58A6FF', fontWeight: '600' },
  
  vulnBody: { padding: 16, gap: 12, backgroundColor: '#0D1117' },
  sectionLabel: { fontSize: 10, fontWeight: 'bold', color: '#484F58', letterSpacing: 0.5 },
  vulnExplain: { fontSize: 14, color: '#C9D1D9', lineHeight: 22 },
  
  chatLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0D1117',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30363D',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  chatLinkText: {
    color: '#00D1FF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  
  fixBlock: {
    backgroundColor: '#161B22', borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: '#30363D',
    gap: 12,
  },
  fixCode: { fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#7EE787', lineHeight: 20 },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#0D1117',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1, borderColor: '#30363D',
  },
  copyBtnText: { color: '#00D1FF', fontSize: 12, fontWeight: 'bold' },

  cleanContainer: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  cleanText: { color: '#E6EDF3', fontSize: 18, fontWeight: 'bold' },
  cleanSub: { color: '#8B949E', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  newScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  newScanText: {
    color: '#00D1FF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  outputPanel: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 16,
    gap: 10,
    marginTop: 12,
  },
  outputTitle: { color: '#E6EDF3', fontSize: 16, fontWeight: 'bold' },
  outputMeta: { color: '#8B949E', fontSize: 12, fontWeight: '700' },
  outputText: { color: '#C9D1D9', fontSize: 13, lineHeight: 20 },
  beforeAfterGrid: { gap: 12 },
  codeColumn: { gap: 6 },
  codeLabel: { color: '#8B949E', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  codeBlock: {
    backgroundColor: '#0D1117',
    color: '#7EE787',
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  originalBlock: { color: '#FFB4A9' },
});

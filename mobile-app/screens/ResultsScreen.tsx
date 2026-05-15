import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScanResult, Vulnerability, getHistory } from '../api/scan';
import { SeverityBadge } from '../components/SeverityBadge';

const { width } = Dimensions.get('window');

const RISK_COLOR = (s: number) => s >= 70 ? '#FF4D4D' : s >= 40 ? '#D29922' : '#3FB950';

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

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={['#1A1D23', '#0D1117']}
        style={styles.summaryCard}
      >
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

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>DETAILED FINDINGS</Text>
        <Text style={styles.findingsCount}>{vulnerabilities.length}</Text>
      </View>

      {vulnerabilities.length === 0 && (
        <View style={styles.cleanContainer}>
          <Ionicons name="checkmark-circle" size={48} color="#3FB950" />
          <Text style={styles.cleanText}>Your code is secure!</Text>
          <Text style={styles.cleanSub}>No vulnerabilities were detected by our engine.</Text>
        </View>
      )}

      {vulnerabilities.map(v => (
        <VulnRow 
          key={v.id} 
          v={v} 
          code={activeCode} 
          language={activeLang} 
          navigation={navigation} 
        />
      ))}
      
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

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#8B949E', letterSpacing: 1 },
  findingsCount: { 
    backgroundColor: '#30363D', color: '#E6EDF3', 
    fontSize: 10, fontWeight: 'bold', 
    paddingHorizontal: 6, paddingVertical: 2, 
    borderRadius: 4 
  },

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
});


import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScanResult, scanCode } from '../api/scan';
import { scanDependencies, scanRepo, DepScanResult, RepoScanResult } from '../api/advanced';

const PLACEHOLDER = `# paste your code here
import sqlite3

def get_user(username):
    conn = sqlite3.connect('users.db')
    query = f"SELECT * FROM users WHERE name = '{username}'"
    cursor = conn.cursor()
    cursor.execute(query)
    return cursor.fetchone()
`;

const DEMO_CODE = `import sqlite3
from flask import Flask, request

app = Flask(__name__)
app.config["SECRET_KEY"] = "dev-secret"

def get_user():
    username = request.args.get("username")
    conn = sqlite3.connect("users.db")
    query = f"SELECT * FROM users WHERE username = '{username}'"
    return conn.execute(query).fetchone()
`;

const DEMO_RESULT: ScanResult = {
  scan_id: 'demo-scan',
  id: 'demo-scan',
  language: 'python',
  risk_score: 92,
  summary: 'Critical SQL injection and hardcoded secret detected in the demo Flask handler.',
  filename: 'demo_app.py',
  created_at: new Date().toISOString(),
  vulnerabilities: [
    {
      id: 'demo-1',
      title: 'SQL Injection via f-string query',
      severity: 'CRITICAL',
      line: '9',
      owasp: 'A03:2021',
      cwe: 'CWE-89',
      rule_id: 'python.sql-injection',
      explanation: 'The query interpolates user-controlled input directly into SQL. An attacker can alter the query structure and read or modify unauthorized records.',
      fix: 'conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()',
    },
    {
      id: 'demo-2',
      title: 'Hardcoded application secret',
      severity: 'HIGH',
      line: '5',
      owasp: 'A02:2021',
      cwe: 'CWE-798',
      rule_id: 'python.hardcoded-secret',
      explanation: 'The app secret is committed in source code. If leaked, attackers may forge sessions or bypass trust boundaries.',
      fix: 'app.config["SECRET_KEY"] = os.environ["SECRET_KEY"]',
    },
  ],
};

export default function ScanScreen({ navigation }: any) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [scanning, setScanning] = useState(false);
  const [mode, setMode] = useState<'code' | 'deps' | 'repo'>('code');
  const [filename, setFilename] = useState('requirements.txt');
  const [repoUrl, setRepoUrl] = useState('');
  const [depResult, setDepResult] = useState<DepScanResult | null>(null);
  const [repoResult, setRepoResult] = useState<RepoScanResult | null>(null);
  const [progress, setProgress] = useState('');

  const LANGUAGES = [
    { label: 'Python', value: 'python', icon: 'logo-python' },
    { label: 'JS/TS', value: 'javascript', icon: 'logo-javascript' },
    { label: 'Go', value: 'go', icon: 'code-slash' },
    { label: 'Java', value: 'java', icon: 'cafe' },
    { label: 'C#', value: 'csharp', icon: 'code-slash' }
  ];

  async function handleScan() {
    if (mode === 'repo') {
      if (!repoUrl.trim()) {
        Alert.alert('Missing repository', 'Enter a GitHub repository URL.');
        return;
      }
      setScanning(true);
      setRepoResult(null);
      setProgress('Starting repository scan...');
      try {
        const result = await scanRepo(repoUrl.trim(), (pct, message) => {
          setProgress(`${pct}% - ${message}`);
        });
        setRepoResult(result);
        setProgress('Repository scan complete.');
      } catch (e: any) {
        Alert.alert('Repo scan failed', e.message ?? 'Unknown error');
      } finally {
        setScanning(false);
      }
      return;
    }

    if (mode === 'deps') {
      if (!code.trim()) {
        Alert.alert('Empty dependency file', 'Paste requirements.txt or pyproject.toml content.');
        return;
      }
      setScanning(true);
      setDepResult(null);
      try {
        const result = await scanDependencies(code, filename || 'requirements.txt');
        setDepResult(result);
      } catch (e: any) {
        Alert.alert('Dependency scan failed', e.message ?? 'Unknown error');
      } finally {
        setScanning(false);
      }
      return;
    }

    if (!code.trim()) {
      Alert.alert('Empty code', 'Please paste some code to analyze.');
      return;
    }
    setScanning(true);
    try {
      const result = await scanCode(code, language);
      setCode(''); // Clear the input for the next scan
      navigation.navigate('Results', { result, code, language });
    } catch (e: any) {
      Alert.alert('Scan failed', e.message ?? 'Unknown error');
    } finally {
      setScanning(false);
    }
  }

  function loadDemoSnippet() {
    setMode('code');
    setLanguage('python');
    setCode(DEMO_CODE);
    setDepResult(null);
    setRepoResult(null);
    setProgress('');
  }

  function openDemoResults() {
    navigation.navigate('Results', { result: DEMO_RESULT, code: DEMO_CODE, language: 'python' });
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>New Analysis</Text>
        <Text style={styles.subtitle}>Choose a scan type and provide the source material.</Text>

        <View style={styles.demoPanel}>
          <View style={styles.demoIcon}>
            <Ionicons name="flash-outline" size={18} color="#00D1FF" />
          </View>
          <View style={styles.demoCopy}>
            <Text style={styles.demoTitle}>Competition Demo</Text>
            <Text style={styles.demoText}>Show a full scan story in seconds with a vulnerable sample.</Text>
          </View>
          <View style={styles.demoActions}>
            <TouchableOpacity style={styles.demoBtn} onPress={loadDemoSnippet}>
              <Text style={styles.demoBtnText}>Load</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.demoBtn, styles.demoBtnPrimary]} onPress={openDemoResults}>
              <Text style={[styles.demoBtnText, styles.demoBtnTextPrimary]}>Run</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.modeRow}>
          {[
            { label: 'Code', value: 'code', icon: 'code-slash-outline' },
            { label: 'Deps', value: 'deps', icon: 'cube-outline' },
            { label: 'Repo', value: 'repo', icon: 'git-branch-outline' },
          ].map(item => (
            <TouchableOpacity
              key={item.value}
              style={[styles.modeBtn, mode === item.value && styles.modeBtnActive]}
              onPress={() => setMode(item.value as 'code' | 'deps' | 'repo')}
            >
              <Ionicons name={item.icon as any} size={16} color={mode === item.value ? '#00D1FF' : '#8B949E'} />
              <Text style={[styles.modeText, mode === item.value && styles.modeTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'code' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langScroll}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity 
                key={lang.value} 
                style={[styles.pill, language === lang.value && styles.pillActive]}
                onPress={() => setLanguage(lang.value)}
              >
                <Ionicons 
                  name={lang.icon as any} 
                  size={14} 
                  color={language === lang.value ? '#00D1FF' : '#8B949E'} 
                />
                <Text style={[styles.pillText, language === lang.value && styles.pillTextActive]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {mode === 'deps' && (
          <TextInput
            style={styles.filenameInput}
            value={filename}
            onChangeText={setFilename}
            placeholder="requirements.txt"
            placeholderTextColor="#484F58"
            autoCapitalize="none"
          />
        )}

        {mode === 'repo' && (
          <TextInput
            style={styles.filenameInput}
            value={repoUrl}
            onChangeText={setRepoUrl}
            placeholder="https://github.com/org/repo"
            placeholderTextColor="#484F58"
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}

        {mode !== 'repo' && <View style={styles.inputContainer}>
          <TextInput
            style={styles.codeInput}
            multiline
            value={code}
            onChangeText={setCode}
            placeholder={mode === 'deps' ? 'fastapi==0.111.0\nrequests==2.19.0' : PLACEHOLDER}
            placeholderTextColor="#484F58"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
          />
        </View>}

        <TouchableOpacity
          style={styles.scanBtnContainer}
          onPress={handleScan}
          disabled={scanning}
        >
          <LinearGradient
            colors={scanning ? ['#003E4D', '#003E4D'] : ['#00D1FF', '#00A3FF']}
            style={styles.scanBtn}
          >
            {scanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.scanBtnText}>
                  {mode === 'code' ? 'Audit Snippet' : mode === 'deps' ? 'Scan Dependencies' : 'Scan Repository'}
                </Text>
                <Ionicons name="shield-checkmark-outline" size={20} color="#000" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {!!progress && mode === 'repo' && <Text style={styles.hint}>{progress}</Text>}

        {depResult && (
          <View style={styles.resultPanel}>
            <Text style={styles.panelTitle}>Dependency Results</Text>
            <Text style={styles.panelText}>{depResult.vulnerable_count} of {depResult.total} dependencies are vulnerable.</Text>
            {depResult.dependencies.filter(dep => dep.status === 'vulnerable').slice(0, 5).map(dep => (
              <Text key={dep.name} style={styles.panelItem}>{dep.name}: {dep.severity} ({dep.vulns.length})</Text>
            ))}
          </View>
        )}

        {repoResult && (
          <View style={styles.resultPanel}>
            <Text style={styles.panelTitle}>Repository Results</Text>
            <Text style={styles.panelText}>{repoResult.files_scanned} files scanned, {repoResult.total_vulnerabilities} findings.</Text>
            {repoResult.results.slice(0, 5).map(item => (
              <Text key={item.file} style={styles.panelItem}>{item.file}: {item.vulnerabilities.length} findings</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1117' },
  content: { padding: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#E6EDF3' },
  subtitle: { fontSize: 14, color: '#8B949E', marginBottom: 8 },
  demoPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 14,
  },
  demoIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0D1117',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  demoCopy: { flex: 1 },
  demoTitle: { color: '#E6EDF3', fontWeight: 'bold', fontSize: 14 },
  demoText: { color: '#8B949E', fontSize: 12, lineHeight: 17, marginTop: 2 },
  demoActions: { flexDirection: 'row', gap: 8 },
  demoBtn: {
    minWidth: 48,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30363D',
    backgroundColor: '#0D1117',
  },
  demoBtnPrimary: { backgroundColor: '#00D1FF', borderColor: '#00D1FF' },
  demoBtnText: { color: '#00D1FF', fontWeight: 'bold', fontSize: 12 },
  demoBtnTextPrimary: { color: '#0D1117' },
  
  langScroll: { gap: 10, paddingBottom: 10 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#161B22', borderRadius: 99,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: '#30363D',
  },
  pillActive: {
    borderColor: '#00D1FF',
    backgroundColor: '#0D1117',
  },
  pillText: { fontSize: 13, color: '#8B949E', fontWeight: '600' },
  pillTextActive: { color: '#00D1FF' },

  inputContainer: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    overflow: 'hidden',
  },
  codeInput: {
    padding: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: '#E6EDF3',
    minHeight: 350,
    textAlignVertical: 'top',
  },

  scanBtnContainer: {
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#00D1FF',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
  },
  scanBtn: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  scanBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
  hint: { fontSize: 12, color: '#484F58', textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#30363D',
    backgroundColor: '#161B22',
    borderRadius: 12,
  },
  modeBtnActive: { borderColor: '#00D1FF', backgroundColor: '#0D1117' },
  modeText: { color: '#8B949E', fontWeight: '700', fontSize: 13 },
  modeTextActive: { color: '#00D1FF' },
  filenameInput: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    color: '#E6EDF3',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  resultPanel: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 16,
    gap: 8,
  },
  panelTitle: { color: '#E6EDF3', fontWeight: 'bold', fontSize: 16 },
  panelText: { color: '#8B949E', fontSize: 13 },
  panelItem: { color: '#C9D1D9', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});

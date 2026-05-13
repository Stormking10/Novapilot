import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { scanCode } from '../api/scan';

const PLACEHOLDER = `# paste your Python code here
import sqlite3

def get_user(username):
    conn = sqlite3.connect('users.db')
    query = f"SELECT * FROM users WHERE name = '{username}'"
    cursor = conn.cursor()
    cursor.execute(query)
    return cursor.fetchone()
`;

export default function ScanScreen({ navigation }: any) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [scanning, setScanning] = useState(false);

  const LANGUAGES = [
    { label: 'Python', value: 'python' },
    { label: 'JS/TS', value: 'javascript' },
    { label: 'Go', value: 'go' },
    { label: 'Java', value: 'java' },
    { label: 'C#', value: 'csharp' }
  ];

  async function handleScan() {
    if (!code.trim()) {
      Alert.alert('No code', 'Please paste some Python code to scan.');
      return;
    }
    setScanning(true);
    try {
      const result = await scanCode(code, language);
      navigation.navigate('Results', { result });
    } catch (e: any) {
      Alert.alert('Scan failed', e.message ?? 'Unknown error');
    } finally {
      setScanning(false);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langScroll}>
        {LANGUAGES.map((lang) => (
          <TouchableOpacity 
            key={lang.value} 
            style={[styles.pill, language === lang.value && styles.pillActive]}
            onPress={() => setLanguage(lang.value)}
          >
            <View style={[styles.pillDot, language === lang.value && styles.pillDotActive]} />
            <Text style={[styles.pillText, language === lang.value && styles.pillTextActive]}>
              {lang.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Paste your {LANGUAGES.find(l => l.value === language)?.label || 'code'} code</Text>
      <TextInput
        style={styles.codeInput}
        multiline
        value={code}
        onChangeText={setCode}
        placeholder={PLACEHOLDER}
        placeholderTextColor="#AAA"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />

      <TouchableOpacity
        style={[styles.scanBtn, scanning && styles.scanBtnDisabled]}
        onPress={handleScan}
        disabled={scanning}
      >
        {scanning
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.scanBtnText}>Scan for vulnerabilities</Text>
        }
      </TouchableOpacity>

      <Text style={styles.hint}>
        Powered by Semgrep static analysis + Claude AI explanation engine.
        Results appear on the Results tab.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1117' },
  content: { padding: 20, gap: 14 },
  langScroll: { gap: 8, paddingBottom: 10 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#21262D', borderRadius: 99,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#30363D',
  },
  pillActive: {
    backgroundColor: '#161B22',
    borderColor: '#00D1FF',
  },
  pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#484F58' },
  pillDotActive: { backgroundColor: '#00D1FF', shadowColor: '#00D1FF', shadowRadius: 4, shadowOpacity: 0.8 },
  pillText: { fontSize: 12, color: '#8B949E', fontWeight: '500' },
  pillTextActive: { color: '#00D1FF', fontWeight: 'bold' },
  label: { fontSize: 13, fontWeight: '600', color: '#C9D1D9', marginBottom: 4 },
  codeInput: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#E6EDF3',
    minHeight: 280,
    textAlignVertical: 'top',
    lineHeight: 20,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  scanBtn: {
    backgroundColor: '#00D1FF', borderRadius: 12,
    padding: 16, alignItems: 'center',
    shadowColor: '#00D1FF', shadowOpacity: 0.5, shadowRadius: 10, 
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  scanBtnDisabled: { opacity: 0.5, backgroundColor: '#006680' },
  scanBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
  hint: { fontSize: 12, color: '#484F58', textAlign: 'center', lineHeight: 18, marginTop: 10 },
});
